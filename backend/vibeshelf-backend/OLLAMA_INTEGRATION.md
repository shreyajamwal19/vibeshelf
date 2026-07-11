# 🤖 AI-Powered Book Recommendation Feature (Ollama Integration)

## Overview

This feature adds **AI-powered book recommendations** to VibeShelf using **Ollama**, a local, privacy-friendly LLM (Large Language Model). Users can request book recommendations based on their current mood, and the system will return personalized, Gen-Z friendly suggestions via BookTok-style descriptions.

### Key Features

✅ **Local LLM** - Uses Ollama (no external API calls, no cost)
✅ **Gen-Z Friendly** - BookTok-style emotional, aesthetic recommendations
✅ **Smart Caching** - In-memory mood-based caching to reduce redundant calls
✅ **Error Handling** - Graceful fallbacks if Ollama is unavailable
✅ **Structured Output** - JSON parsing with validation
✅ **Production-Ready** - Clean, well-documented, follows Spring Boot best practices

---

## Prerequisites

### 1. Install Ollama

Download and install Ollama from: [ollama.com](https://ollama.com)

### 2. Pull a Model

Run one of these commands in your terminal:

```bash
# Recommended: llama3 (faster, smaller)
ollama pull llama3

# OR: mistral (higher quality, slower)
ollama pull mistral

# OR: neural-chat (balanced)
ollama pull neural-chat
```

### 3. Start Ollama Server

```bash
ollama serve
```

This will start the Ollama server on `http://localhost:11434`

---

## Architecture

### Component Breakdown

```
APIRecommendationController
  ↓
  └─→ OllamaBookRecommenderService
      ├─→ buildPrompt() - Creates the GenZ-friendly prompt
      ├─→ callOllamaAPI() - HTTP request to Ollama
      ├─→ parseRecommendations() - JSON parsing & validation
      └─→ Cache Management (in-memory ConcurrentHashMap)
```

### Files Created

1. **DTOs (Data Transfer Objects)**
   - `MoodRecommendationRequest.java` - Input request structure
   - `BookRecommendation.java` - Individual recommendation structure

2. **Service Layer**
   - `OllamaBookRecommenderService.java` - Core recommendation logic

3. **Controller Layer**
   - `AIRecommendationController.java` - REST endpoints

4. **Configuration**
   - `RestTemplateConfig.java` - HTTP client setup
   - `application.properties` - Ollama configuration

---

## API Documentation

### Endpoint: `POST /api/recommend`

**Request:**
```json
{
  "mood": "heartbreak and hopeful recovery"
}
```

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "title": "It Ends with Us",
      "author": "Colleen Hoover",
      "reason": "A raw, emotional journey of healing and self-discovery. Colleen's prose hits different when you're piecing yourself back together. The main character's strength through pain feels so personal and real."
    },
    {
      "title": "The Song of Achilles",
      "author": "Madeline Miller",
      "reason": "Ancient Greek mythology reimagined as a love story of epic proportions. The bittersweet ending teaches that some love is worth every ounce of pain. Poetic, emotional, and deeply moving."
    },
    {
      "title": "One Day",
      "author": "David Nicholls",
      "reason": "Following two people through decades of their lives. It shows you that healing isn't linear and that silver linings come when you least expect them. Makes you cry but also believe in hope again."
    },
    {
      "title": "Eleanor & Park",
      "author": "Rainbow Rowell",
      "reason": "Young love that feels electric but also vulnerable. It reminds you that even when things don't work out perfectly, the connection you shared was real and will always matter. Hopeful and emotional."
    },
    {
      "title": "We Have Always Lived in the Castle",
      "author": "Shirley Jackson",
      "reason": "A quirky, atmospheric tale of rebuilding life after trauma. The protagonist's quiet strength and refusal to let the world define her is exactly what you need to hear right now. Unique and deeply resonant."
    }
  ],
  "mood": "heartbreak and hopeful recovery",
  "count": 5,
  "processingTimeMs": 2850
}
```

**Response (Error - Service Unavailable - 503):**
```json
{
  "success": false,
  "error": "Ollama service unavailable. Ensure it's running at http://localhost:11434/api/generate",
  "mood": "happy"
}
```

### Health Check Endpoint: `GET /api/recommend/health`

**Response:**
```json
{
  "status": "ok",
  "service": "ollama-book-recommender",
  "model": "llama3 or mistral",
  "version": "1.0"
}
```

### Cache Management: `POST /api/recommend/cache/clear`

**Response:**
```json
{
  "message": "Cache cleared successfully"
}
```

---

## Configuration

Edit `src/main/resources/application.properties`:

```properties
# Ollama API Configuration
ollama.api.url=http://localhost:11434/api/generate
ollama.model=llama3  # or mistral, neural-chat, etc.
```

### Changing the Model

To use a different model:

1. Pull the model: `ollama pull mistral`
2. Update `application.properties`: `ollama.model=mistral`
3. Restart Spring Boot

---

## The Prompt (Critical Component)

The system sends this prompt to Ollama:

```
You are a Gen-Z BookTok enthusiast who LOVES giving emotional, aesthetic book recommendations. \
Your recommendations are relatable, emotional, and capture the exact vibe people need.

