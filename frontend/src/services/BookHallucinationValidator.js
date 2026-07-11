/**
 * BookHallucinationValidator.js - Prevents fake/synthetic book recommendations
 * Ensures ONLY real books from trusted sources are recommended
 * 
 * Strategy:
 * 1. Ground WebLLM with REAL candidate books only
 * 2. Validate every recommendation against real data
 * 3. Fallback to ranked real books if validation fails
 * 4. Never allow synthetic/hallucinated titles
 */

import BooksKnowledgeBase from './BooksKnowledgeBase.js';
import { BOOK_LIBRARY } from '../data/BookLibrary.js';

/**
 * Fetch real books from multiple trusted sources
 * Priority: Local BOOK_LIBRARY > IndexedDB > Open Library API
 */
export async function fetchRealBookCandidates(userQuery, options = {}) {
  const {
    limit = 30,
    excludeIds = new Set(),
    fallbackToBestRanked = true,
  } = options;

  const candidates = [];
  const seenIds = new Set(Array.from(excludeIds));

  try {
    console.log('[Validator] Fetching real book candidates for:', userQuery);

    // SOURCE 1: Local BOOK_LIBRARY (most trusted)
    if (BOOK_LIBRARY && BOOK_LIBRARY.length > 0) {
      console.log('[Validator] Source 1: Local BOOK_LIBRARY');
      BOOK_LIBRARY.forEach(book => {
        if (!seenIds.has(book.id) && candidates.length < limit) {
          candidates.push({
            ...book,
            source: 'local_library',
            trustScore: 1.0,
          });
          seenIds.add(book.id);
        }
      });
    }

    // SOURCE 2: IndexedDB Knowledge Base (semantic search)
    if (candidates.length < limit) {
      console.log('[Validator] Source 2: IndexedDB Knowledge Base');
      const kbBooks = await BooksKnowledgeBase.searchBooks(userQuery, {
        limit: limit * 2,
        excludeIds: Array.from(excludeIds),
      });

      kbBooks.forEach(book => {
        if (!seenIds.has(book.id) && candidates.length < limit) {
          candidates.push({
            ...book,
            source: 'knowledge_base',
            trustScore: 0.95,
          });
          seenIds.add(book.id);
        }
      });
    }

    // SOURCE 3: Open Library API (external validation)
    if (candidates.length < limit) {
      console.log('[Validator] Source 3: Fetching from Open Library API');
      const apiBooks = await fetchFromOpenLibrary(userQuery, limit - candidates.length);
      
      apiBooks.forEach(book => {
        if (!seenIds.has(book.id) && candidates.length < limit) {
          candidates.push({
            ...book,
            source: 'open_library_api',
            trustScore: 0.9,
          });
          seenIds.add(book.id);
        }
      });
    }

    // SOURCE 4: Get by genre if applicable
    if (candidates.length < limit && userQuery.toLowerCase().includes('fantasy')) {
      console.log('[Validator] Source 4: Genre-specific books');
      const genreBooks = await BooksKnowledgeBase.getByGenre('fantasy', limit - candidates.length);
      
      genreBooks.forEach(book => {
        if (!seenIds.has(book.id) && candidates.length < limit) {
          candidates.push({
            ...book,
            source: 'genre_filter',
            trustScore: 0.9,
          });
          seenIds.add(book.id);
        }
      });
    }

    console.log(`[Validator] Found ${candidates.length} real candidates from trusted sources`);

    return candidates;
  } catch (error) {
    console.error('[Validator] Error fetching candidates:', error);
    // Fallback to best ranked books
    if (fallbackToBestRanked) {
      const fallback = await BooksKnowledgeBase.getPopularBooks(limit);
      return fallback.map(b => ({
        ...b,
        source: 'fallback_popular',
        trustScore: 0.8,
      }));
    }
    return [];
  }
}

/**
 * Fetch real books from Open Library API
 * Calls open.library.org - free, no auth needed
 */
