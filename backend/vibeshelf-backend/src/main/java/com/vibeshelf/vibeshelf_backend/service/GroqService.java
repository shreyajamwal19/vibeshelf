package com.vibeshelf.vibeshelf_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibeshelf.vibeshelf_backend.dto.BookRecommendation;
import com.vibeshelf.vibeshelf_backend.dto.RecommendationResult;
import com.vibeshelf.vibeshelf_backend.model.Book;
import com.vibeshelf.vibeshelf_backend.repository.BookRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

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

    // Optimized Single-Stage Prompt: Achieves the same quality with half the tokens/latency.
    private static final String SYSTEM_PROMPT = 
        "You are a master book recommender and strict literary editor. " +
        "Analyze the user's vibe, emotional atmosphere, pacing, and style. " +
        "Generate EXACTLY 10 highly-relevant book recommendations. " +
        "Mix popular titles with high-quality hidden gems. Do NOT repeat authors. " +
        "For each book, provide a conversational reason (1-2 sentences, 15-25 words max) written like a real reader on Reddit or StoryGraph. " +
        "Explain specifically WHY it fits their vibe. NEVER use AI marketing words like 'masterpiece', 'captivating', 'unforgettable', or 'beautifully crafted'. " +
        "Output ONLY a valid JSON array of objects in this exact format: [{\"title\":\"...\",\"author\":\"...\",\"reason\":\"...\"}].";

    private final Map<String, Set<String>> shownBooks = new ConcurrentHashMap<>();
    private final Map<String, String> sessionMood = new ConcurrentHashMap<>();
    private final Map<String, Deque<List<BookRecommendation>>> prefetchedBatches = new ConcurrentHashMap<>();
    private final Set<String> prefetchInProgress = ConcurrentHashMap.newKeySet();
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
        log.info("✅ GroqService (Optimized Engine) initialized");
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initGroqConfiguration() {
        try {
            if (groqApiKey == null || groqApiKey.isBlank()) {
                String[] envVars = {"GROQ_KEY", "GROQ_APIKEY"};
                for (String env : envVars) {
                    String alt = System.getenv(env);
                    if (alt != null && !alt.isBlank()) {
                        groqApiKey = alt.trim();
                        break;
                    }
                }

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
                log.warn("GROQ not configured — fallback engine only.");
            } else {
                log.info("GROQ optimized engine ready.");
            }
        } catch (Exception e) {
            log.warn("GROQ config error: {}", e.getMessage());
        }
    }

    public RecommendationResult chat(String sessionId, String userMessage) {
        log.info("Chat called: session={}, message={}", sessionId, userMessage);
        
        if (groqApiKey == null || groqApiKey.isBlank() || groqApiUrl == null || groqApiUrl.isBlank()) {
            return fallbackResult(userMessage);
        }

        String intent = classifyIntent(userMessage);
        String mood = "RETRY".equals(intent) ? sessionMood.getOrDefault(sessionId, userMessage) : userMessage;

        // Reset session state for a completely new mood search
        if (!"RETRY".equals(intent)) {
            sessionMood.put(sessionId, mood);
            shownBooks.computeIfAbsent(sessionId, k -> ConcurrentHashMap.newKeySet()).clear();
            prefetchedBatches.computeIfAbsent(sessionId, k -> new ConcurrentLinkedDeque<>()).clear();
        }

        Set<String> shown = shownBooks.computeIfAbsent(sessionId, k -> ConcurrentHashMap.newKeySet());
        Deque<List<BookRecommendation>> queue = prefetchedBatches.computeIfAbsent(sessionId, k -> new ConcurrentLinkedDeque<>());

        // Check if we have a prefetched batch ready for a user asking for more
        if ("RETRY".equals(intent)) {
            List<BookRecommendation> prefetchPage = queue.pollFirst();
            if (prefetchPage != null && !prefetchPage.isEmpty()) {
                prefetchPage.forEach(br -> shown.add(br.getTitle().toLowerCase()));
                // User is actively scrolling; prefetch the NEXT batch in background
                asyncPrefetchNext(sessionId, mood);
                return new RecommendationResult("groq-prefetched", prefetchPage);
            }
        }

        // Synchronous fetch if queue is empty or it's a new mood
        String userTurn = buildUserTurn(mood, shown);
        List<BookRecommendation> result = fetchRecommendations(userTurn);

        if (result.isEmpty()) {
            return fallbackResult(mood);
        }

        result.forEach(this::enrichWithCoverAndIsbn);
        result.forEach(r -> shown.add(r.getTitle().toLowerCase()));

        // We only prefetch IF the user hits RETRY. 
        // This stops massive API waste on users who accept the first 10.
        if ("RETRY".equals(intent)) {
            asyncPrefetchNext(sessionId, mood);
        }

        return new RecommendationResult("groq", result);
    }

    private List<BookRecommendation> fetchRecommendations(String userTurn) {
        String reply = callGroqWithSystem(SYSTEM_PROMPT, userTurn);
        return parseJsonArray(reply);
    }

    private String callGroqWithSystem(String systemPrompt, String userTurn) {
        try {
            Map<String, Object> body = Map.of(
                "model", groqModel,
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userTurn)
                ),
                "temperature", 0.6,
                "max_tokens", 700 // Reduced from 3000 to save bandwidth & cost
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);
            HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> resp = restTemplate.postForObject(groqApiUrl, req, Map.class);

            if (resp == null) return "[]";

            JsonNode root = objectMapper.valueToTree(resp);
            return extractContent(root);
            
        } catch (Exception e) {
            log.error("Groq API call failed: {}", e.getMessage());
            return "[]";
        }
    }

    private String extractContent(JsonNode root) {
        JsonNode choices = root.path("choices");
        if (choices.isArray() && !choices.isEmpty()) {
            JsonNode msg = choices.get(0).path("message").path("content");
            if (!msg.isMissingNode()) return msg.asText();
        }
        return root.path("response").asText("");
    }

    private RecommendationResult fallbackResult(String mood) {
        List<BookRecommendation> recs = fallbackRecommender.getRecommendationsByMood(mood, 10);
        recs.forEach(this::enrichWithCoverAndIsbn);
        return new RecommendationResult("fallback", recs);
    }

    private void enrichWithCoverAndIsbn(BookRecommendation rec) {
        if (rec == null || rec.getTitle() == null || rec.getAuthor() == null) return;

        bookRepository.findByTitleAndAuthorIgnoreCase(rec.getTitle(), rec.getAuthor()).ifPresentOrElse(book -> {
            Book resolved = coverResolverService.resolveAndCacheCover(book);
            rec.setCoverUrl(resolved.getCoverUrl());
            rec.setIsbn(resolved.getIsbn());
        }, () -> {
            rec.setCoverUrl("https://placehold.co/128x192/FFE4EF/4A0F2A?text=No+Cover");
            rec.setIsbn("");
        });
    }

    private void asyncPrefetchNext(String sessionId, String mood) {
        if (!prefetchInProgress.add(sessionId)) return;

        prefetchExecutor.submit(() -> {
            try {
                Set<String> shown = shownBooks.getOrDefault(sessionId, Collections.emptySet());
                String userTurn = buildUserTurn(mood, shown);
                List<BookRecommendation> nextBatch = fetchRecommendations(userTurn);
                
                if (!nextBatch.isEmpty()) {
                    nextBatch.forEach(this::enrichWithCoverAndIsbn);
                    prefetchedBatches.computeIfAbsent(sessionId, k -> new ConcurrentLinkedDeque<>()).addLast(nextBatch);
                }
            } catch (Exception e) {
                log.debug("Background prefetch failed for session {}: {}", sessionId, e.getMessage());
            } finally {
                prefetchInProgress.remove(sessionId);
            }
        });
    }

    public void clearSession(String sessionId) {
        shownBooks.remove(sessionId);
        sessionMood.remove(sessionId);
        prefetchedBatches.remove(sessionId);
        log.info("Cleared session memory for {}", sessionId);
    }

    private String classifyIntent(String msg) {
        if (msg == null) return "NEW_MOOD";
        String lowerMsg = msg.toLowerCase();
        List<String> retryKeywords = List.of(
            "no", "nope", "not these", "something else", "try again", "another", 
            "more", "show more", "skip", "nah", "not it", "meh", "different"
        );
        return retryKeywords.stream().anyMatch(lowerMsg::contains) ? "RETRY" : "NEW_MOOD";
    }

    private String buildUserTurn(String mood, Set<String> shown) {
        if (shown == null || shown.isEmpty()) {
            return "Vibe: \"" + mood + "\".";
        }
        return "Vibe: \"" + mood + "\". Do NOT recommend these: " + String.join(", ", shown) + ".";
    }

    private List<BookRecommendation> parseJsonArray(String jsonText) {
        List<BookRecommendation> out = new ArrayList<>();
        if (jsonText == null || jsonText.isBlank()) return out;

        try {
            // Isolates the JSON array, discarding any markdown or conversational fluff outside it
            int s = jsonText.indexOf('[');
            int e = jsonText.lastIndexOf(']');
            
            if (s >= 0 && e > s) {
                String arrayString = jsonText.substring(s, e + 1);
                JsonNode arr = objectMapper.readTree(arrayString);
                
                if (arr.isArray()) {
                    Set<String> seen = new HashSet<>();
                    for (JsonNode node : arr) {
                        String title = node.path("title").asText("").trim();
                        String author = node.path("author").asText("").trim();
                        String reason = node.path("reason").asText("").trim();
                        
                        if (title.isBlank() || author.isBlank()) continue;
                        
                        // Deduplicate within the result batch
                        if (seen.add(title.toLowerCase())) {
                            out.add(new BookRecommendation(title, author, reason, null, null));
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("JSON array extraction failed. Output might be malformed. Error: {}", ex.getMessage());
        }
        return out;
    }
}