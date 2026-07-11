/**
 * BooksKnowledgeBase.js - Scalable IndexedDB knowledge store for 10,000+ books
 * Handles persistence, retrieval, and semantic search
 */

const DB_NAME = 'VibeselfBooksDB';
const STORE_NAME = 'books';
const EMBEDDINGS_STORE = 'embeddings';
const VERSION = 1;

let dbInstance = null;

/**
 * Initialize IndexedDB connection
 */
export async function initializeKnowledgeBase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('[BooksKB] IndexedDB initialized');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create books store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const bookStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        bookStore.createIndex('title', 'title', { unique: false });
        bookStore.createIndex('author', 'author', { unique: false });
        bookStore.createIndex('genres', 'genres', { unique: false, multiEntry: true });
        bookStore.createIndex('moods', 'moods', { unique: false, multiEntry: true });
        bookStore.createIndex('popularity', 'popularity', { unique: false });
        bookStore.createIndex('hidden_gem_score', 'hidden_gem_score', { unique: false });
        console.log('[BooksKB] Created books store with indices');
      }

      // Create embeddings store for vector search
      if (!db.objectStoreNames.contains(EMBEDDINGS_STORE)) {
        db.createObjectStore(EMBEDDINGS_STORE, { keyPath: 'bookId' });
        console.log('[BooksKB] Created embeddings store');
      }
    };
  });
}

/**
 * Add book to knowledge base
 */
export async function addBook(book) {
  if (!dbInstance) throw new Error('Knowledge base not initialized');

  const tx = dbInstance.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const fullBook = {
    id: book.id || `book_${Date.now()}_${Math.random()}`,
    title: book.title || '',
    author: book.author || '',
    description: book.description || '',
    genres: Array.isArray(book.genres) ? book.genres : [],
    moods: Array.isArray(book.moods) ? book.moods : [],
    tropes: Array.isArray(book.tropes) ? book.tropes : [],
    themes: Array.isArray(book.themes) ? book.themes : [],
    popularity: book.popularity || book.popularityScore || 0,
    booktok_tags: Array.isArray(book.booktok_tags) ? book.booktok_tags : [],
    hidden_gem_score: book.hidden_gem_score || 0,
    series: book.series || null,
    series_order: book.series_order || null,
    year_published: book.year_published || null,
    feel: book.feel || '',
    addedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const request = store.add(fullBook);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      console.log('[BooksKB] Added book:', fullBook.title);
      resolve(fullBook.id);
    };
  });
}

/**
 * Bulk add books (for initialization)
 */
export async function addBooks(books) {
  if (!dbInstance) throw new Error('Knowledge base not initialized');

  const tx = dbInstance.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  for (const book of books) {
    const fullBook = {
      id: book.id || `book_${Date.now()}_${Math.random()}`,
      title: book.title || '',
      author: book.author || '',
      description: book.description || '',
      genres: Array.isArray(book.genres) ? book.genres : [],
      moods: Array.isArray(book.moods) ? book.moods : [],
      tropes: Array.isArray(book.tropes) ? book.tropes : [],
      themes: Array.isArray(book.themes) ? book.themes : [],
      popularity: book.popularity || book.popularityScore || 0,
      booktok_tags: Array.isArray(book.booktok_tags) ? book.booktok_tags : [],
      hidden_gem_score: book.hidden_gem_score || 0,
      series: book.series || null,
      series_order: book.series_order || null,
      year_published: book.year_published || null,
      feel: book.feel || '',
      addedAt: Date.now(),
    };
    store.add(fullBook);
  }

  return new Promise((resolve, reject) => {
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => {
      console.log('[BooksKB] Bulk added', books.length, 'books');
      resolve(books.length);
    };
  });
}

/**
 * Get total book count
 */
