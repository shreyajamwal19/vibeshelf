package com.vibeshelf.vibeshelf_backend.controller;

import com.vibeshelf.vibeshelf_backend.model.Book;
import com.vibeshelf.vibeshelf_backend.repository.BookRepository;
import com.vibeshelf.vibeshelf_backend.dto.RecommendationRequest;
import com.vibeshelf.vibeshelf_backend.dto.RecommendationResult;
import com.vibeshelf.vibeshelf_backend.service.GroqService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.PageRequest;
// ...existing code...

import java.util.*;

@RestController
@RequestMapping("/api") // Base is now /api
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:5174"})
public class BookController {

    private final BookRepository bookRepository;
    // ...existing code...
    
    @Autowired
    private GroqService groqService;

    public BookController(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    /* ================= AI RECOMMENDATION (Using Gemini) ================= */

   @PostMapping("/recommend")
public ResponseEntity<?> getAIResponse(@RequestBody RecommendationRequest request) {
    try {
        // Use sessionId from request, or fall back to "default" if missing
        String sessionId = (request.getSessionId() != null && !request.getSessionId().isBlank())
            ? request.getSessionId()
            : "default-session";

        // ✅ Now passes sessionId — GroqService will remember the conversation
        RecommendationResult result = groqService.chat(sessionId, request.getMood());
        return ResponseEntity.ok().body(result);

    } catch (Exception e) {
        return ResponseEntity.status(500)
            .body("{\"error\": \"Failed to get recommendations: " + e.getMessage() + "\"}");
    }
}

// ← Optional: add this endpoint to let frontend clear a session
@DeleteMapping("/recommend/session/{sessionId}")
public ResponseEntity<?> clearSession(@PathVariable String sessionId) {
    groqService.clearSession(sessionId);
    return ResponseEntity.ok().body("{\"cleared\": true}");
}

    /* ================= LIST BOOKS (Refactored to /api/books) ================= */

    @GetMapping("/books/search")
    public ResponseEntity<Map<String, Object>> searchBooks(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "24") int limit,
            @RequestParam(required = false) String q
    ) {
        if (page < 1) page = 1;
        int pageIndex = page - 1;

        org.springframework.data.domain.Page<Book> resultPage;

        if (q == null || q.isBlank()) {
            resultPage = bookRepository.findAll(PageRequest.of(pageIndex, limit));
        } else {
            resultPage = bookRepository.findByTitleOrAuthorLike(q, PageRequest.of(pageIndex, limit));
        }

        List<Map<String, Object>> books = new ArrayList<>();
        for (Book b : resultPage) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", b.getId());
            m.put("title", b.getTitle());
            m.put("author", b.getAuthor());
            m.put("imageUrl", b.getImage());
            books.add(m);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("books", books);
        response.put("total", resultPage.getTotalElements());
        response.put("totalPages", resultPage.getTotalPages());
        response.put("hasMore", resultPage.hasNext());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/books")
    public ResponseEntity<Map<String, Object>> getBooks(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "24") int limit,
            @RequestParam(required = false) String genre
    ) {
        if (page < 1) page = 1;
        int pageIndex = page - 1;

        org.springframework.data.domain.Page<Book> resultPage;

        // Logic for genre filtering (Keeping your regex logic)
        if (genre == null || genre.isBlank()) {
            resultPage = bookRepository.findAll(PageRequest.of(pageIndex, limit));
        } else {
            String regex = genre.toLowerCase(); // simplified for brevity, keep your token logic if needed
            resultPage = bookRepository.findAllByGenreRegex(regex, PageRequest.of(pageIndex, limit));
        }

        List<Map<String, Object>> books = new ArrayList<>();
        for (Book b : resultPage) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", b.getId());
            m.put("title", b.getTitle());
            m.put("author", b.getAuthor());
            m.put("imageUrl", b.getImage());
            books.add(m);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("books", books);
        response.put("total", resultPage.getTotalElements());
        response.put("totalPages", resultPage.getTotalPages());
        response.put("hasMore", resultPage.hasNext());

        return ResponseEntity.ok(response);
    }

    /* ================= ADDITIONAL ENDPOINTS ================= */

    @GetMapping("/books/{id}")
    public ResponseEntity<?> getBookById(@PathVariable Long id) {
        return bookRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}