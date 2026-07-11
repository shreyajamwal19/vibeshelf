package com.vibeshelf.vibeshelf_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibeshelf.vibeshelf_backend.dto.BookRecommendation;
import com.vibeshelf.vibeshelf_backend.dto.ConversationMessage;
import lombok.extern.slf4j.Slf4j;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.context.event.EventListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ConcurrentLinkedDeque;
import com.vibeshelf.vibeshelf_backend.repository.BookRepository;
import com.vibeshelf.vibeshelf_backend.dto.RecommendationResult;
import com.vibeshelf.vibeshelf_backend.model.Book;
import org.springframework.data.domain.PageRequest;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class GroqService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final SimpleBookRecommenderService fallbackRecommender;
    private final BookRepository bookRepository;
    private final CoverResolverService coverResolverService;

    @Value("${groq.api-key:}")
    private String groqApiKey;

    @Value("${groq.api-url:}")
    private String groqApiUrl;

    @Value("${groq.model:}")
    private String groqModel;

    // Stage 1: Candidate Generation
    private static final String STAGE1_SYSTEM_PROMPT =
        "You are a master book recommender combining Goodreads editors, StoryGraph curators, experienced librarians, and literary critics.\n\n" +
        "Deeply analyze the user's vibe: emotional atmosphere, pacing, writing style, themes, character dynamics, reader intent, tone, and specifics.\n\n" +
        "Generate exactly 15 strong real books. Prioritize emotional/experiential match. Mix modern, award winners, classics, hidden gems, and popular titles when they fit. Avoid author/series repeats.\n\n" +
        "For reasons: Write like a real reader on Goodreads/Reddit/StoryGraph. Keep them short (15-35 words), conversational, and specific to why it matches the user's request.\n" +
        "Good style examples:\n" +
        "- \"If you liked the slow-burn tension in The Silent Patient, this has that same 'one more chapter' pull.\"\n" +
        "- \"Perfect if you're craving messy family drama and complicated relationships.\"\n" +
        "- \"This has the same cozy small-town feel but with way more romance.\"\n" +
        "- \"The mystery builds slowly and keeps throwing new twists at you.\"\n" +
        "- \"Great emotional read without being too heavy or depressing.\"\n" +
        "- \"The banter between characters is genuinely funny and addictive.\"\n" +
        "Never use words like: masterpiece, unforgettable, captivating, beautifully crafted, literary gem, atmospheric masterpiece, compelling narrative.\n\n" +
        "Output ONLY JSON array of 15 objects: [{\"title\":\"...\",\"author\":\"...\",\"reason\":\"...\"}].";

    // Stage 2: Critical Review & Refinement
    private static final String STAGE2_SYSTEM_PROMPT =
        "You are a ruthless senior literary editor reviewing book recommendations.\n\n" +
        "Review the 15 candidates for the user's vibe.\n" +
        "- Score each on real emotional/pacing/style/theme match (not popularity).\n" +
        "- Replace any with confidence < 90.\n" +
        "- Ensure diversity: no repeated authors, varied styles and tones.\n" +
        "- Keep only the 10 strongest.\n\n" +
        "Rewrite reasons in natural reader style (Goodreads/Reddit/StoryGraph/BookTok voice):\n" +
        "- 1-2 short sentences, 15-35 words max.\n" +
        "- Conversational, specific to the user's request.\n" +
        "- Explain WHY this book fits their vibe.\n" +
        "- Avoid AI/marketing language: no 'masterpiece', 'captivating', 'unforgettable', 'rich tapestry', etc.\n\n" +
        "Return ONLY a clean JSON array of exactly 10 objects: [{\"title\":\"...\",\"author\":\"...\",\"reason\":\"...\"}].";

    // Emergency fallback - used ONLY when Groq fails
    private static final LinkedHashMap<String, String> EMERGENCY_FALLBACK = new LinkedHashMap<>();
    static {
        EMERGENCY_FALLBACK.put("the silent patient", "Alex Michaelides");
        EMERGENCY_FALLBACK.put("gone girl", "Gillian Flynn");
        EMERGENCY_FALLBACK.put("normal people", "Sally Rooney");
        EMERGENCY_FALLBACK.put("the song of achilles", "Madeline Miller");
        EMERGENCY_FALLBACK.put("project hail mary", "Andy Weir");
    }

    private final Map<String, List<ConversationMessage>> conversationHistory = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> shownBooks = new ConcurrentHashMap<>();
    private final Map<String, String> sessionMood = new ConcurrentHashMap<>();
    private final Map<String, Deque<List<BookRecommendation>>> prefetchedBatches = new ConcurrentHashMap<>();
    private final Set<String> prefetchInProgress = Collections.newSetFromMap(new ConcurrentHashMap<>());
    private final ExecutorService prefetchExecutor = Executors.newFixedThreadPool(2);

    public GroqService(RestTemplate restTemplate,
                       ObjectMapper objectMapper,
                       SimpleBookRecommenderService fallbackRecommender,
                       BookRepository bookRepository,
                       CoverResolverService coverResolverService) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.fallbackRecommender = fallbackRecommender;
        this.bookRepository = bookRepository;
        this.coverResolverService = coverResolverService;
        log.info("✅ GroqService (two-stage high-quality engine with natural reasons) initialized");
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initGroqConfiguration() {
        try {
            if (groqApiKey == null || groqApiKey.isBlank()) {
                String alt = System.getenv("GROQ_KEY");
                if (alt != null && !alt.isBlank()) groqApiKey = alt.trim();
                String alt2 = System.getenv("GROQ_APIKEY");
                if ((groqApiKey == null || groqApiKey.isBlank()) && alt2 != null && !alt2.isBlank()) groqApiKey = alt2.trim();
                String keyFile = System.getenv("GROQ_API_KEY_FILE");
                if ((groqApiKey == null || groqApiKey.isBlank()) && keyFile != null && !keyFile.isBlank()) {
                    try {
                        String fileContents = Files.readString(Path.of(keyFile)).trim();
                        if (!fileContents.isBlank()) groqApiKey = fileContents;
                    } catch (Exception ignored) {}
                }
                if (groqApiKey == null || groqApiKey.isBlank()) {
                    Path p = Path.of("/run/secrets/GROQ_API_KEY");
                    if (Files.exists(p)) {
                        try { groqApiKey = Files.readString(p).trim(); } catch (Exception ignored) {}
                    }
                }
            }

            if (groqApiUrl == null || groqApiUrl.isBlank()) {
                String altUrl = System.getenv("GROQ_API_URL");
                if (altUrl != null && !altUrl.isBlank()) groqApiUrl = altUrl.trim();
            }

            if (groqApiKey == null || groqApiKey.isBlank() || groqApiUrl == null || groqApiUrl.isBlank()) {
                log.warn("GROQ not configured — fallback only.");
            } else {
                log.info("GROQ two-stage engine ready.");
            }
        } catch (Exception e) {
            log.warn("GROQ config error: {}", e.getMessage());
        }
    }

    public RecommendationResult chat(String sessionId, String userMessage) {
        log.info("chat called: session={}, message={}", sessionId, userMessage);
        boolean haveGroq = !(groqApiKey == null || groqApiKey.isBlank() || groqApiUrl == null || groqApiUrl.isBlank());
        if (!haveGroq) {
            return fallbackResult(userMessage);
        }

        conversationHistory.putIfAbsent(sessionId, buildInitialHistory());
        shownBooks.putIfAbsent(sessionId, new HashSet<>());

        String intent = classifyIntent(userMessage);
        String mood = "RETRY".equals(intent) ? sessionMood.getOrDefault(sessionId, userMessage) : userMessage;
        if (!"RETRY".equals(intent)) {
            sessionMood.put(sessionId, mood);
            shownBooks.get(sessionId).clear();
        }

        prefetchedBatches.putIfAbsent(sessionId, new ConcurrentLinkedDeque<>());
        if ("RETRY".equals(intent)) {
            Deque<List<BookRecommendation>> q = prefetchedBatches.get(sessionId);
            List<BookRecommendation> page = q.isEmpty() ? null : q.pollFirst();
            if (page != null && !page.isEmpty()) {
                page.forEach(br -> shownBooks.get(sessionId).add(br.getTitle().toLowerCase()));
                asyncPrefetchNext(sessionId, mood);
                return new RecommendationResult("groq-prefetched", page);
            }
        }

        String userTurn = buildUserTurn(intent, mood, shownBooks.get(sessionId));

        // TWO-STAGE RECOMMENDATION
        List<BookRecommendation> candidates = generateCandidates(userTurn);
        List<BookRecommendation> refined = refineRecommendations(candidates, mood, shownBooks.get(sessionId));

        List<BookRecommendation> result = refined.isEmpty() ? fallbackRecommender.getRecommendationsByMood(mood, 10) : refined;

        if (result.isEmpty()) {
            return fallbackResult(mood);
        }

        result.forEach(this::enrichWithCoverAndIsbn);
        shownBooks.get(sessionId).addAll(result.stream().map(r -> r.getTitle().toLowerCase()).toList());

        asyncPrefetchNext(sessionId, mood);

        return new RecommendationResult("groq", result);
    }

    private List<BookRecommendation> generateCandidates(String userTurn) {
        String reply = callGroqWithSystem(STAGE1_SYSTEM_PROMPT, userTurn + " Return exactly 15 books.");
        return parseJsonArray(reply);
    }

    private List<BookRecommendation> refineRecommendations(List<BookRecommendation> candidates, String mood, Set<String> shown) {
        if (candidates.isEmpty()) return List.of();

        String candidatesJson = candidates.stream()
                .map(br -> String.format("{\"title\":\"%s\",\"author\":\"%s\",\"reason\":\"%s\"}",
                        escapeJson(br.getTitle()), escapeJson(br.getAuthor()), escapeJson(br.getReason())))
                .reduce((a, b) -> a + "," + b)
                .map(s -> "[" + s + "]")
                .orElse("[]");

        String reviewPrompt = "User vibe: \"" + mood + "\".\nPreviously shown: " + String.join(", ", shown) +
                "\n\nCandidates:\n" + candidatesJson + "\n\nReview and return the best 10 with natural reader-style reasons.";

        String refinedReply = callGroqWithSystem(STAGE2_SYSTEM_PROMPT, reviewPrompt);
        List<BookRecommendation> refined = parseJsonArray(refinedReply);

        if (refined.size() < 5) {
            log.warn("Refinement returned too few books, using top candidates");
            return candidates.subList(0, Math.min(10, candidates.size()));
        }
        return refined;
    }

    private String callGroqWithSystem(String systemPrompt, String userTurn) {
        if (groqApiKey == null || groqApiKey.isBlank() || groqApiUrl == null || groqApiUrl.isBlank()) {
            return "[]";
        }

        try {
            Map<String, Object> body = new HashMap<>();
            body.put("model", groqModel);
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            messages.add(Map.of("role", "user", "content", userTurn));
            body.put("messages", messages);
            body.put("temperature", 0.65);
            body.put("max_tokens", 3000);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);
            HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> resp = restTemplate.postForObject(groqApiUrl, req, Map.class);

            if (resp == null) return "[]";

            JsonNode root = objectMapper.valueToTree(resp);
            String text = extractContent(root);

            if (text == null || text.trim().length() < 150) {
                body.put("temperature", 0.5);
                @SuppressWarnings("unchecked")
                Map<String, Object> resp2 = restTemplate.postForObject(groqApiUrl,
                        new HttpEntity<>(body, headers), Map.class);
                if (resp2 != null) text = extractContent(objectMapper.valueToTree(resp2));
            }

            if (text == null) return "[]";

            String cleaned = text.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();
            int s = cleaned.indexOf('[');
            int e = cleaned.lastIndexOf(']');
            if (s >= 0 && e > s) cleaned = cleaned.substring(s, e + 1);
            return cleaned;
        } catch (Exception e) {
            log.error("Groq call failed: {}", e.getMessage());
            return "[]";
        }
    }

    private String extractContent(JsonNode root) {
        JsonNode choices = root.path("choices");
        if (choices.isArray() && choices.size() > 0) {
            JsonNode msg = choices.get(0).path("message").path("content");
            if (!msg.isMissingNode()) return msg.asText();
        }
        if (root.has("response")) return root.path("response").asText("");
        return "";
    }

    private RecommendationResult fallbackResult(String mood) {
        List<BookRecommendation> recs = fallbackRecommender.getRecommendationsByMood(mood, 10);
        recs.forEach(this::enrichWithCoverAndIsbn);
        return new RecommendationResult("fallback", recs);
    }

    private void enrichWithCoverAndIsbn(BookRecommendation rec) {
        if (rec == null) return;
        String title = rec.getTitle();
        String author = rec.getAuthor();
        if (title == null || author == null) return;

        bookRepository.findByTitleAndAuthorIgnoreCase(title, author).ifPresentOrElse(book -> {
            Book resolved = coverResolverService.resolveAndCacheCover(book);
            rec.setCoverUrl(resolved.getCoverUrl());
            rec.setIsbn(resolved.getIsbn());
        }, () -> {
            rec.setCoverUrl("https://placehold.co/128x192/FFE4EF/4A0F2A?text=No+Cover");
            rec.setIsbn("");
        });
    }

    private void asyncPrefetchNext(String sessionId, String mood) {
        if (prefetchInProgress.contains(sessionId)) return;
        prefetchInProgress.add(sessionId);
        prefetchedBatches.putIfAbsent(sessionId, new ConcurrentLinkedDeque<>());

        prefetchExecutor.submit(() -> {
            try {
                Set<String> shown = shownBooks.getOrDefault(sessionId, Collections.emptySet());
                String userTurn = "Same vibe: \"" + mood + "\". Avoid previously shown: " + String.join(", ", shown);
                List<BookRecommendation> candidates = generateCandidates(userTurn);
                List<BookRecommendation> refined = refineRecommendations(candidates, mood, shown);
                if (!refined.isEmpty()) {
                    prefetchedBatches.get(sessionId).addLast(refined);
                }
            } catch (Exception e) {
                log.debug("Prefetch failed: {}", e.getMessage());
            } finally {
                prefetchInProgress.remove(sessionId);
            }
        });
    }

    private List<ConversationMessage> buildInitialHistory() {
        List<ConversationMessage> h = new ArrayList<>();
        h.add(new ConversationMessage("user", STAGE1_SYSTEM_PROMPT));
        return h;
    }

    public void clearSession(String sessionId) {
        conversationHistory.remove(sessionId);
        shownBooks.remove(sessionId);
        sessionMood.remove(sessionId);
        prefetchedBatches.remove(sessionId);
        log.info("Cleared session {}", sessionId);
    }

    private String classifyIntent(String msg) {
        if (msg == null) return "NEW_MOOD";
        String l = msg.toLowerCase();
        List<String> retry = List.of("no", "nope", "not these", "something else", "try again", "another", "more",
                "show more", "skip", "nah", "not it", "meh", "different");
        return retry.stream().anyMatch(l::contains) ? "RETRY" : "NEW_MOOD";
    }

    private String buildUserTurn(String intent, String mood, Set<String> shown) {
        String avoids = shown.isEmpty() ? "" : " Do NOT recommend these: " + String.join(", ", shown) + ".";
        return "Vibe: \"" + mood + "\"." + avoids;
    }

    private List<BookRecommendation> parseJsonArray(String jsonText) {
        List<BookRecommendation> out = new ArrayList<>();
        try {
            if (jsonText == null || jsonText.trim().isEmpty()) return out;

            String cleaned = jsonText.replaceAll("(?s)```.*?```", "").trim();
            int s = cleaned.indexOf('[');
            int e = cleaned.lastIndexOf(']');
            if (s >= 0 && e > s) {
                JsonNode arr = objectMapper.readTree(cleaned.substring(s, e + 1));
                if (arr.isArray()) {
                    Set<String> seen = new HashSet<>();
                    for (JsonNode node : arr) {
                        String title = node.path("title").asText("").trim();
                        String author = node.path("author").asText("").trim();
                        String reason = node.path("reason").asText("").trim();
                        if (title.isBlank() || author.isBlank()) continue;
                        String key = title.toLowerCase();
                        if (seen.contains(key)) continue;
                        seen.add(key);
                        out.add(new BookRecommendation(title, author, reason, null, null));
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("JSON parse error: {}", ex.getMessage());
        }
        return out;
    }

    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\"", "\\\"").replace("\n", "\\n");
    }
}