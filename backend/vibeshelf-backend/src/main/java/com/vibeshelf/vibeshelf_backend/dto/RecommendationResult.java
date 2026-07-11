package com.vibeshelf.vibeshelf_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecommendationResult {
    // source: "groq" or "fallback"
    private String source;
    private List<BookRecommendation> recommendations;
}