User's Mood: "heartbreak and hopeful recovery"

Your task: Recommend exactly 5 books that match this mood perfectly.

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON array (no markdown, no extra text)
2. Each book must have: "title", "author", "reason"
3. The "reason" must be 2-3 lines describing the vibe in emotional, aesthetic Gen-Z language
4. Use BookTok energy - be relatable, use modern language, connect emotionally
5. Do not include any text before or after the JSON array

Here is the EXACT JSON format you MUST follow:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "reason": "A 2-3 line emotional description of why this book matches the mood..."
  },
  ...
]

Now generate 5 book recommendations for the mood "heartbreak and hopeful recovery":
```

**Why This Works:**
- Role-plays the model as a BookTok creator
- Explicitly requests JSON-only output
- Specifies exact format to reduce parsing errors
- Instructs emotional, Gen-Z language
- Limits to exactly 5 books
- Includes the mood twice (reinforcement)

---

## Integration with Frontend

### React Example

```jsx
import { useState } from 'react';

function BookRecommender() {
  const [mood, setMood] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGetRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood }),
      });

      const data = await response.json();

      if (data.success) {
        setBooks(data.data);
      } else {
        setError(data.error || 'Failed to get recommendations');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recommender">
      <input
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        placeholder="What's your mood?"
      />
      <button onClick={handleGetRecommendations} disabled={loading}>
        {loading ? 'Getting recommendations...' : 'Get Books'}
      </button>

      {error && <p className="error">{error}</p>}

      {books.map((book, i) => (
        <div key={i} className="book-card">
          <h3>{book.title}</h3>
          <p className="author">by {book.author}</p>
          <p className="reason">{book.reason}</p>
        </div>
      ))}
    </div>
  );
}

export default BookRecommender;
```

---

## How It Works (Flow Diagram)

```
1. User submits mood via POST /api/recommend
                    ↓
2. AIRecommendationController validates request
                    ↓
3. OllamaBookRecommenderService checks cache
   ├─ Hit? → Return cached recommendations
   └─ Miss? → Proceed to step 4
                    ↓
4. Build prompt with mood
                    ↓
5. Call Ollama API via HTTP (RestTemplate)
   {
     "model": "llama3",
     "prompt": "[detailed prompt with mood]",
     "stream": false
   }
                    ↓
6. Parse response JSON
                    ↓
7. Validate all 5 books have title, author, reason
                    ↓
8. Cache results (1 hour TTL)
                    ↓
9. Return JSON response to frontend
```

---

## Performance & Optimization

### Caching Strategy

**In-Memory Cache:**
- Key: `mood` (lowercase, trimmed)
- Value: List of 5 recommendations
- TTL: 1 hour
- Storage: `ConcurrentHashMap` (thread-safe)

**Benefits:**
- Same mood requests are instant
- Reduces Ollama API calls
- No external cache needed

**Production Upgrade:**
Replace the in-memory cache with Redis using Spring's `@Cacheable`:

```java
@Cacheable(value = "recommendations", key = "#mood")
public List<BookRecommendation> getRecommendationsByMood(String mood) {
    // ... existing code
}
```

### Response Times

- **Cached:** ~5-10 ms
- **Fresh from Ollama:** 2-10 seconds (depends on model & hardware)

### Model Selection

| Model | Speed | Quality | Memory | Recommended |
|-------|-------|---------|--------|---|
| llama3 | Fast | High | 4GB | ✅ Best balance |
| mistral | Fast | Medium | 5GB | Good |
| neural-chat | Medium | High | 3.5GB | ✅ Alternative |
| orca-mini | Very Fast | Medium | 1.3GB | Low-end devices |

---

## Error Handling

### Scenario 1: Ollama Not Running

**Error Response:**
```json
{
  "success": false,
  "error": "Ollama service unavailable. Ensure it's running at http://localhost:11434/api/generate",
  "mood": "happy"
}
```

**Status:** 503 Service Unavailable

**Solution:**
```bash
ollama serve  # Start Ollama
```

### Scenario 2: Invalid JSON Response

**Logged Error:**
```
Failed to parse Ollama response as JSON. Response: [invalid json]
```

**User Response:**
```json
{
  "success": false,
  "error": "Failed to parse AI recommendations: [detailed error]",
  "mood": "happy"
}
```

**Status:** 500 Internal Server Error

**Solution:** Retry (may be temporary model issue)

### Scenario 3: Empty Mood Input

**Error Response:**
```json
{
  "success": false,
  "error": "Mood cannot be empty"
}
```

**Status:** 400 Bad Request

---

## Testing

### Unit Test Example

```java
@SpringBootTest
class OllamaBookRecommenderServiceTest {