async function fetchFromOpenLibrary(query, limit = 10) {
  try {
    const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=${limit}`;
    
    console.log('[Validator] Calling Open Library API...');
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`Open Library API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.docs || data.docs.length === 0) {
      console.log('[Validator] Open Library returned no results');
      return [];
    }

    const books = data.docs.slice(0, limit).map((doc, i) => ({
      id: `ol_${doc.key || i}`,
      title: doc.title || 'Unknown Title',
      author: doc.author_name?.[0] || 'Unknown Author',
      description: doc.first_sentence?.[0] || 'No description available',
      genres: doc.subject?.slice(0, 3) || [],
      year_published: doc.first_publish_year || new Date().getFullYear(),
      popularity: 50,
      moods: [],
      tropes: [],
      themes: [],
      booktok_tags: [],
      hidden_gem_score: 50,
      series: null,
      series_order: null,
      feel: 'A real book from Open Library',
      source: 'open_library',
      externalId: doc.key,
    }));

    console.log(`[Validator] Open Library returned ${books.length} real books`);
    return books;
  } catch (error) {
    console.error('[Validator] Open Library API error:', error);
    return [];
  }
}

/**
 * Validate that a book title exists in our trusted sources
 * Returns the real book object if found, null if hallucinated
 */
export function validateBookTitle(title, candidates) {
  if (!title || !candidates || candidates.length === 0) {
    return null;
  }

  const normalizeTitle = (t) => t.toLowerCase().trim().replace(/[^\w\s]/g, '');
  const normalizedSearch = normalizeTitle(title);

  // Exact match first
  let match = candidates.find(b =>
    normalizeTitle(b.title) === normalizedSearch
  );

  if (match) {
    console.log(`[Validator] ✅ Validated: "${title}"`);
    return match;
  }

  // Fuzzy match (substring)
  match = candidates.find(b =>
    normalizeTitle(b.title).includes(normalizedSearch) ||
    normalizedSearch.includes(normalizeTitle(b.title))
  );

  if (match) {
    console.log(`[Validator] ✅ Validated (fuzzy): "${title}" → "${match.title}"`);
    return match;
  }

  // Not found = hallucination
  console.warn(`[Validator] ❌ HALLUCINATION DETECTED: "${title}" not in candidates`);
  return null;
}

/**
 * Validate author against a book
 * Some hallucinations invent wrong authors for real books
 */
export function validateBookAuthor(title, author, candidates) {
  const book = candidates.find(b =>
    b.title.toLowerCase() === title.toLowerCase()
  );

  if (!book) {
    return null;
  }

  const normalizeAuthor = (a) => a.toLowerCase().trim();
  const normalizedInput = normalizeAuthor(author);
  const normalizedBook = normalizeAuthor(book.author);

  // Check for match
  if (normalizedBook.includes(normalizedInput) || normalizedInput.includes(normalizedBook)) {
    return book;
  }

  // Wrong author for this book (hallucination)
  console.warn(`[Validator] ❌ Wrong author: "${author}" for "${title}", actual: "${book.author}"`);
  return null;
}

/**
 * Extract and validate books from WebLLM response
 * Returns ONLY real books, discards hallucinations
 */
export async function extractAndValidateBooks(response, candidates) {
  const validatedBooks = [];
  const hallucinatedTitles = [];

  // Pattern 1: **"Book Title"** by Author
  const pattern1 = /\*\*"([^"]+)"\*\*\s+by\s+([^,\n]+)/g;
  let match;

  while ((match = pattern1.exec(response)) !== null) {
    const title = match[1].trim();
    const author = match[2].trim();

    const validated = validateBookAuthor(title, author, candidates);
    if (validated) {
      validatedBooks.push(validated);
    } else {
      hallucinatedTitles.push(title);
    }
  }

  // Pattern 2: **Book Title** by Author (without quotes)
  if (validatedBooks.length < 5) {
    const pattern2 = /\*\*([^*]+)\*\*\s+by\s+([^,\n]+)/g;
    while ((match = pattern2.exec(response)) !== null) {
      const title = match[1].trim();
      const author = match[2].trim();

      const validated = validateBookAuthor(title, author, candidates);
      if (validated && !validatedBooks.some(b => b.id === validated.id)) {
        validatedBooks.push(validated);
      } else if (!hallucinatedTitles.includes(title)) {
        hallucinatedTitles.push(title);
      }
    }
  }

  console.log(`[Validator] Extracted ${validatedBooks.length} real books, ${hallucinatedTitles.length} hallucinations`);
  
  if (hallucinatedTitles.length > 0) {
    console.warn('[Validator] Hallucinated titles:', hallucinatedTitles.join(', '));
  }

  return {
    validatedBooks,
    hallucinatedTitles,
    hallucinationDetected: hallucinatedTitles.length > 0,
  };
}

