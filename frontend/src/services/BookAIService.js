// BookAIService.js - Uses permanent BOOK_LIBRARY with optional Web LLM
import { 
  BOOK_LIBRARY, 
  getBooksByMood, 
  getPopularBooks, 
  getRandomBooks 
} from '../data/BookLibrary.js';

import {
  initializeWebLLM,
  generateAIRecommendations,
  isWebLLMReady,  // NEW: Import the single source of truth!
} from './WebLLMService.js';

import { initializeSession } from './AISessionContext.js';
import RAGRetrievalService from './RAGRetrievalService.js';

// Global flag: use Web LLM or fallback?
let useWebLLM = true;
// NOTE: Removed local webLLMReady flag - use isWebLLMReady() from WebLLMService instead!

// Session initialization state
let sessionInitialized = false;

// Helper: Format book recommendations
function buildFallbackResponseFromBooks(books) {
  if (!books || books.length === 0) {
    return "📚 No books found. Trying random selection...";
  }
  
  const topBooks = books.slice(0, 5);
  const booksList = topBooks
    .map((b, i) => `${i + 1}. "${b.title}" by ${b.author}`)
    .join('\n');
  
  return `Here are my recommendations:\n\n${booksList}\n\nEnjoy your read!`;
}

// Generate recommendation from permanent library
function generateFallbackRecommendation(query, shownBooks = []) {
  if (!BOOK_LIBRARY || BOOK_LIBRARY.length === 0) {
    return "📚 Book library failed to load.";
  }
  
  const queryLower = query.toLowerCase();
  
  // Semantic mood matching
  const moodMap = {
    happy: ['happy', 'uplifting', 'joy', 'cheerful', 'funny', 'inspiring'],
    cozy: ['cozy', 'comfort', 'warm', 'peaceful'],
    dark: ['dark', 'gothic', 'creepy', 'suspenseful'],
    sad: ['melancholic', 'sad', 'emotional', 'heartbreak'],
    mystery: ['mystery', 'thriller', 'detective', 'secret'],
    adventure: ['adventure', 'action', 'quest'],
    fantasy: ['fantasy', 'magic', 'wizard'],
    romance: ['romance', 'love', 'passion'],
    thoughtful: ['think', 'philosophical', 'meaningful'],
    emotional: ['emotional', 'vulnerable', 'cathartic']
  };
  
  let bestMood = 'thoughtful';
  for (const [mood, keywords] of Object.entries(moodMap)) {
    if (keywords.some(k => queryLower.includes(k))) {
      bestMood = mood;
      break;
    }
  }
  
  // Get books for mood
  let candidates = getBooksByMood(bestMood);
  if (!candidates || candidates.length === 0) {
    candidates = getPopularBooks(10);
  }
  
  // Filter out already shown books
  const shownLower = new Set(shownBooks.map(b => b.toLowerCase()));
  const available = candidates.filter(b => 
    !shownLower.has(`${b.title.toLowerCase()} by ${b.author.toLowerCase()}`)
  );
  
  // Use available or fallback to random
  const finalBooks = available.length > 0 ? available : getRandomBooks(5);
  
  return buildFallbackResponseFromBooks(finalBooks, bestMood);
}

// Create book index
export function createBookIndex(books) {
  const source = (books && books.length > 0) ? books : BOOK_LIBRARY;
  return source.map((b, i) => ({
    id: b.id ?? i,
    title: b.title || '',
    author: b.author || '',
    description: b.description || '',
    genre: b.genres || [],
    mood: b.moods || [],
    rating: b.popularityScore ?? null,
    raw: b,
    searchable: `${b.title} ${b.author}`.toLowerCase()
  }));
}

// Search utility
function scoreMatch(entry, tokens) {
  let score = 0;
  const s = entry.searchable;
  
  tokens.forEach(t => {
    if (!t || t.length < 2) return;
    if (s.indexOf(t) !== -1) {
      score += 2;
    }
    if (entry.title.toLowerCase().includes(t)) score += 6;
    if (entry.author.toLowerCase().includes(t)) score += 4;
  });
  
  if (entry.rating) score += Math.min(2, Number(entry.rating) / 100);
  return score;
}

export function searchBooks(query, index, opts = {}) {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();
  const tokens = q.split(/\s+/).filter(Boolean);
  
  let candidates = index;
  if (opts.filters?.genre) {
    const g = opts.filters.genre.toLowerCase();
    candidates = candidates.filter(e => 
      (Array.isArray(e.genre) ? e.genre.join(' ') : e.genre).toLowerCase().includes(g)
    );
  }
  
  const scored = candidates.map(e => ({ e, score: scoreMatch(e, tokens) }));
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, opts.topK || 8).map(s => s.e);
}

