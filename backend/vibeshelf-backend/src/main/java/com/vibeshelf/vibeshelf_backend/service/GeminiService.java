package com.vibeshelf.vibeshelf_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibeshelf.vibeshelf_backend.dto.BookRecommendation;
import com.vibeshelf.vibeshelf_backend.dto.ConversationMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import com.vibeshelf.vibeshelf_backend.repository.BookRepository;
import com.vibeshelf.vibeshelf_backend.model.Book;
import org.springframework.data.domain.PageRequest;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class GeminiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final SimpleBookRecommenderService fallbackRecommender;
    private final BookRepository bookRepository;

    @Value("${groq.api-key:}")
    private String groqApiKey;

    @Value("${groq.api-url:}")
    private String groqApiUrl;

    @Value("${groq.model:}")
    private String groqModel;

    private static final String BOOKTOK_SYSTEM_PROMPT =
        "You are a BookTok book recommendation expert. ONLY recommend FAMOUS, well-known BookTok books/authors (2024). " +
        "Never recommend obscure, self-published, non-English, or children's books. " +
        "Every book must have 100k+ Goodreads ratings. " +
        "Respond with a JSON array only: [{\"title\":\"...\",\"author\":\"...\",\"reason\":\"...\"}]. " +
        "No markdown, no code fences, no explanation. Recommend exactly 10 books per request. " +
        "Never repeat a book already recommended in this conversation. If the user asks 'see more' or similar, return 10 different books (next page).";

    // Curated BookTok / popular titles -> canonical author mapping (lower-cased keys)
    private static final LinkedHashMap<String, String> POPULAR_TITLE_TO_AUTHOR = new LinkedHashMap<>();
    static {
        POPULAR_TITLE_TO_AUTHOR.put("it ends with us", "Colleen Hoover");
        POPULAR_TITLE_TO_AUTHOR.put("verity", "Colleen Hoover");
        POPULAR_TITLE_TO_AUTHOR.put("ugly love", "Colleen Hoover");
        POPULAR_TITLE_TO_AUTHOR.put("the housemaid", "Freida McFadden");
        POPULAR_TITLE_TO_AUTHOR.put("the silent patient", "Alex Michaelides");
        POPULAR_TITLE_TO_AUTHOR.put("gone girl", "Gillian Flynn");
        POPULAR_TITLE_TO_AUTHOR.put("the girl on the train", "Paula Hawkins");
        POPULAR_TITLE_TO_AUTHOR.put("fourth wing", "Rebecca Yarros");
        POPULAR_TITLE_TO_AUTHOR.put("a court of thorns and roses", "Sarah J. Maas");
        POPULAR_TITLE_TO_AUTHOR.put("the love hypothesis", "Ali Hazelwood");
        POPULAR_TITLE_TO_AUTHOR.put("people we meet on vacation", "Emily Henry");
        POPULAR_TITLE_TO_AUTHOR.put("the seven husbands of evelyn hugo", "Taylor Jenkins Reid");
        POPULAR_TITLE_TO_AUTHOR.put("daisy jones & the six", "Taylor Jenkins Reid");
        POPULAR_TITLE_TO_AUTHOR.put("malibu rising", "Taylor Jenkins Reid");
        POPULAR_TITLE_TO_AUTHOR.put("the song of achilles", "Madeline Miller");
        POPULAR_TITLE_TO_AUTHOR.put("the inheritance games", "Jennifer Lynn Barnes");
        POPULAR_TITLE_TO_AUTHOR.put("beach read", "Emily Henry");
        POPULAR_TITLE_TO_AUTHOR.put("book lovers", "Emily Henry");
        POPULAR_TITLE_TO_AUTHOR.put("the spanish love deception", "Elena Armas");
        POPULAR_TITLE_TO_AUTHOR.put("it starts with us", "Colleen Hoover");
    }

    private final Map<String, List<ConversationMessage>> conversationHistory = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> shownBooks = new ConcurrentHashMap<>();
    private final Map<String, String> sessionMood = new ConcurrentHashMap<>();

    public GeminiService(RestTemplate restTemplate,
                         ObjectMapper objectMapper,
                         SimpleBookRecommenderService fallbackRecommender,
                         BookRepository bookRepository) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.fallbackRecommender = fallbackRecommender;
        this.bookRepository = bookRepository;
        log.info("✅ GeminiService (GROQ-backed) initialized");
    }

    public List<BookRecommendation> chat(String sessionId, String userMessage) {
        log.info("chat called: session={}, message={}", sessionId, userMessage);
        if (groqApiKey == null || groqApiKey.isBlank() || groqApiUrl == null || groqApiUrl.isBlank()) {
            log.warn("GROQ key or url missing — using fallback");
            return fallbackRecommender.getRecommendationsByMood(userMessage);
        }

        conversationHistory.putIfAbsent(sessionId, buildInitialHistory());
        shownBooks.putIfAbsent(sessionId, new HashSet<>());

        String intent = classifyIntent(userMessage);
        String mood = "RETRY".equals(intent) ? sessionMood.getOrDefault(sessionId, userMessage) : userMessage;
        if (!"RETRY".equals(intent)) { sessionMood.put(sessionId, mood); shownBooks.get(sessionId).clear(); }

        String userTurn = buildUserTurn(intent, mood, shownBooks.get(sessionId));
        List<ConversationMessage> history = conversationHistory.get(sessionId);
        if (history.size() > 1) history.subList(1, history.size()).clear();
        history.add(new ConversationMessage("user", userTurn));

        String reply = callGroq(userTurn);

        history.clear(); history.add(new ConversationMessage("user", BOOKTOK_SYSTEM_PROMPT)); history.add(new ConversationMessage("model", reply));

        List<BookRecommendation> recs = parseJsonArray(reply);

        // Strict post-filtering: prefer curated/popular BookTok titles/authors.
        // Scoring and ranking: prefer curated/popular titles, then books present in local DB
        Map<BookRecommendation, Double> score = new LinkedHashMap<>();
        Set<String> seen = new HashSet<>();

        for (BookRecommendation r : recs) {
            String titleKey = r.getTitle() == null ? "" : r.getTitle().toLowerCase().trim();
            if (titleKey.isBlank() || seen.contains(titleKey)) continue;
            seen.add(titleKey);

            double s = 0.0;
            // high boost if in curated popular list
            if (POPULAR_TITLE_TO_AUTHOR.containsKey(titleKey)) s += 2.0;
            // medium boost if author matches curated list
            String authorKey = r.getAuthor() == null ? "" : r.getAuthor().toLowerCase().trim();
            if (!authorKey.isBlank() && POPULAR_TITLE_TO_AUTHOR.containsValue(capitalizeAuthor(authorKey))) s += 1.5;

            // small boost if the title exists in the local DB (indicates availability/popularity in your dataset)
            try {
                List<Book> found = bookRepository.findByTitleOrAuthorLike(r.getTitle(), PageRequest.of(0,1)).getContent();
                if (!found.isEmpty()) s += 1.0;
            } catch (Exception ignored) { }

            // slight penalty if this title was already shown in this session
            if (shownBooks.get(sessionId).contains(titleKey)) s -= 1.0;

            score.put(r, s);
        }

        // Add top curated fills if score count is low
        if (score.size() < 5) {
            for (Map.Entry<String, String> e : POPULAR_TITLE_TO_AUTHOR.entrySet()) {
                if (score.size() >= 5) break;
                String title = e.getKey();
                if (seen.contains(title)) continue;
                if (shownBooks.get(sessionId).contains(title)) continue;
                BookRecommendation br = new BookRecommendation(capitalizeTitle(title), e.getValue(), "A very popular BookTok pick that fits this vibe.", "", "");
                score.put(br, 0.5);
                seen.add(title);
            }
        }

        // Sort by score descending and return top 5
        List<Map.Entry<BookRecommendation, Double>> sorted = new ArrayList<>(score.entrySet());
        sorted.sort((a,b) -> Double.compare(b.getValue(), a.getValue()));

        List<BookRecommendation> result = new ArrayList<>();
        for (Map.Entry<BookRecommendation, Double> e : sorted) {
            if (result.size() >= 5) break;
            result.add(e.getKey());
            shownBooks.get(sessionId).add(e.getKey().getTitle().toLowerCase());
        }

        if (result.isEmpty()) return fallbackRecommender.getRecommendationsByMood(mood);
        return result;
    }

    // Small helpers to produce nicer title/author casing when filling from curated map
    private static String capitalizeTitle(String t) {
        if (t == null) return "";
        String[] parts = t.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) sb.append(' ');
            String p = parts[i];
            if (p.length() == 0) continue;
            sb.append(Character.toUpperCase(p.charAt(0))).append(p.substring(1));
        }
        return sb.toString();
    }

    private static String capitalizeAuthor(String a) {
        if (a == null) return "";
        String[] parts = a.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) sb.append(' ');
            String p = parts[i];
            if (p.length() == 0) continue;
            sb.append(Character.toUpperCase(p.charAt(0))).append(p.substring(1));
        }
        return sb.toString();
    }

    private List<ConversationMessage> buildInitialHistory() { List<ConversationMessage> h = new ArrayList<>(); h.add(new ConversationMessage("user", BOOKTOK_SYSTEM_PROMPT)); return h; }

    public void clearSession(String sessionId) { conversationHistory.remove(sessionId); shownBooks.remove(sessionId); sessionMood.remove(sessionId); log.info("Cleared session {}", sessionId); }

    private String classifyIntent(String msg) { if (msg==null) return "NEW_MOOD"; String l = msg.toLowerCase(); List<String> p = List.of("no","nope","not these","something else","try again","another","more","show more","skip","nah","not it","meh"); for (String s: p) if (l.contains(s)) return "RETRY"; return "NEW_MOOD"; }

    private String buildUserTurn(String intent, String mood, Set<String> shown) {
        String shownList = (shown == null || shown.isEmpty()) ? "" : " Do NOT repeat these already recommended books: " + String.join(", ", shown) + ".";
        if ("RETRY".equals(intent)) return "Recommend 10 DIFFERENT famous BookTok books for the same vibe: \"" + mood + "\"." + shownList + " JSON array only.";
        return "Vibe: \"" + mood + "\"." + shownList + " Recommend exactly 10 FAMOUS BookTok books for this vibe. Every book must have at least 100,000 ratings on Goodreads. JSON array only.";
    }

    @SuppressWarnings({"null", "squid:S1149"})
    private String callGroq(String userTurn) {
        // Defensive: ensure API url/key are present before attempting to call.
        if (groqApiKey == null || groqApiKey.isBlank() || groqApiUrl == null || groqApiUrl.isBlank()) {
            log.warn("GROQ key or url missing when calling callGroq — aborting and returning empty array.");
            return "[]";
        }

        try {
            Map<String,Object> body = new HashMap<>();
            body.put("model", groqModel);
            List<Map<String,String>> messages = new ArrayList<>();
            messages.add(Map.of("role","system","content", BOOKTOK_SYSTEM_PROMPT));
            messages.add(Map.of("role","user","content", userTurn));
            body.put("messages", messages);
            body.put("temperature", 0.7);
            body.put("max_tokens", 2048);

            HttpHeaders headers = new HttpHeaders(); headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);
            HttpEntity<Map<String,Object>> req = new HttpEntity<>(body, headers);
            @SuppressWarnings("unchecked") Map<String,Object> resp = restTemplate.postForObject(groqApiUrl, req, Map.class);

            if (resp == null) return "[]";

            JsonNode root = objectMapper.valueToTree(resp);
            String text = null;

            // Try common OpenAI/GROQ shape: choices[0].message.content
            JsonNode choices = root.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                JsonNode first = choices.get(0);
                // message.content
                JsonNode content = first.path("message").path("content");
                if (!content.isMissingNode() && (content.isTextual() || content.isObject() || content.isArray())) {
                    if (content.isTextual()) text = content.asText(); else text = content.toString();
                }
                // fallback to choices[0].text
                if ((text == null || text.isBlank()) && first.has("text")) {
                    JsonNode t = first.path("text"); if (!t.isMissingNode()) text = t.asText("");
                }
            }

            // Ollama-like responses may put the generated text at top-level "response"
            if ((text == null || text.isBlank()) && root.has("response")) {
                JsonNode r = root.path("response"); text = r.isTextual() ? r.asText() : r.toString();
            }

            // Generic fallback: try some other common fields
            if (text == null || text.isBlank()) {
                if (root.has("output")) { JsonNode out = root.path("output"); text = out.isTextual() ? out.asText() : out.toString(); }
            }

            // If still blank or too short, retry once with lower temperature
            if (text == null || text.trim().length() < 20) {
                log.debug("GROQ response too short, retrying with lower temperature. Raw response: {}", resp);
                body.put("temperature", 0.2);
                HttpEntity<Map<String,Object>> req2 = new HttpEntity<>(body, headers);
                @SuppressWarnings("unchecked") Map<String,Object> resp2 = restTemplate.postForObject(groqApiUrl, req2, Map.class);
                if (resp2 == null) return "[]";
                JsonNode root2 = objectMapper.valueToTree(resp2);
                // repeat extraction steps
                JsonNode choices2 = root2.path("choices");
                if (choices2.isArray() && choices2.size() > 0) {
                    JsonNode first2 = choices2.get(0);
                    JsonNode content2 = first2.path("message").path("content");
                    if (!content2.isMissingNode()) {
                        text = content2.isTextual() ? content2.asText() : content2.toString();
                    }
                    if ((text == null || text.isBlank()) && first2.has("text")) text = first2.path("text").asText("");
                }
                if ((text == null || text.isBlank()) && root2.has("response")) {
                    JsonNode r2 = root2.path("response"); text = r2.isTextual() ? r2.asText() : r2.toString();
                }
                if ((text == null || text.isBlank()) && root2.has("output")) text = root2.path("output").toString();
            }

            if (text == null) return "[]";

            // Sanitize typical wrappers (code fences, markdown, leading content before the JSON)
            String cleaned = text.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();
            // If the model appended text before the JSON array, attempt to extract from first '[' to last ']' 
            int s = cleaned.indexOf('[');
            int e = cleaned.lastIndexOf(']');
            if (s >= 0 && e > s) cleaned = cleaned.substring(s, e+1);

            return cleaned;
        } catch (Exception e) {
            log.error("GROQ call failed: {}", e.getMessage(), e);
            return "[]";
        }
    }

    private List<BookRecommendation> parseJsonArray(String jsonText) {
        List<BookRecommendation> out = new ArrayList<>();
        try {
            if (jsonText==null) return out;
            String cleaned = jsonText.replaceAll("(?s)```json\\s*","" ).replaceAll("(?s)```\\s*","" ).trim();
            Set<String> seen = new HashSet<>();

            // First try: extract first JSON array and parse fully
            int s = cleaned.indexOf('[');
            int e = cleaned.lastIndexOf(']');
            if (s >= 0 && e > s) {
                try {
                    JsonNode arr = objectMapper.readTree(cleaned.substring(s,e+1));
                    if (arr.isArray()) {
                        for (JsonNode it: arr) {
                            String title = it.path("title").asText("").trim();
                            String author = it.path("author").asText("").trim();
                            String reason = it.path("reason").asText("").trim();
                            if (title.isBlank()||author.isBlank()) continue;
                            author = author.replaceAll("\\s*\\(.*?\\)","").trim();
                            String k = title.toLowerCase(); if (seen.contains(k)) continue; seen.add(k);
                            if (reason.toLowerCase().matches(".*(hits different|pure vibes|mood match|right here|giving exactly|speaks to|total mood|new obsession|perfect vibe|trust me).*")) reason = "A popular BookTok pick that fits this vibe.";
                            out.add(new BookRecommendation(title, author, reason, "", ""));
                        }
                        if (!out.isEmpty()) return out;
                    }
                } catch (Exception ignored) {
                    // fallthrough to object extraction
                }
            }

            // Fallback: extract individual JSON objects like { ... } and parse them separately
            // This handles truncated or malformed arrays like '[{..},{..}, {..]'
            java.util.regex.Pattern objPat = java.util.regex.Pattern.compile("\\\\{.*?\\\\}", java.util.regex.Pattern.DOTALL);
            java.util.regex.Matcher m = objPat.matcher(cleaned);
            while (m.find()) {
                String objText = m.group();
                try {
                    JsonNode it = objectMapper.readTree(objText);
                    String title = it.path("title").asText("").trim();
                    String author = it.path("author").asText("").trim();
                    String reason = it.path("reason").asText("").trim();
                    if (title.isBlank()||author.isBlank()) continue;
                    author = author.replaceAll("\\s*\\(.*?\\)","").trim();
                    String k = title.toLowerCase(); if (seen.contains(k)) continue; seen.add(k);
                    if (reason.toLowerCase().matches(".*(hits different|pure vibes|mood match|right here|giving exactly|speaks to|total mood|new obsession|perfect vibe|trust me).*")) reason = "A popular BookTok pick that fits this vibe.";
                    out.add(new BookRecommendation(title, author, reason, null, null));
                } catch (Exception ex) {
                    // skip broken object
                }
            }
        } catch (Exception ex) { log.warn("parseJsonArray failed: {}", ex.getMessage()); }
        return out;
    }

}