/**
 * Fallback to top-ranked REAL books if validation fails
 * Ensures response always has REAL books
 */
export function getFallbackRealBooks(candidates, count = 5) {
  console.log('[Validator] Using fallback: top ranked real books');
  
  // Sort by trust score, then popularity
  const ranked = candidates
    .sort((a, b) => {
      const trustDiff = (b.trustScore || 0.5) - (a.trustScore || 0.5);
      if (trustDiff !== 0) return trustDiff;
      return (b.popularity || 0) - (a.popularity || 0);
    })
    .slice(0, count);

  return ranked;
}

/**
 * Build GROUNDED prompt for WebLLM
 * Explicitly tells model to ONLY use provided books
 */
export function buildGroundedPrompt(userQuery, candidates, sessionContext) {
  const booksList = candidates
    .slice(0, 30) // Limit to 30 for context
    .map((b, i) => {
      const genres = b.genres?.join(', ') || 'various';
      const moods = b.moods?.join(', ') || 'diverse';
      return `${i + 1}. "${b.title}" by ${b.author} (${genres}, ${moods})`;
    })
    .join('\n');

  return {
    system: `${sessionContext}

CRITICAL INSTRUCTION: You are recommending books from a curated library. 
You MUST ONLY recommend books from the provided list. 
NEVER invent, hallucinate, or create fake book titles.
NEVER recommend books not in the provided list.
If a user asks for a type of book not in the list, recommend the closest matches from what's available.`,
    
    user: `From this curated library of ${candidates.length} real books, select exactly 5 that best match the user's request:

${booksList}

User request: "${userQuery}"

For each selected book:
1. State the exact title and author from the list above
2. Explain why it matches their request
3. Keep tone warm and conversational

Remember: ONLY recommend books from the list. Do NOT invent titles.`,
  };
}

/**
 * Complete anti-hallucination pipeline
 */
export async function validateAndGroundRecommendations(userQuery, sessionContext, excludeIds = new Set()) {
  try {
    console.log('[Validator] Starting anti-hallucination pipeline...');

    // Step 1: Fetch real candidates
    const candidates = await fetchRealBookCandidates(userQuery, {
      limit: 30,
      excludeIds,
      fallbackToBestRanked: true,
    });

    if (candidates.length === 0) {
      console.error('[Validator] ❌ No candidates found!');
      return {
        candidates: [],
        grounded: false,
        reason: 'No candidates available',
      };
    }

    // Step 2: Build grounded prompt
    const groundedPrompt = buildGroundedPrompt(userQuery, candidates, sessionContext);

    console.log(`[Validator] ✅ Anti-hallucination pipeline ready with ${candidates.length} real books`);

    return {
      candidates,
      groundedPrompt,
      bookCount: candidates.length,
      grounded: true,
    };
  } catch (error) {
    console.error('[Validator] Pipeline error:', error);
    return {
      candidates: [],
      grounded: false,
      error: error.message,
    };
  }
}

export default {
  fetchRealBookCandidates,
  validateBookTitle,
  validateBookAuthor,
  extractAndValidateBooks,
  getFallbackRealBooks,
  buildGroundedPrompt,
  validateAndGroundRecommendations,
};
