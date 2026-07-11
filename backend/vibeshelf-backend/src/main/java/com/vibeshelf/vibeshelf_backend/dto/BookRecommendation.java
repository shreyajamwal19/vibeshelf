package com.vibeshelf.vibeshelf_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a single book recommendation with title, author, and reason
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookRecommendation {

    @JsonProperty("title")
    private String title;

    @JsonProperty("author")
    private String author;

    @JsonProperty("reason")
    private String reason;

    @JsonProperty("coverUrl")
    private String coverUrl;

    @JsonProperty("isbn")
    private String isbn;

    /**
     * Transient score for internal ranking, not serialized to JSON
     */
    private transient double score;

    // REQUIRED by your services
    public BookRecommendation(
            String title,
            String author,
            String reason,
            String coverUrl,
            String isbn) {

        this.title = title;
        this.author = author;
        this.reason = reason;
        this.coverUrl = coverUrl;
        this.isbn = isbn;
    }
}