export function searchBooksByMood(query, booksRaw, opts = {}) {
  if (!query || !query.trim()) return [];
  
  const books = (booksRaw && booksRaw.length > 0) ? booksRaw : BOOK_LIBRARY;
  const queryLower = query.toLowerCase();
  
  // Score each book
  const scored = books.map(book => {
    let score = 0;
    const bookText = `${book.title} ${book.author} ${(book.moods || []).join(' ')}`.toLowerCase();
    
    if (bookText.includes(queryLower)) score += 5;
    
    // Mood matching
    if ((book.moods || []).some(m => queryLower.includes(m.toLowerCase()))) {
      score += 10;
    }
    
    return { book, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  return scored.filter(s => s.score > 0).slice(0, opts.topK || 10).map(s => s.book);
}

export function buildBookPrompt(books, query, opts = {}) {
  const source = (books && books.length > 0) ? books : getPopularBooks(5);
  const topBooks = source.slice(0, opts.topK || 5);
  const booksList = topBooks.map(b => `- "${b.title}" by ${b.author}`).join('\n');
  
  return `Based on "${query}", consider:\n\n${booksList}`;
}

export async function initWebLLM() {
  console.log('[BookAIService] Initializing Web LLM...');
  try {
    const result = await initializeWebLLM();
    if (result) {
      useWebLLM = true;
      // Don't set webLLMReady here - isWebLLMReady() will return true automatically
      console.log('[BookAIService] ✅ Web LLM initialized!');
      return true;
    } else {
      console.log('[BookAIService] Web LLM init failed, fallback available');
      return false;
    }
  } catch (error) {
    console.warn('[BookAIService] Web LLM init error:', error.message);
    useWebLLM = false;
    return false;
  }
}

/**
 * MAIN SEARCH - Fast semantic search with local BOOK_LIBRARY
 * Used by PersonalizedRecsComponent (homepage hero search)
 * - NO Web LLM (too slow for main UX)
 * - Pure local mood-based matching
 * - Returns 5 recommendation cards quickly
 */
export async function askLocalSearch({ userQuery, shownBooks = [] } = {}) {
  console.log('[BookAIService] askLocalSearch:', { 
    query: userQuery, 
    librarySize: BOOK_LIBRARY.length
  });
  
  // Fast keyword matching - NO AI
  const response = generateFallbackRecommendation(userQuery, shownBooks);
  
  return { 
    final: response, 
    matches: getPopularBooks(5),
    isAI: false,
  };
}

/**
 * POPUP AI CHAT - Web LLM ONLY with RAG + conversational follow-ups
 * Used by BookAIChat (bottom-right popup)
 * - Web LLM powered ONLY with RAG knowledge base
 * - Semantic retrieval of 100 relevant books
 * - Session-aware personalization
 * - Conversational, deeper reasoning
 * - Supports follow-up questions
 * - Shows "🧠 Powered by Smart AI" badge
 * - If Web LLM not ready, return error message asking for Web LLM
 */
export async function askWebLLM({ userQuery, shownBooks = [] } = {}) {
  // Initialize session if needed
  if (!sessionInitialized) {
    try {
      initializeSession();
      sessionInitialized = true;
    } catch (error) {
      console.warn('[BookAIService] Session init warning:', error.message);
    }
  }

  // Check the REAL readiness state from WebLLMService
  const webLLMReadyStatus = isWebLLMReady();
  
  console.log('[BookAIService] askWebLLM with RAG:', { 
    query: userQuery, 
    webLLMReadyStatus,
    hasRAG: true,
  });
  
  // Web LLM ONLY - no fallback
  if (!webLLMReadyStatus) {
    console.warn('[BookAIService] Web LLM not ready - cannot use popup AI');
    return {
      final: '🧠 **Smart AI Librarian** is warming up...\n\n✨ Setting up AI models in your browser. This happens once per visit.\n\nPlease try again in a few seconds!',
      matches: [],
      isAI: false,
      requiresWebLLM: true,
    };
  }

  try {
    console.log('[BookAIService] Using Web LLM + RAG for intelligent recommendations');
    
    // Call updated generateAIRecommendations with RAG pipeline
    // This now uses RAGRetrievalService internally
    const aiResult = await generateAIRecommendations(userQuery, shownBooks);
    
    // Log RAG stats
    if (aiResult.ragBookCount) {
      console.log(`[BookAIService] RAG retrieved ${aiResult.ragBookCount} books for context`);
    }
    
    // Format AI response with conversational tone
    const booksList = aiResult.recommendations
      .map((b, i) => `${i + 1}. **${b.title}** by ${b.author}\n   _${b.feel || 'A compelling read'}_`)
      .join('\n\n');
    
    // Build response with RAG metadata if available
    let ragNote = '';
    if (aiResult.ragBookCount) {
      ragNote = `\n\n_✨ Smart matching across ${aiResult.ragBookCount} books in our knowledge base_`;
    }
    
    const response = `🧠 **Smart AI Librarian**:\n\n${booksList}${ragNote}\n\n💭 Any of these calling to you? Tell me what you think, or ask me to adjust—I can dive deeper!`;
    
    return {
      final: response,
      matches: aiResult.recommendations,
      isAI: true,
      badge: '🧠 Powered by Smart AI',
      ragEnabled: true,
      ragBookCount: aiResult.ragBookCount,
    };
  } catch (error) {
    console.error('[BookAIService] Web LLM error:', error.message);
    return {
      final: '🧠 **Smart AI** encountered an issue. Try asking again, or phrase it differently!',
      matches: [],
      isAI: false,
      error: error.message,
    };
  }
}

/**
 * LEGACY - Try Web LLM, fallback to keyword matching
 * Kept for backward compatibility but NOT recommended
 * Use askLocalSearch() or askWebLLM() instead
 */
export async function askBookAI({ userQuery, shownBooks = [] } = {}) {
  console.log('[BookAIService] askBookAI (LEGACY):', { 
    query: userQuery, 
    useWebLLM,
    isWebLLMReady: isWebLLMReady(),
    librarySize: BOOK_LIBRARY.length
  });
  
  // Try Web LLM first
  if (useWebLLM && isWebLLMReady()) {
    try {
      const aiResult = await generateAIRecommendations(userQuery, shownBooks);
      
      // Format AI response
      const booksList = aiResult.recommendations
        .map((b, i) => `${i + 1}. **${b.title}** by ${b.author}\n   *${b.feel}*`)
        .join('\n\n');
      
      const response = `🤖 **VibeShelf AI** (using intelligent AI):\n\n${booksList}\n\n✨ Let me know which one calls to you!`;
      
      return {
        final: response,
        matches: aiResult.recommendations,
        isAI: true,
      };
    } catch (error) {
      console.warn('[BookAIService] Web LLM failed, falling back:', error.message);
      // Fall through to fallback
    }
  }
  
  // Fallback: Use keyword matching
  console.log('[BookAIService] Using keyword matching fallback');
  const response = generateFallbackRecommendation(userQuery, shownBooks);
  
  return { 
    final: response, 
    matches: getPopularBooks(5),
    isAI: false,
  };
}

// LOAD MORE - Get next batch of books for same mood
export async function loadMoreRecommendations({ currentMood, shownBooks = [] } = {}) {
  console.log('[BookAIService] loadMoreRecommendations:', { 
    mood: currentMood, 
    alreadyShown: shownBooks.length,
    librarySize: BOOK_LIBRARY.length
  });
  
  if (!BOOK_LIBRARY || BOOK_LIBRARY.length === 0) {
    return {
      final: "📚 Book library failed to load.",
      matches: []
    };
  }
  
  // Detect mood from query
  const queryLower = currentMood.toLowerCase();
  const moodMap = {
    happy: ['happy', 'uplifting', 'joy', 'cheerful', 'funny', 'inspiring'],
    cozy: ['cozy', 'comfort', 'warm', 'peaceful'],
    dark: ['dark', 'gothic', 'creepy', 'suspenseful'],
    sad: ['melancholic', 'sad', 'emotional', 'heartbreak'],
    mystery: ['mystery', 'thriller', 'detective', 'secret'],
    adventure: ['adventure', 'action', 'quest'],
    fantasy: ['fantasy', 'magic', 'wizard'],
    romance: ['romance', 'love', 'passion'],
    thoughtful: ['think', 'philosophical', 'meaningful'],
    emotional: ['emotional', 'vulnerable', 'cathartic']
  };
  
  let detectedMood = 'thoughtful';
  for (const [mood, keywords] of Object.entries(moodMap)) {
    if (keywords.some(k => queryLower.includes(k))) {
      detectedMood = mood;
      break;
    }
  }
  
  // Get books for this mood
  let candidateBooks = getBooksByMood(detectedMood);
  if (!candidateBooks || candidateBooks.length === 0) {
    candidateBooks = getPopularBooks(BOOK_LIBRARY.length);
  }
  
  // Filter out already shown books
  const shownLower = new Set(shownBooks.map(b => b.toLowerCase()));
  const unseen = candidateBooks.filter(b => 
    !shownLower.has(`${b.title.toLowerCase()} by ${b.author.toLowerCase()}`)
  );
  
  // No more books available
  if (unseen.length === 0) {
    return {
      final: "You've explored this vibe beautifully ✨\nNo more books left in this mood category.\nTry a different search!",
      matches: [],
      allExhausted: true
    };
  }
  
  // Return next 5 unseen books
  const nextBooks = unseen.slice(0, 5);
  const booksList = nextBooks
    .map((b, i) => `${i + 1}. **${b.title}** by ${b.author}\n   *${b.feel}*`)
    .join('\n\n');
  
  return {
    final: `Here are 5 more books in this vibe:\n\n${booksList}`,
    matches: nextBooks,
    allExhausted: false
  };
}

export default {
  createBookIndex,
  searchBooks,
  searchBooksByMood,
  buildBookPrompt,
  initWebLLM,
  askBookAI,           // LEGACY - backward compat
  askLocalSearch,      // MAIN SEARCH - fast local mood matching
  askWebLLM,           // POPUP AI - Web LLM only, conversational
  loadMoreRecommendations,
  generateFallbackRecommendation
};
