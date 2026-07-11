package com.vibeshelf.vibeshelf_backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibeshelf.vibeshelf_backend.dto.BookRecommendation;
import com.vibeshelf.vibeshelf_backend.model.Book;
import com.vibeshelf.vibeshelf_backend.repository.BookRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class OllamaBookRecommenderService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final BookRepository bookRepository;
    private final Optional<RedisTemplate<String, Object>> redisTemplate;
    
    @Value("${ollama.api.url:http://localhost:11434/api/generate}")
    private String ollamaApiUrl;
    
    @Value("${ollama.model:llama3}")
    private String ollamaModel;
    
    private static final long CACHE_TTL_HOURS = 1;

    public OllamaBookRecommenderService(RestTemplate restTemplate, ObjectMapper objectMapper, BookRepository bookRepository, 
            @Autowired(required = false) RedisTemplate<String, Object> redisTemplate) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.bookRepository = bookRepository;
        this.redisTemplate = Optional.ofNullable(redisTemplate);
    }

    public List<BookRecommendation> getRecommendationsByMood(String mood) {
        String normalizedMood = mood.toLowerCase().trim();
        // CHANGED TO v4 to bust the old cache that had the bad recommendations
        String cacheKey = "vibe:mood:v4:" + normalizedMood; 
        
        if (redisTemplate.isPresent()) {
            try {
                @SuppressWarnings("unchecked")
                List<BookRecommendation> cached = (List<BookRecommendation>) redisTemplate.get().opsForValue().get(cacheKey);
                if (cached != null) return cached;
            } catch (Exception e) { log.warn("Cache skip: {}", e.getMessage()); }
        }
        
        List<BookRecommendation> recommendations = callOllamaAPI(normalizedMood);
        
        if (redisTemplate.isPresent()) {
            try { redisTemplate.get().opsForValue().set(cacheKey, recommendations, CACHE_TTL_HOURS, TimeUnit.HOURS); }
            catch (Exception e) { log.warn("Cache fail: {}", e.getMessage()); }
        }
        
        return recommendations;
    }

    private List<BookRecommendation> callOllamaAPI(String mood) {
        String prompt = buildPrompt(mood);
        try {
            Map<String, Object> request = new LinkedHashMap<>();
            request.put("model", ollamaModel);
            request.put("prompt", prompt);
            request.put("stream", false);
            request.put("options", Map.of("temperature", 0.8, "num_predict", 2048)); // Higher temp for "personality"
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(ollamaApiUrl, entity, Map.class);

            String responseText = null;
            if (response != null) {
                Object respObj = response.get("response");
                if (respObj == null) respObj = response.get("output");
                if (respObj != null) responseText = respObj.toString();
            }

            List<BookRecommendation> parsed = parseRecommendations(responseText);
            if (parsed == null || parsed.isEmpty()) {
                log.warn("Ollama returned no valid recommendations; falling back to local DB sample for mood={}", mood);
                // Fallback: return up to 5 books from local DB as gentle degradation
                List<Book> fallback = bookRepository.findAll(PageRequest.of(0, 5)).getContent();
                List<BookRecommendation> out = new ArrayList<>();
                for (Book b : fallback) {
                    out.add(new BookRecommendation(b.getTitle(), b.getAuthor(), "A locally cached popular pick.", null, null));
                }
                return out;
            }

            return parsed;
        } catch (Exception e) {
            log.error("Ollama error: {}", e.getMessage());
            throw new RuntimeException("The Oracle is resting. Try again in a bit!");
        }
    }

    private String buildPrompt(String mood) {
        // Fetch up to 20 books just to give the AI a small taste of your local DB
        List<Book> bookSample = bookRepository.findAll(PageRequest.of(0, 20)).getContent();
        
        StringBuilder localBooks = new StringBuilder();
        if (!bookSample.isEmpty()) {
            localBooks.append("Local Library Samples:\n");
            for (Book b : bookSample) {
                localBooks.append(String.format("- \"%s\" by %s\n", b.getTitle(), b.getAuthor()));
            }
        }

        return String.format("""
            SYSTEM: You are the VibeShelf Oracle, an elite, world-class book curator and legendary BookTok creator. 
            Your vocabulary is Gen-Z, emotional, and aesthetic (use terms like 'hits different', 'main character energy', 'slay', 'rent free').
            
            USER MOOD: "%s"
            
            YOUR MISSION & CRITICAL GUARDRAILS:
            1. TONE MATCHING IS MANDATORY: You MUST match the emotional tone of the USER MOOD. If the mood is "happy", "cozy", or "romance", you are STRICTLY FORBIDDEN from recommending horror, true crime, historical tragedies, or dark thrillers.
            2. Recommend the 20 BEST, most famous books that perfectly match this vibe (e.g., if happy/cozy, recommend authors like T.J. Klune, Emily Henry, Fredrik Backman, Becky Chambers).
            3. You are NOT restricted to any specific list. Use your vast knowledge of world literature to find massive viral hits.
            4. Write a "reason" that sounds like a viral TikTok video hook. Tell the user exactly why this book fits their requested mood.
            
            %s
            
            OUTPUT RULES:
            - Return ONLY a valid JSON array.
            - No preamble, no markdown formatting outside the JSON.
            - Each object must have exactly these keys: "title", "author", "reason".
            
            JSON FORMAT:
            [
              {
                "title": "The House in the Cerulean Sea",
                "author": "T.J. Klune",
                "reason": "If you asked for happy and cozy, this is a literal warm hug in book form. It will heal your soul and lives in my head rent free."
              }
            ]
            """, mood, localBooks.toString());
    }

    private List<BookRecommendation> parseRecommendations(String responseText) {
        if (responseText == null) return Collections.emptyList();
        try {
            String cleaned = responseText.trim();
            int start = cleaned.indexOf('[');
            int end = cleaned.lastIndexOf(']');
            if (start < 0 || end <= start) {
                log.warn("No JSON array found in model response");
                return Collections.emptyList();
            }
            String jsonPart = cleaned.substring(start, end + 1);

            BookRecommendation[] recs = objectMapper.readValue(jsonPart, BookRecommendation[].class);
            return Arrays.stream(recs).limit(20).toList(); 
        } catch (Exception e) {
            log.error("Parse failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public void clearCache() {
        log.info("Clear cache requested for OllamaBookRecommenderService.");
        // If you are actively using Redis and want this to actually clear the cache, you would do:
        // if (redisTemplate.isPresent()) {
        //     Set<String> keys = redisTemplate.get().keys("vibe:mood:*");
        //     if (keys != null && !keys.isEmpty()) {
        //         redisTemplate.get().delete(keys);
        //     }
        // }
    }
}