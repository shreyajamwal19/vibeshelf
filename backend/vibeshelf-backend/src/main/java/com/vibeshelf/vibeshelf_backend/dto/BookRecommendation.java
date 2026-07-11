package com.vibeshelf.vibeshelf_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

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
}
