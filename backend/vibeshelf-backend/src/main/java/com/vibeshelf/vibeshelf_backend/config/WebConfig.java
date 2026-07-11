package com.vibeshelf.vibeshelf_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * WebConfig — global CORS configuration.
 *
 * Allows frontend apps (React, Vue, etc.) running on any origin
 * during development to call the VibeShelf API.
 *
 * In production, restrict allowedOrigins to your actual frontend domain.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                // In production, replace "*" with your frontend URL
                // e.g., "https://vibeshelf.app"
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600); // Cache preflight response for 1 hour
                
    }
}
