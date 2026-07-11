package com.vibeshelf.vibeshelf_backend.service;

import com.vibeshelf.vibeshelf_backend.dto.BookRecommendation;
import com.vibeshelf.vibeshelf_backend.model.Book;
import com.vibeshelf.vibeshelf_backend.repository.BookRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Simple Book Recommender Service - No Ollama Required!
 * Uses intelligent mood-to-genre mapping + randomization for variety
 */
@Slf4j
@Service

public class SimpleBookRecommenderService {

    private final BookRepository bookRepository;
    private final CoverResolverService coverResolverService;
    private static final Random random = new Random();

    // Mood to genre mapping removed. Use metadata-driven matching instead.

    public SimpleBookRecommenderService(BookRepository bookRepository, CoverResolverService coverResolverService) {
        this.bookRepository = bookRepository;
        this.coverResolverService = coverResolverService;
    }

    /**
     * Get intelligent recommendations based on mood
     * Uses mood-to-genre mapping + randomization for variety
     */
    // Backwards-compatible: default to 5 results for existing callers
    public List<BookRecommendation> getRecommendationsByMood(String mood) {
        return getRecommendationsByMood(mood, 5);
    }

    // New overload: request an exact number of recommendations (used by GroqService)
    public List<BookRecommendation> getRecommendationsByMood(String mood, int count) {
        if (count <= 0) count = 5;
        String normalizedMood = mood == null ? "" : mood.toLowerCase().trim();
        log.info("Getting {} recommendations for mood: {}", count, normalizedMood);

        // Metadata-driven: filter and score books by semantic, mood, theme, genre, popularity, rating, consensus, confidence
        List<Book> allBooks = bookRepository.findAll();
        List<BookRecommendation> recommendations = allBooks.stream()
            .map(book -> {
                Book resolved = coverResolverService.resolveAndCacheCover(book);
                return convertToRecommendation(resolved);
            })
            .collect(Collectors.toList());

        // Score each recommendation
        recommendations.forEach(rec -> {
            double score = computeRecommendationScore(rec, normalizedMood);
            rec.setScore(score);
        });

        // Sort by score descending
        recommendations.sort(Comparator.comparingDouble(BookRecommendation::getScore).reversed());

        return recommendations.stream().limit(count).collect(Collectors.toList());
    }

    // Removed keyword-based genre matching. Use metadata-driven scoring.

    /**
     * Get random books from database
     */
    private List<BookRecommendation> getRandomBooks(int count) {
        try {
            long totalBooks = bookRepository.count();
            if (totalBooks == 0) {
                return Collections.emptyList();
            }

            List<Book> allBooks = bookRepository.findAll();
            Collections.shuffle(allBooks);
            return allBooks.stream()
                .limit(count)
                .map(book -> {
                    Book resolved = coverResolverService.resolveAndCacheCover(book);
                    return convertToRecommendation(resolved);
                })
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to get random books: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Convert Book entity to BookRecommendation DTO
     */
    private BookRecommendation convertToRecommendation(Book book) {
        BookRecommendation rec = new BookRecommendation();
        rec.setTitle(book.getTitle() != null ? book.getTitle() : "Unknown Book");
        rec.setAuthor(book.getAuthor() != null ? book.getAuthor() : "Unknown Author");
        rec.setReason(generateFriendlyReason(book));
        rec.setCoverUrl(book.getCoverUrl());
        rec.setIsbn(book.getIsbn());
        return rec;
    }

    /**
     * Generate a friendly, Gen-Z style reason why this book matches
     */
    private String generateFriendlyReason(Book book) {
        List<String> reasons = Arrays.asList(
            "This has that perfect vibe you're looking for ✨",
            "It's giving exactly what you asked for 🎯",
            "Trust me, this is THE book for this mood 📖",
            "Your next favorite book is right here 💫",
            "This one's a total mood match 🌙",
            "It's about to be your new obsession 🔥",
            "This hits different in the best way 💯",
            "Pure vibes, pure storytelling 🌟",
            "It speaks to what you're feeling rn 💭"
        );
        return reasons.get(random.nextInt(reasons.size()));
    }

    // Compute recommendation score using metadata and relevance signals
    private double computeRecommendationScore(BookRecommendation rec, String mood) {
        // Example: combine semantic, mood, theme, genre, popularity, rating, consensus, confidence
        double semanticSim = getSemanticSimilarity(rec, mood);
        double moodSim = getMoodSimilarity(rec, mood);
        double themeSim = getThemeSimilarity(rec, mood);
        double genreRel = getGenreRelevance(rec, mood);
        double popularity = getPopularity(rec);
        double avgRating = getAverageRating(rec);
        double consensus = getReaderConsensus(rec);
        double confidence = getConfidenceScore(rec);
        // Weighted sum (weights can be tuned)
        return 0.25 * semanticSim + 0.15 * moodSim + 0.15 * themeSim + 0.15 * genreRel +
               0.10 * popularity + 0.10 * avgRating + 0.05 * consensus + 0.05 * confidence;
    }

    // Placeholder methods for scoring (implement with real logic/data)
    private double getSemanticSimilarity(BookRecommendation rec, String mood) { return 1.0; }
    private double getMoodSimilarity(BookRecommendation rec, String mood) { return 1.0; }
    private double getThemeSimilarity(BookRecommendation rec, String mood) { return 1.0; }
    private double getGenreRelevance(BookRecommendation rec, String mood) { return 1.0; }
    private double getPopularity(BookRecommendation rec) { return 1.0; }
    private double getAverageRating(BookRecommendation rec) { return 1.0; }
    private double getReaderConsensus(BookRecommendation rec) { return 1.0; }
    private double getConfidenceScore(BookRecommendation rec) { return 1.0; }

    // Removed isKnownAuthor. Literary reputation should be derived from metadata, not hardcoded.

    // Removed isPopularTitle. Popularity should be derived from metadata, not hardcoded.
}