export async function getBookCount() {
  if (!dbInstance) throw new Error('Knowledge base not initialized');

  const tx = dbInstance.transaction([STORE_NAME], 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.count();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Search books by multiple criteria (semantic-like search)
 * Returns top N books ranked by relevance
 */
export async function searchBooks(query, options = {}) {
  if (!dbInstance) throw new Error('Knowledge base not initialized');

  const {
    limit = 100,
    excludeIds = [],
    preferGenres = [],
    preferMoods = [],
    avoidThemes = [],
  } = options;

  const tx = dbInstance.transaction([STORE_NAME], 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const allBooks = request.result;
      const queryLower = query.toLowerCase();

      // Score each book based on query relevance
      const scored = allBooks.map(book => {
        let score = 0;

        // Exclude already shown books
        if (excludeIds.includes(book.id)) return { book, score: -1000 };

        // Title match (highest weight)
        if (book.title.toLowerCase().includes(queryLower)) score += 100;

        // Description match
        if (book.description.toLowerCase().includes(queryLower)) score += 30;

        // Author match
        if (book.author.toLowerCase().includes(queryLower)) score += 40;

        // Genre matches
        const queryTokens = queryLower.split(/\s+/);
        book.genres?.forEach(genre => {
          if (queryTokens.some(t => genre.toLowerCase().includes(t))) score += 20;
        });

        // Mood matches
        book.moods?.forEach(mood => {
          if (queryTokens.some(t => mood.toLowerCase().includes(t))) score += 25;
        });

        // Trope matches
        book.tropes?.forEach(trope => {
          if (queryTokens.some(t => trope.toLowerCase().includes(t))) score += 15;
        });

        // Theme matches
        book.themes?.forEach(theme => {
          if (queryTokens.some(t => theme.toLowerCase().includes(t))) score += 20;
        });

        // BookTok tag matches
        book.booktok_tags?.forEach(tag => {
          if (queryTokens.some(t => tag.toLowerCase().includes(t))) score += 18;
        });

        // Prefer genres if specified
        if (preferGenres.length > 0) {
          const genreBoost = book.genres?.filter(g => 
            preferGenres.some(p => g.toLowerCase().includes(p.toLowerCase()))
          ).length || 0;
          score += genreBoost * 15;
        }

        // Prefer moods if specified
        if (preferMoods.length > 0) {
          const moodBoost = book.moods?.filter(m =>
            preferMoods.some(p => m.toLowerCase().includes(p.toLowerCase()))
          ).length || 0;
          score += moodBoost * 20;
        }

        // Avoid themes if specified
        if (avoidThemes.length > 0) {
          const avoidCount = book.themes?.filter(t =>
            avoidThemes.some(a => t.toLowerCase().includes(a.toLowerCase()))
          ).length || 0;
          score -= avoidCount * 50;
        }

        // Factor in popularity
        score += Math.min(20, book.popularity / 100);

        // Factor in hidden gem score
        score += book.hidden_gem_score || 0;

        return { book, score };
      });

      // Sort by score and return top N
      scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .forEach((_, i) => {
          if (i < 10) {
            console.log(`[BooksKB] Ranked #${i + 1}: "${scored[i].book.title}" (score: ${scored[i].score.toFixed(1)})`);
          }
        });

      const results = scored
        .filter(s => s.score > 0)
        .slice(0, limit)
        .map(s => s.book);

      resolve(results);
    };
  });
}

/**
 * Get random books with optional filters
 */
export async function getRandomBooks(count = 5, filters = {}) {
  if (!dbInstance) throw new Error('Knowledge base not initialized');

  const tx = dbInstance.transaction([STORE_NAME], 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      let books = request.result;

      // Apply filters if provided
      if (filters.genres?.length > 0) {
        books = books.filter(b =>
          b.genres?.some(g =>
            filters.genres.some(f => g.toLowerCase().includes(f.toLowerCase()))
          )
        );
      }

      if (filters.excludeIds?.length > 0) {
        books = books.filter(b => !filters.excludeIds.includes(b.id));
      }

      // Shuffle and return
      const shuffled = books.sort(() => Math.random() - 0.5);
      resolve(shuffled.slice(0, count));
    };
  });
}