    @MockBean
    private RestTemplate restTemplate;

    @Autowired
    private OllamaBookRecommenderService service;

    @Test
    void testGetRecommendationsByMood() {
        // Mock Ollama response
        String mockResponse = """
            [
              {"title": "Test Book", "author": "Test Author", "reason": "Test reason"}
            ]
            """;

        Map<String, Object> ollamaResponse = new HashMap<>();
        ollamaResponse.put("response", mockResponse);

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
            .thenReturn(ollamaResponse);

        // Call service
        List<BookRecommendation> recommendations = 
            service.getRecommendationsByMood("happy");

        // Assert
        assertEquals(1, recommendations.size());
        assertEquals("Test Book", recommendations.get(0).getTitle());
    }
}
```

### Manual Testing with cURL

```bash
# Request
curl -X POST http://localhost:8080/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"mood": "dark and mysterious"}'

# Health check
curl http://localhost:8080/api/recommend/health

# Clear cache
curl -X POST http://localhost:8080/api/recommend/cache/clear
```

---

## Troubleshooting

### Problem: "Connection refused" error

```
Ollama service unavailable. Ensure it's running at http://localhost:11434/api/generate
```

**Solution:**
```bash
ollama serve
```

Make sure port 11434 is not blocked by firewall.

### Problem: Response is slow (10+ seconds)

**Causes:**
1. Model is large (mistral takes longer than llama3)
2. CPU-bound (no GPU acceleration)
3. Ollama server is busy

**Solutions:**
- Switch to faster model: `ollama pull llama3`
- Check Ollama logs: `tail -f ~/.ollama/logs`
- Increase timeouts in `RestTemplateConfig.java`

### Problem: JSON parsing fails

**Solution:**
1. Check Ollama logs for model output
2. Try a different model
3. Adjust the prompt in `buildPrompt()`

---

## Production Checklist

- [ ] Set environment variable: `OLLAMA_API_URL` instead of hardcoding
- [ ] Use Redis instead of in-memory cache
- [ ] Add request rate limiting
- [ ] Add authentication to cache clear endpoint
- [ ] Monitor Ollama API latency
- [ ] Set up fallback recommendations (pre-curated list)
- [ ] Add logging/metrics
- [ ] Test with different models
- [ ] Load test with multiple concurrent requests
- [ ] Add retry logic for transient failures

---

## Environment Variables (Recommended)

Create `.env` file:

```env
OLLAMA_API_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3
OLLAMA_TIMEOUT_SECONDS=60
```

Then update `RestTemplateConfig.java`:

```java
@Value("${OLLAMA_TIMEOUT_SECONDS:60}")
private int timeoutSeconds;
```

---

## FAQ

### Q: Does this work offline?
**A:** Yes! Ollama runs locally. Once the model is downloaded, no internet required.

### Q: What if Ollama crashes?
**A:** The service will return a 503 error. You can implement a fallback that queries the database for genre-based recommendations.

### Q: Can I use a different model?
**A:** Yes! Ollama supports 100+ models. Just `ollama pull model_name` and update `application.properties`.

### Q: Is this privacy-friendly?
**A:** 100%! All data stays on your machine. No cloud APIs, no tracking.

### Q: How much VRAM do I need?
**A:** 
- llama3: 4GB
- mistral: 5GB
- orca-mini: 2GB

### Q: Can multiple users request simultaneously?
**A:** Yes! The cache uses `ConcurrentHashMap` and RestTemplate is thread-safe.

---

## Next Steps

1. ✅ Install Ollama and pull a model
2. ✅ Copy files to your backend
3. ✅ Update `application.properties`
4. ✅ Build & run: `mvn spring-boot:run`
5. ✅ Test: `POST /api/recommend` with mood
6. ✅ Integrate into frontend React component
7. ✅ Deploy with Ollama running on same server

---

## Support & Issues

- **Ollama docs:** https://github.com/ollama/ollama
- **Models:** https://ollama.com/library
- **Spring Boot docs:** https://spring.io/projects/spring-boot

---

**Made with ❤️ for VibeShelf**

Last Updated: 2026-04-28
