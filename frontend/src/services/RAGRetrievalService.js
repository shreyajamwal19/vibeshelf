/**
 * RAGRetrievalService.js - Retrieves relevant books using semantic search
 * Acts as the "knowledge layer" for WebLLM reasoning
 */

import BooksKnowledgeBase from './BooksKnowledgeBase.js';
import { getSession } from './AISessionContext.js';

/**
 * Retrieve semantically relevant books for a query
 * Uses multiple retrieval strategies for diversity
 */
export async function retrieveRelevantBooks(query, options = {}) {
  const {
    topK = 100,
    diversifyByGenre = true,
    diversifyByAuthor = true,
  } = options;

  const session = getSession();

  try {
    console.log('[RAG] Retrieving books for query:', query);

    // Strategy 1: Semantic search on query
    const semanticResults = await BooksKnowledgeBase.searchBooks(query, {
      limit: topK * 2, // Get extra for filtering
      excludeIds: Array.from(session.shownBooks),
      preferGenres: Array.from(session.likedGenres),
      preferMoods: Array.from(session.likedMoods),
      avoidThemes: Array.from(session.dislikedThemes),
    });

    console.log('[RAG] Semantic search returned', semanticResults.length, 'candidates');

    // Strategy 2: If user has liked genres, add genre-specific picks
    let results = [...semanticResults];
    if (session.likedGenres.size > 0) {
      for (const genre of Array.from(session.likedGenres).slice(0, 2)) {
        const genreBooks = await BooksKnowledgeBase.getByGenre(genre, 20);
        const newBooks = genreBooks.filter(
          b => !results.some(r => r.id === b.id) && !session.shownBooks.has(b.id)
        );
        results.push(...newBooks.slice(0, 10));
      }
    }

    // Strategy 3: Add BookTok trending if query mentions trends
    if (query.toLowerCase().includes('trending') || query.toLowerCase().includes('booktok')) {
      const trending = await BooksKnowledgeBase.getBookTokTrending(20);
      const newBooks = trending.filter(
        b => !results.some(r => r.id === b.id) && !session.shownBooks.has(b.id)
      );
      results.push(...newBooks.slice(0, 10));
    }

    // Strategy 4: Add hidden gems if query mentions hidden/underrated
    if (query.toLowerCase().includes('hidden') || query.toLowerCase().includes('underrated')) {
      const gems = await BooksKnowledgeBase.getHiddenGems(20);
      const newBooks = gems.filter(
        b => !results.some(r => r.id === b.id) && !session.shownBooks.has(b.id)
      );
      results.push(...newBooks.slice(0, 10));
    }

    // Remove duplicates and limit to topK
    const uniqueResults = [];
    const seenIds = new Set();
    for (const book of results) {
      if (!seenIds.has(book.id)) {
        uniqueResults.push(book);
        seenIds.add(book.id);
      }
      if (uniqueResults.length >= topK) break;
    }

    console.log('[RAG] Retrieved', uniqueResults.length, 'books for RAG context');

    return uniqueResults;
  } catch (error) {
    console.error('[RAG] Retrieval error:', error);
    // Fallback: return popular books
    return BooksKnowledgeBase.getPopularBooks(topK);
  }
}

/**
 * Format retrieval results into context for WebLLM
 */
export function formatBooksForContext(books, maxBooks = 50) {
  if (!books || books.length === 0) {
    return 'No books available';
  }

  const displayBooks = books.slice(0, maxBooks);
  const formatted = displayBooks
    .map((b, i) => {
      const genres = b.genres?.join(', ') || 'various';
      const moods = b.moods?.join(', ') || 'diverse';
      const feel = b.feel || 'compelling read';
      return `${i + 1}. "${b.title}" by ${b.author}\n   Genres: ${genres}\n   Moods: ${moods}\n   Feel: ${feel}`;
    })
    .join('\n\n');

  return `Available books in knowledge base (showing ${displayBooks.length} of ${books.length} candidates):\n\n${formatted}`;
}

/**
 * Get reranking context (helps WebLLM pick best books)
 */
export function getRerankerContext(books, userQuery) {
  const session = getSession();
  const likedGenres = Array.from(session.likedGenres).join(', ') || 'not specified';
  const dislikedThemes = Array.from(session.dislikedThemes).join(', ') || 'none';

  return `Reranking context for query: "${userQuery}"
User's liked genres: ${likedGenres}
Avoid themes: ${dislikedThemes}
Books already shown: ${session.shownBooks.size}

Your task: From the provided books, select the 5 BEST matches that:
1. Match the user's query intent
2. Consider their genre and mood preferences
3. Avoid previously recommended books
4. Offer diversity in authors and sub-genres
5. Balance between popular picks and hidden gems`;
}

/**
 * Extract books from WebLLM response
 */
export async function extractBooksFromResponse(response, availableBooks) {
  try {
    const bookTitlesInResponse = [];

    // Extract quoted book titles from response
    const quoteMatches = response.match(/"([^"]+)"/g);
    if (quoteMatches) {
      quoteMatches.forEach(match => {
        const title = match.replace(/"/g, '');
        const found = availableBooks.find(b =>
          b.title.toLowerCase() === title.toLowerCase() ||
          b.title.toLowerCase().includes(title.toLowerCase())
        );
        if (found && !bookTitlesInResponse.some(b => b.id === found.id)) {
          bookTitlesInResponse.push(found);
        }
      });
    }

    console.log('[RAG] Extracted', bookTitlesInResponse.length, 'books from response');
    return bookTitlesInResponse;
  } catch (error) {
    console.error('[RAG] Book extraction error:', error);
    return [];
  }
}

/**
 * Build full RAG context for WebLLM
 */
export async function buildRAGContext(userQuery) {
  console.log('[RAG] Building context for:', userQuery);

  // Retrieve relevant books
  const retrievedBooks = await retrieveRelevantBooks(userQuery, { topK: 100 });

  // Format for context
  const booksContext = formatBooksForContext(retrievedBooks, 50);

  // Get reranking guidance
  const rerankerContext = getRerankerContext(retrievedBooks, userQuery);

  // Get session context
  const session = getSession();
  const sessionContext = session.getContextPrompt();

  return {
    retrievedBooks,
    booksContext,
    rerankerContext,
    sessionContext,
    bookCount: retrievedBooks.length,
  };
}

export default {
  retrieveRelevantBooks,
  formatBooksForContext,
  getRerankerContext,
  extractBooksFromResponse,
  buildRAGContext,
};