/**
 * Get books by genre
 */
export async function getByGenre(genre, limit = 50) {
  if (!dbInstance) throw new Error('Knowledge base not initialized');

  const tx = dbInstance.transaction([STORE_NAME], 'readonly');
  const index = tx.objectStore(STORE_NAME).index('genres');

  return new Promise((resolve, reject) => {
    const range = IDBKeyRange.only(genre);
    const request = index.getAll(range);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result.slice(0, limit));
  });
}

/**
 * Get books by mood
 */
export async function getByMood(mood, limit = 50) {
  if (!dbInstance) throw new Error('Knowledge base not initialized');

  const tx = dbInstance.transaction([STORE_NAME], 'readonly');
  const index = tx.objectStore(STORE_NAME).index('moods');

  return new Promise((resolve, reject) => {
    const range = IDBKeyRange.only(mood);
    const request = index.getAll(range);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result.slice(0, limit));
  });
}

/**
 * Get popular books
 */
export async function getPopularBooks(limit = 50) {
  if (!dbInstance) throw new Error('Knowledge base not initialized');

  const tx = dbInstance.transaction([STORE_NAME], 'readonly');
  const index = tx.objectStore(STORE_NAME).index('popularity');

  return new Promise((resolve, reject) => {
    const request = index.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const books = request.result.reverse(); // Highest popularity first
      resolve(books.slice(0, limit));
    };
  });
}

/**
 * Get hidden gems (high quality, low popularity)
 */
export async function getHiddenGems(limit = 50) {
  if (!dbInstance) throw new Error('Knowledge base not initialized');

  const tx = dbInstance.transaction([STORE_NAME], 'readonly');
  const index = tx.objectStore(STORE_NAME).index('hidden_gem_score');

  return new Promise((resolve, reject) => {
    const request = index.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const books = request.result.reverse(); // Highest gem score first
      resolve(books.slice(0, limit));
    };
  });
}

/**
 * Get books by series
 */
export async function getBySeries(seriesName) {
  if (!dbInstance) throw new Error('Knowledge base not initialized');

  const tx = dbInstance.transaction([STORE_NAME], 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const books = request.result.filter(b => b.series === seriesName);
      resolve(books.sort((a, b) => (a.series_order || 0) - (b.series_order || 0)));
    };
  });
}

/**
 * Get books by author
 */
export async function getByAuthor(author, limit = 50) {
  if (!dbInstance) throw new Error('Knowledge base not initialized');

  const tx = dbInstance.transaction([STORE_NAME], 'readonly');
  const index = tx.objectStore(STORE_NAME).index('author');

  return new Promise((resolve, reject) => {
    const range = IDBKeyRange.only(author);
    const request = index.getAll(range);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result.slice(0, limit));
  });
}

/**
 * Get BookTok trending books
 */
export async function getBookTokTrending(limit = 50) {
  if (!dbInstance) throw new Error('Knowledge base not initialized');

  const tx = dbInstance.transaction([STORE_NAME], 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const books = request.result.filter(b => b.booktok_tags?.length > 0);
      resolve(books.slice(0, limit));
    };
  });
}

/**
 * Clear all books (for testing/reset)
 */
export async function clearAllBooks() {
  if (!dbInstance) throw new Error('Knowledge base not initialized');

  const tx = dbInstance.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      console.log('[BooksKB] All books cleared');
      resolve();
    };
  });
}

export default {
  initializeKnowledgeBase,
  addBook,
  addBooks,
  getBookCount,
  searchBooks,
  getRandomBooks,
  getByGenre,
  getByMood,
  getPopularBooks,
  getHiddenGems,
  getBySeries,
  getByAuthor,
  getBookTokTrending,
  clearAllBooks,
};
