package com.vibeshelf.vibeshelf_backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "ollama")
public class OllamaConfig {
    private String apiKey;
    private String model = "mistral";
    private String baseUrl = "http://localhost:11434";
}