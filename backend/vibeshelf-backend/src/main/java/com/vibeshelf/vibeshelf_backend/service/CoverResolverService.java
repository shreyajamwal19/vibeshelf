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
import java.time.Instant;
import java.util.Optional;
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

    // Global flag to disable Google Books after quota exhaustion for the lifetime of the application
    private final AtomicBoolean googleDisabled = new AtomicBoolean(false);

    public Book resolveAndCacheCover(Book book) {
        if (book == null) return null;

        // Never overwrite an existing valid cover
        if (StringUtils.hasText(book.getCoverUrl()) && !book.getCoverUrl().equals(PLACEHOLDER)) {
            log.debug("Cover already present for book: {} by {}", book.getTitle(), book.getAuthor());
            return book;
        }

        long start = System.currentTimeMillis();
        String originalCover = book.getCoverUrl();

        String coverUrl = null;
        String source = null;
        String isbn = book.getIsbn();

        // 1. Primary: Open Library (multiple strategies)
        coverUrl = fetchOpenLibraryCover(book.getTitle(), book.getAuthor(), isbn);
        if (StringUtils.hasText(coverUrl)) {
            source = "OPEN_LIBRARY";
        }

        // 2. Fallback: Google Books (only if Open Library failed and Google is enabled)
        if (!StringUtils.hasText(coverUrl) && !googleDisabled.get() && StringUtils.hasText(googleBooksApiKey)) {
            coverUrl = fetchGoogleBooksCover(book.getTitle(), book.getAuthor());
            if (StringUtils.hasText(coverUrl)) {
                source = "GOOGLE_BOOKS";
            }
        }

        // 3. Final fallback
        if (!StringUtils.hasText(coverUrl)) {
            coverUrl = PLACEHOLDER;
            source = "PLACEHOLDER";
        }

        // Update only if changed
        boolean updated = !coverUrl.equals(originalCover);
        if (updated) {
            book.setCoverUrl(coverUrl);
            if (StringUtils.hasText(isbn)) {
                book.setIsbn(isbn); // ensure we have it
            }
            // Note: If Book entity supports additional fields like coverSource/lastFetched, they would be set here
            bookRepository.save(book);
            log.info("Resolved cover for '{}' by {} from {} in {}ms", book.getTitle(), book.getAuthor(), source, System.currentTimeMillis() - start);
        } else {
            log.debug("No cover update needed for '{}'", book.getTitle());
        }

        return book;
    }

    private String fetchOpenLibraryCover(String title, String author, String isbn) {
        if (!StringUtils.hasText(title)) return null;

        // Strategy 1: Title + Author
        if (StringUtils.hasText(author)) {
            String url = OPEN_LIBRARY_BASE + "/search.json?limit=1&fields=cover_i,isbn,title&title=" +
                    encode(title) + "&author=" + encode(author);
            String cover = tryOpenLibrarySearch(url);
            if (cover != null) return cover;
        }

        // Strategy 2: Title only
        String urlTitleOnly = OPEN_LIBRARY_BASE + "/search.json?limit=1&fields=cover_i,isbn,title&title=" + encode(title);
        String cover = tryOpenLibrarySearch(urlTitleOnly);
        if (cover != null) return cover;

        // Strategy 3: ISBN if available
        if (StringUtils.hasText(isbn)) {
            String urlIsbn = OPEN_LIBRARY_BASE + "/search.json?limit=1&fields=cover_i&isbn=" + encode(isbn);
            return tryOpenLibrarySearch(urlIsbn);
        }

        return null;
    }

    private String tryOpenLibrarySearch(String url) {
        long start = System.currentTimeMillis();
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                log.warn("OpenLibrary search failed with status {} for URL: {}", response.getStatusCode(), url);
                return null;
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode docs = root.path("docs");

            if (docs.isArray() && docs.size() > 0) {
                JsonNode doc = docs.get(0);
                // Prefer cover_i
                long coverId = doc.path("cover_i").asLong(0);
                if (coverId > 0) {
                    return "https://covers.openlibrary.org/b/id/" + coverId + "-L.jpg";
                }
                // Fallback to ISBN
                JsonNode isbnNode = doc.path("isbn");
                if (isbnNode.isArray() && isbnNode.size() > 0) {
                    String isbnVal = isbnNode.get(0).asText().trim();
                    if (StringUtils.hasText(isbnVal)) {
                        return "https://covers.openlibrary.org/b/isbn/" + isbnVal + "-L.jpg";
                    }
                }
            }
            return null;
        } catch (RestClientException e) {
            log.warn("OpenLibrary network error: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("OpenLibrary JSON parsing error", e);
            return null;
        } finally {
            log.debug("OpenLibrary lookup took {}ms", System.currentTimeMillis() - start);
        }
    }

    private String fetchGoogleBooksCover(String title, String author) {
        if (googleDisabled.get()) return null;

        long start = System.currentTimeMillis();
        try {
            String q = StringUtils.hasText(author) ?
                    String.format("intitle:%s+inauthor:%s", encode(title), encode(author)) :
                    encode(title);

            String url = GOOGLE_BOOKS_BASE + "?q=" + q + "&maxResults=1&printType=books&fields=items(volumeInfo/imageLinks,volumeInfo/industryIdentifiers)";

            if (StringUtils.hasText(googleBooksApiKey)) {
                url += "&key=" + googleBooksApiKey;
            }

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS ||
                response.getStatusCode().value() == 429 ||
                (response.getBody() != null && response.getBody().contains("RATE_LIMIT_EXCEEDED"))) {

                googleDisabled.set(true);
                log.error("Google Books quota exhausted. Disabling Google Books lookups for this application session.");
                return null;
            }

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.warn("Google Books returned status: {}", response.getStatusCode());
                return null;
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode items = root.path("items");

            if (items.isArray() && items.size() > 0) {
                JsonNode volumeInfo = items.get(0).path("volumeInfo");
                JsonNode imageLinks = volumeInfo.path("imageLinks");

                String thumbnail = imageLinks.path("thumbnail").asText(null);
                if (StringUtils.hasText(thumbnail)) {
                    if (thumbnail.startsWith("http:")) {
                        thumbnail = "https:" + thumbnail.substring(5);
                    }
                    return thumbnail.replace("zoom=1", "zoom=2");
                }
            }
            return null;
        } catch (RestClientException e) {
            log.warn("Google Books network error: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("Google Books error", e);
            return null;
        } finally {
            log.debug("Google Books lookup took {}ms", System.currentTimeMillis() - start);
        }
    }

    private String encode(String value) {
        try {
            return URLEncoder.encode(value, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return value.replace(" ", "+");
        }
    }
}