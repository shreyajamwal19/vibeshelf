/**
 * BooksDataLoader.js - Loads and enriches book data into IndexedDB
 * Expands the 67-book BOOK_LIBRARY with additional metadata and RAG enhancement
 */

import { BOOK_LIBRARY } from '../data/BookLibrary.js';
import BooksKnowledgeBase from './BooksKnowledgeBase.js';

/**
 * Enrich a single book with additional metadata
 */
function enrichBook(book) {
  // Expand moods with common patterns
  const moodExpansions = {
    cozy: ['comfort', 'warm', 'homey', 'intimate'],
    dark: ['gothic', 'grim', 'sinister', 'noir'],
    emotional: ['vulnerable', 'cathartic', 'moving', 'poignant'],
    adventurous: ['thrilling', 'epic', 'action-packed', 'quest-driven'],
    romantic: ['passionate', 'emotional', 'tender', 'swoony'],
    mysterious: ['suspenseful', 'intricate', 'puzzling', 'enigmatic'],
  };

  const enrichedMoods = [...(book.moods || [])];
  book.moods?.forEach(mood => {
    const expanded = moodExpansions[mood?.toLowerCase()];
    if (expanded) {
      enrichedMoods.push(...expanded);
    }
  });

  // Add common BookTok tags if not present
  const booktokPatterns = {
    romance: ['RomCom', 'BookTok Trending', 'Spicy', 'Swoon'],
    dark: ['Dark Academia', 'Morally Grey', 'Psychological'],
    fantasy: ['Dark Fantasy', 'Epic Fantasy', 'Hidden Gem'],
    mystery: ['Psychological Thriller', 'Cozy Mystery', 'Noir'],
  };

  const booktokTags = [...(book.booktok_tags || [])];
  book.genres?.forEach(genre => {
    const patterns = booktokPatterns[genre?.toLowerCase()];
    if (patterns) {
      patterns.forEach(tag => {
        if (!booktokTags.includes(tag)) {
          booktokTags.push(tag);
        }
      });
    }
  });

  // Add hidden gem score (inverse popularity for less known books)
  const popularity = book.popularityScore || 50;
  const hiddenGemScore = Math.max(0, 100 - popularity);

  return {
    ...book,
    moods: enrichedMoods,
    booktok_tags: booktokTags,
    hidden_gem_score: hiddenGemScore,
    // Ensure other fields exist
    tropes: book.tropes || [],
    themes: book.themes || [],
    series: book.series || null,
    series_order: book.series_order || null,
    year_published: book.year_published || new Date().getFullYear(),
  };
}

/**
 * Generate synthetic books to expand knowledge base
 * (In production, would fetch from API)
 */
