package com.vibeshelf.vibeshelf_backend.config;

import com.vibeshelf.vibeshelf_backend.repository.UserRepository;
import com.vibeshelf.vibeshelf_backend.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final UserRepository userRepository;

    public SecurityConfig(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return email -> userRepository.findByEmail(email)
                .map(user -> org.springframework.security.core.userdetails.User.builder()
                        .username(user.getEmail())
                        .password(user.getPassword())
                        .authorities("USER")
                        .accountExpired(!user.isVerified())
                        .accountLocked(false)
                        .credentialsExpired(false)
                        .disabled(false)
                        .build())
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    @Bean
    public AuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public JwtAuthFilter jwtAuthFilter(UserDetailsService userDetailsService) {
        return new JwtAuthFilter(userDetailsService);
    }
    @Bean
public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
    org.springframework.web.cors.CorsConfiguration configuration =
            new org.springframework.web.cors.CorsConfiguration();

   configuration.setAllowedOriginPatterns(java.util.List.of(
    "http://localhost:5173",
    "http://localhost:5174",
    "https://vibeshelf-wine.vercel.app"
));

    configuration.setAllowedMethods(java.util.List.of(
            "GET", "POST", "PUT", "DELETE", "OPTIONS"
    ));

    configuration.setAllowedHeaders(java.util.List.of("*"));
    configuration.setAllowCredentials(true);

    org.springframework.web.cors.UrlBasedCorsConfigurationSource source =
            new org.springframework.web.cors.UrlBasedCorsConfigurationSource();

    source.registerCorsConfiguration("/**", configuration);

    return source;
}

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> {
                })
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Allow anonymous GET access to recommender proxy endpoints explicitly
                        .requestMatchers(HttpMethod.GET, "/api/recommendations/**").permitAll()
                        .requestMatchers(
                                "/api/users/signup",
                                "/api/users/login",
                                "/api/users/login-simple",
                                "/api/users/verify-otp",
                                "/api/users/resend-otp", // ✅ ADD THIS
                                "/api/users/forgot-password", // ✅ ADD THIS
                                "/api/users/reset-password", // ✅ ADD THIS
                                "/api/users/verify-test-user",
                                "/api/health",

                                "/api/recommendations/book",
                                "/api/books/top-bestsellers",
                                "/api/books/**",
                                "/api/recommendations/**",
                                "/api/reviews/**",
                                "/api/recommend",
                                "/api/recommend/**",
                                "/api/v2/books/**",
                                "/h2-console/**")
                        .permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider(userDetailsService(), passwordEncoder()))
                .addFilterBefore(jwtAuthFilter(userDetailsService()), UsernamePasswordAuthenticationFilter.class);

        http.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.sameOrigin()));
        return http.build();
    }
}