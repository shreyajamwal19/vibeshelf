package com.vibeshelf.vibeshelf_backend.service;

import com.vibeshelf.vibeshelf_backend.model.Book;
import com.vibeshelf.vibeshelf_backend.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
@RequiredArgsConstructor
public class CoverResolverService {

    private final BookRepository bookRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${google.books.api.key:}")
    private String googleBooksApiKey;

    private static final String PLACEHOLDER = "https://placehold.co/128x192/FFE4EF/4A0F2A?text=No+Cover";
    private static final String OPEN_LIBRARY_BASE = "https://openlibrary.org";
    private static final String GOOGLE_BOOKS_BASE = "https://www.googleapis.com/books/v1/volumes";

    private final AtomicBoolean googleDisabled = new AtomicBoolean(false);

    public String resolveCover(String title, String author, String isbn) {
        String coverUrl = fetchOpenLibraryCover(title, author, isbn);
        if (!StringUtils.hasText(coverUrl) && !googleDisabled.get() && StringUtils.hasText(googleBooksApiKey)) {
            coverUrl = fetchGoogleBooksCover(title, author);
        }
        return StringUtils.hasText(coverUrl) ? coverUrl : null;
    }

    public Book resolveAndCacheCover(Book book) {
        if (book == null) return null;

        if (StringUtils.hasText(book.getCoverUrl()) && !book.getCoverUrl().equals(PLACEHOLDER)) {
            return book;
        }

        String originalCover = book.getCoverUrl();
        String coverUrl = resolveCover(book.getTitle(), book.getAuthor(), book.getIsbn());

        if (!StringUtils.hasText(coverUrl)) {
            coverUrl = PLACEHOLDER;
        }

        if (!coverUrl.equals(originalCover)) {
            book.setCoverUrl(coverUrl);
            bookRepository.save(book);
            log.info("Resolved cover for '{}' by {}", book.getTitle(), book.getAuthor());
        }

        return book;
    }

    private String fetchOpenLibraryCover(String title, String author, String isbn) {
        if (!StringUtils.hasText(title)) return null;

        if (StringUtils.hasText(author)) {
            String url = OPEN_LIBRARY_BASE + "/search.json?limit=1&fields=cover_i,isbn,title&title=" +
                    encode(title) + "&author=" + encode(author);
            String cover = tryOpenLibrarySearch(url);
            if (cover != null) return cover;
        }

        String urlTitleOnly = OPEN_LIBRARY_BASE + "/search.json?limit=1&fields=cover_i,isbn,title&title=" + encode(title);
        String cover = tryOpenLibrarySearch(urlTitleOnly);
        if (cover != null) return cover;

        if (StringUtils.hasText(isbn)) {
            String urlIsbn = OPEN_LIBRARY_BASE + "/search.json?limit=1&fields=cover_i&isbn=" + encode(isbn);
            return tryOpenLibrarySearch(urlIsbn);
        }
        return null;
    }

    private String tryOpenLibrarySearch(String url) {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) return null;

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode docs = root.path("docs");

            if (docs.isArray() && docs.size() > 0) {
                JsonNode doc = docs.get(0);
                long coverId = doc.path("cover_i").asLong(0);
                if (coverId > 0) return "https://covers.openlibrary.org/b/id/" + coverId + "-L.jpg";
                
                JsonNode isbnNode = doc.path("isbn");
                if (isbnNode.isArray() && isbnNode.size() > 0) {
                    String isbnVal = isbnNode.get(0).asText().trim();
                    if (StringUtils.hasText(isbnVal)) return "https://covers.openlibrary.org/b/isbn/" + isbnVal + "-L.jpg";
                }
            }
        } catch (Exception e) {
            log.warn("OpenLibrary error: {}", e.getMessage());
        }
        return null;
    }

    private String fetchGoogleBooksCover(String title, String author) {
        if (googleDisabled.get()) return null;
        try {
            String q = StringUtils.hasText(author) ?
                    String.format("intitle:%s+inauthor:%s", encode(title), encode(author)) : encode(title);
            String url = GOOGLE_BOOKS_BASE + "?q=" + q + "&maxResults=1&printType=books&fields=items(volumeInfo/imageLinks)";
            if (StringUtils.hasText(googleBooksApiKey)) url += "&key=" + googleBooksApiKey;

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            if (response.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                googleDisabled.set(true);
                return null;
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode items = root.path("items");
            if (items.isArray() && items.size() > 0) {
                String thumbnail = items.get(0).path("volumeInfo").path("imageLinks").path("thumbnail").asText(null);
                if (StringUtils.hasText(thumbnail)) {
                    if (thumbnail.startsWith("http:")) thumbnail = "https:" + thumbnail.substring(5);
                    return thumbnail.replace("zoom=1", "zoom=2");
                }
            }
        } catch (Exception e) {
            log.warn("Google Books error: {}", e.getMessage());
        }
        return null;
    }

    private String encode(String value) {
        try { return URLEncoder.encode(value, StandardCharsets.UTF_8); } 
        catch (Exception e) { return value.replace(" ", "+"); }
    }
}