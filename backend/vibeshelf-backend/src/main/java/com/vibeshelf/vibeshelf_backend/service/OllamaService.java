package com.vibeshelf.vibeshelf_backend.service;

import com.vibeshelf.vibeshelf_backend.config.OllamaConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * OllamaService — the emotional intelligence engine of VibeShelf.
 *
 * Understands ANYTHING the user types:
 * - Moods: "heartbreak but poetic", "cozy rainy night"
 * - Authors: "books by Sarah J Maas", "give me Holly Jackson"
 * - Titles: "books like Gone Girl", "similar to ACOTAR"
 * - Counts: "suggest 20 romance books", "give me 5 thrillers"
 * - Genres: "dark academia", "enemies to lovers"
 * - Typos: "romace books", "sahra j mass" → still works
 */
@Service
public class OllamaService {

    @Autowired
    private OllamaConfig config;

    private final RestTemplate restTemplate = new RestTemplate();

    // ── COUNT EXTRACTION ─────────────────────────────────────────────────────
    // Detects "give me 20 books", "suggest 5 romance", "10 books by..."
    private static final Pattern COUNT_PATTERN =
        Pattern.compile("\\b(\\d+)\\s*(?:books?|recommendations?|titles?|reads?)?\\b",
            Pattern.CASE_INSENSITIVE);

    /**
     * Extracts requested book count from user input.
     * "suggest me 20 romance books" → 20
     * "give me 5 thrillers" → 5
     * Falls back to defaultCount if no number found.
     */
    private int extractCount(String input, int defaultCount) {
        Matcher matcher = COUNT_PATTERN.matcher(input);
        while (matcher.find()) {
            int count = Integer.parseInt(matcher.group(1));
            // Sanity check: between 1 and 30 books
            if (count >= 1 && count <= 30) {
                return count;
            }
        }
        return defaultCount;
    }

    /**
     * Main recommendation method.
     * Accepts absolutely anything the user types and returns a JSON array.
     *
     * @param userInput Raw input from the user
     * @param defaultCount Default number of books if user didn't specify
     * @return Raw JSON string from Ollama
     */
    public String getRecommendation(String userInput, int defaultCount) {
        String url = config.getBaseUrl() + "/api/generate";

        // Extract count from user input if they specified one
        int count = extractCount(userInput, defaultCount);

        // Calculate tokens needed (roughly 120 tokens per book)
        int tokensNeeded = Math.max(1500, count * 130);

        String prompt = buildPrompt(userInput, count);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", config.getModel());
        requestBody.put("prompt", prompt);
        requestBody.put("stream", false);

        Map<String, Object> options = new HashMap<>();
        options.put("temperature", 0.85);
        options.put("num_predict", tokensNeeded);
        options.put("top_p", 0.9);
        options.put("repeat_penalty", 1.1);
        requestBody.put("options", options);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                url, requestBody, Map.class);
            if (response == null || response.get("response") == null) {
                return "[]";
            }
            return (String) response.get("response");
        } catch (Exception e) {
            return "[]";
        }
    }

    /**
     * Overload for backward compatibility — uses default count of 10.
     */
    public String getRecommendation(String userInput) {
        return getRecommendation(userInput, 10);
    }

    // ── PROMPT BUILDER ────────────────────────────────────────────────────────

    private String buildPrompt(String userInput, int count) {
        return """
                You are VibeShelf — the most emotionally intelligent, culturally aware book recommender ever built.
                You are not a search engine. You are something between a BookTok creator, a literary therapist,
                and a best friend with impeccable taste who has read everything.

                You understand ANYTHING a user throws at you — moods, vibes, authors, book titles,
                genres, aesthetic descriptions, misspellings, slang, and freeform feelings.

                ═══════════════════════════════════════════════════════════
                USER INPUT: "%s"
                BOOKS REQUESTED: %d
                ═══════════════════════════════════════════════════════════

                HOW TO INTERPRET THE INPUT:

                • If they mention an AUTHOR (e.g. "Sarah J Maas", "sahra j mass", "sarah maas"):
                  → Recommend books BY that author first, then similar authors with the same vibe
                  → Fix any typos and find the right author
                  → Include their most beloved works (ACOTAR, Crescent City, TOG etc.)

                • If they mention a BOOK TITLE (e.g. "books like Gone Girl", "similar to ACOTAR"):
                  → Recommend books with the same energy, themes, and emotional texture
                  → Think: same vibes, same obsessive readability, same emotional punch

                • If they describe a MOOD or FEELING (e.g. "heartbreak but poetic", "cozy rainy night"):
                  → Match the emotional texture, atmosphere, and pacing
                  → Think about what a person feeling this way secretly needs

                • If they name a GENRE or TROPE (e.g. "dark romance", "enemies to lovers", "dark academia"):
                  → Give the absolute best, most iconic books in that genre
                  → Mix classics of the genre with hidden gems

                • If they specify a COUNT (e.g. "give me 20 books", "suggest 5 thrillers"):
                  → Return EXACTLY that many books, no more, no less

                • If input has TYPOS or weird spelling → fix it silently, never mention it

                • If input is VAGUE → make your best creative interpretation, never refuse

                RULES FOR PERFECT RECOMMENDATIONS:

                ✓ Only recommend books that ACTUALLY EXIST — no hallucinations
                ✓ Vary the authors — no two books from the same author UNLESS they specifically asked for one author
                ✓ Mix well-known hits with at least one hidden gem
                ✓ The "reason" field is EVERYTHING — make it feel personal, raw, and human
                ✓ Write reasons like a friend texting you at midnight about why you NEED this book
                ✓ Match the vibe, energy, and emotional texture above everything else
                ✓ If they asked for a specific author, include AT LEAST 3-4 books by that author

                REASON FIELD EXAMPLES:

                ❌ Bad: "This book explores themes of love and loss through beautiful prose."
                ✅ Good: "If you've ever loved someone so much it physically hurt, this book will wreck you in the best way. Rooney writes longing like no one else — you'll finish it at 3am with your chest aching and immediately want to reread it."

                ❌ Bad: "A fantasy novel with strong world-building."
                ✅ Good: "The moment you meet Feyre you'll forget what day it is. Maas builds a world so immersive and characters so achingly real that you'll genuinely grieve when the series ends. This is the book that ruins all other books."

                The reason should sound like:
                - A friend who has read this book three times and is BEGGING you to read it
                - Conversational, emotionally honest, a little obsessed
                - Specific about WHY it hits, not just what it's about
                - Gen-Z BookTok energy — warm, real, slightly dramatic in the best way

                ABSOLUTE PROHIBITIONS:

                ✗ Do NOT add any text before or after the JSON
                ✗ Do NOT use hollow phrases like "this book explores themes of..."
                ✗ Do NOT recommend non-existent books
                ✗ Do NOT mention typos or that you understood the input
                ✗ Do NOT add markdown, code fences, or explanations

                OUTPUT FORMAT — STRICT JSON ONLY:

                Return ONLY a valid JSON array. Start with [ and end with ].
                Nothing before [. Nothing after ].

                [
                  {
                    "title": "Exact Book Title",
                    "author": "Author Full Name",
                    "reason": "2-3 sentences that sound like a friend who has read this book obsessively and needs you to read it RIGHT NOW"
                  }
                ]

                Return exactly %d books. Start your response with [ immediately.
                """.formatted(userInput, count, count);
    }
}