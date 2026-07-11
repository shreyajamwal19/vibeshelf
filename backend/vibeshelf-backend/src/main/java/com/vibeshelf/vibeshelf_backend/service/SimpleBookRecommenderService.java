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

    // Mood to genre mapping
    private static final Map<String, List<String>> MOOD_TO_GENRES = Map.ofEntries(
        Map.entry("happy", List.of("Romance", "Comedy", "Feel-Good Fiction")),
        Map.entry("cozy", List.of("Mystery", "Thriller", "Fantasy", "Paranormal")),
        Map.entry("dark", List.of("Dark Romance", "Horror", "Psychological Thriller", "Mystery")),
        Map.entry("thriller", List.of("Thriller", "Mystery", "Suspense")),
        Map.entry("adventure", List.of("Adventure", "Fantasy", "Science Fiction", "Action")),
        Map.entry("emotional", List.of("Literary Fiction", "Contemporary", "Historical Fiction")),
        Map.entry("escape", List.of("Fantasy", "Science Fiction", "Romance")),
        Map.entry("romance", List.of("Romance", "Contemporary", "Paranormal")),
        Map.entry("mystery", List.of("Mystery", "Thriller", "Crime")),
        Map.entry("fantasy", List.of("Fantasy", "Paranormal", "Science Fiction")),
        Map.entry("sci-fi", List.of("Science Fiction", "Dystopian", "Adventure"))
    );

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

        // Get genres for this mood
        List<String> genres = findGenresForMood(normalizedMood);
        
        if (genres.isEmpty()) {
            // Fallback: return random books if no genre match
            return getRandomBooks(count);
        }

        // Collect books from all matching genres
        Set<Book> recommendedBooks = new LinkedHashSet<>();
        
        for (String genre : genres) {
            try {
                List<Book> booksInGenre = bookRepository.findAll().stream()
                    .filter(book -> book.getGenre() != null && 
                                  book.getGenre().toLowerCase().contains(genre.toLowerCase()))
                    .collect(Collectors.toList());
                recommendedBooks.addAll(booksInGenre);
            } catch (Exception e) {
                log.debug("No books found for genre: {}", genre);
            }
        }

        if (recommendedBooks.isEmpty()) {
            // Fallback to random books
            return getRandomBooks(count);
        }

        // Convert to recommendations and shuffle for variety
        List<BookRecommendation> recommendations = recommendedBooks.stream()
            .map(book -> {
                Book resolved = coverResolverService.resolveAndCacheCover(book);
                return convertToRecommendation(resolved);
            })
            .collect(Collectors.toList());

        Collections.shuffle(recommendations);
        return recommendations.stream().limit(count).collect(Collectors.toList());
    }

    /**
     * Find genres matching the mood using keyword matching
     */
    private List<String> findGenresForMood(String mood) {
        List<String> genres = new ArrayList<>();

        // Direct mapping
        if (MOOD_TO_GENRES.containsKey(mood)) {
            return MOOD_TO_GENRES.get(mood);
        }

        // Keyword-based matching
        for (Map.Entry<String, List<String>> entry : MOOD_TO_GENRES.entrySet()) {
            if (mood.contains(entry.getKey()) || entry.getKey().contains(mood)) {
                genres.addAll(entry.getValue());
            }
        }

        if (!genres.isEmpty()) {
            return genres.stream().distinct().collect(Collectors.toList());
        }

        // Fallback: all genres
        return new ArrayList<>(MOOD_TO_GENRES.values().stream()
            .flatMap(List::stream)
            .distinct()
            .collect(Collectors.toList()));
    }

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
}