function generateSyntheticBooks(baseBooks, targetCount = 10000) {
  const synthetic = [];
  const genrePool = [
    'Fantasy', 'Science Fiction', 'Mystery', 'Romance', 'Thriller',
    'Historical Fiction', 'Literary Fiction', 'Horror', 'Adventure', 'Humor',
    'Young Adult', 'Paranormal', 'Contemporary', 'Dystopian', 'Urban Fantasy',
    'Dark Academia', 'Cozy Mystery', 'Romantic Comedy', 'Epic Fantasy', 'Cyberpunk',
  ];

  const moodPool = [
    'cozy', 'dark', 'emotional', 'adventurous', 'romantic', 'mysterious',
    'thoughtful', 'uplifting', 'suspenseful', 'magical', 'quirky', 'intense',
  ];

  const tropePool = [
    'Found Family', 'Enemies to Lovers', 'Slow Burn', 'Second Chance Romance',
    'Morally Grey Characters', 'Heist', 'Time Travel', 'Paranormal Mystery',
    'Coming of Age', 'Forced Proximity', 'Hidden Identity', 'Redemption Arc',
  ];

  const themePool = [
    'Friendship', 'Betrayal', 'Redemption', 'Power', 'Identity', 'Love',
    'Revenge', 'Survival', 'Justice', 'Family', 'Sacrifice', 'Growth',
    'Acceptance', 'Freedom', 'Trust', 'Loss', 'Hope', 'Change',
  ];

  const booktokPool = [
    'BookTok Trending', 'Dark Academia', 'Spicy', 'Morally Grey', 'RomCom',
    'Hidden Gem', 'Psychological', 'Enemies to Lovers', 'Sapphic', 'LGBTQ+',
  ];

  // Common author names to vary slightly
  const authorFirstNames = [
    'Sarah', 'Emma', 'Rebecca', 'Jessica', 'Jennifer', 'Michael', 'James',
    'Brandon', 'Mark', 'David', 'Lisa', 'Nicole', 'Victoria', 'Amanda',
  ];

  const authorLastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
    'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
    'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  ];

  // Generate synthetic books
  for (let i = synthetic.length; i < targetCount - baseBooks.length; i++) {
    const author = `${authorFirstNames[i % authorFirstNames.length]} ${authorLastNames[i % authorLastNames.length]}`;
    const genres = [];
    for (let g = 0; g < Math.floor(Math.random() * 3) + 1; g++) {
      genres.push(genrePool[Math.floor(Math.random() * genrePool.length)]);
    }

    const moods = [];
    for (let m = 0; m < Math.floor(Math.random() * 2) + 1; m++) {
      moods.push(moodPool[Math.floor(Math.random() * moodPool.length)]);
    }

    const tropes = [];
    for (let t = 0; t < Math.floor(Math.random() * 2) + 1; t++) {
      tropes.push(tropePool[Math.floor(Math.random() * tropePool.length)]);
    }

    const themes = [];
    for (let th = 0; th < Math.floor(Math.random() * 2) + 1; th++) {
      themes.push(themePool[Math.floor(Math.random() * themePool.length)]);
    }

    const booktokTags = [];
    if (Math.random() > 0.7) {
      booktokTags.push(booktokPool[Math.floor(Math.random() * booktokPool.length)]);
    }

    const year = 2020 + Math.floor(Math.random() * 5);
    const popularity = Math.floor(Math.random() * 100);

    synthetic.push({
      id: `synth_${i}`,
      title: `Synthetic Novel ${i}`,
      author,
      description: `A compelling ${genres[0]?.toLowerCase()} novel about ${themes[0]?.toLowerCase()}.`,
      genres: [...new Set(genres)],
      moods: [...new Set(moods)],
      tropes: [...new Set(tropes)],
      themes: [...new Set(themes)],
      booktok_tags: booktokTags,
      popularity,
      hidden_gem_score: Math.max(0, 100 - popularity),
      year_published: year,
      feel: `A ${moods[0]?.toLowerCase() || 'engaging'} read`,
    });
  }

  return synthetic;
}

/**
 * Initialize knowledge base with books
 */
export async function initializeKnowledgeBase() {
  try {
    console.log('[DataLoader] Initializing knowledge base...');

    // Initialize IndexedDB
    await BooksKnowledgeBase.initializeKnowledgeBase();

    // Check if already populated
    const count = await BooksKnowledgeBase.getBookCount();
    if (count > 0) {
      console.log(`[DataLoader] Knowledge base already has ${count} books`);
      return count;
    }

    // Enrich BOOK_LIBRARY
    console.log('[DataLoader] Enriching BOOK_LIBRARY...');
    const enrichedBooks = BOOK_LIBRARY.map(enrichBook);

    // Generate synthetic books to reach 10,000
    console.log('[DataLoader] Generating synthetic books...');
    const targetCount = 10000;
    const syntheticBooks = generateSyntheticBooks(enrichedBooks, targetCount);

    // Combine all books
    const allBooks = [...enrichedBooks, ...syntheticBooks];
    console.log(`[DataLoader] Loading ${allBooks.length} total books into IndexedDB...`);

    // Add to knowledge base in batches (to avoid memory issues)
    const batchSize = 500;
    for (let i = 0; i < allBooks.length; i += batchSize) {
      const batch = allBooks.slice(i, i + batchSize);
      await BooksKnowledgeBase.addBooks(batch);
      console.log(`[DataLoader] Loaded ${Math.min(i + batchSize, allBooks.length)}/${allBooks.length} books`);
    }

    const finalCount = await BooksKnowledgeBase.getBookCount();
    console.log(`[DataLoader] ✅ Knowledge base ready with ${finalCount} books`);

    return finalCount;
  } catch (error) {
    console.error('[DataLoader] Error initializing knowledge base:', error);
    throw error;
  }
}

/**
 * Get loading status
 */
export async function getLoadingStatus() {
  try {
    const count = await BooksKnowledgeBase.getBookCount();
    return {
      loaded: count > 0,
      bookCount: count,
      percentComplete: Math.min(100, (count / 10000) * 100),
    };
  } catch (error) {
    return {
      loaded: false,
      bookCount: 0,
      percentComplete: 0,
      error: error.message,
    };
  }
}

export default {
  initializeKnowledgeBase,
  getLoadingStatus,
  enrichBook,
};
