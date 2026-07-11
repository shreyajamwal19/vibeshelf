package com.vibeshelf.vibeshelf_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for mood-based AI book recommendations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MoodRecommendationRequest {
    
    @NotBlank(message = "Mood cannot be empty")
    private String mood;
}
