package com.vibeshelf.vibeshelf_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationRequest {

    @NotBlank(message = "Mood or query cannot be empty")
    private String mood;

    // Optional count — if null, service will extract from mood text or use default
    @Min(value = 1, message = "Count must be at least 1")
    @Max(value = 25, message = "Count cannot exceed 25")
    private Integer count;

    // Tracks which browser session this request belongs to.
    // Frontend generates this once with crypto.randomUUID() and sends it every time.
    // This is what lets the model remember "no, something else" = same mood, different books.
    private String sessionId;
}