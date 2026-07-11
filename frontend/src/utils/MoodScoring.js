/**
 * MoodScoring.js
 * 
 * Intelligent mood and emotion-based book ranking system.
 * Provides semantic understanding of moods, synonym expansion, and weighted relevance scoring.
 */

// Comprehensive mood synonym map
// Maps user-friendly moods to expanded search terms and related emotional concepts
export const MOOD_SYNONYMS = {
  happy: {
    expansion: ['uplifting', 'cheerful', 'wholesome', 'cozy', 'humorous', 'warm', 'heartwarming', 'comforting', 'joyful', 'hopeful', 'feel-good', 'light', 'fun', 'laugh', 'smile'],
    weight: 1.0,
    negation: ['sad', 'dark', 'tragic', 'grief', 'depressing'],
  },
  sad: {
    expansion: ['emotional', 'tragic', 'healing', 'grief', 'bittersweet', 'melancholic', 'poignant', 'touching', 'moving', 'heartbreaking', 'cathartic', 'grief-journey'],
    weight: 1.0,
    negation: ['happy', 'lighthearted', 'funny', 'cheerful'],
  },
  romantic: {
    expansion: ['love', 'chemistry', 'relationships', 'soulmate', 'slow-burn', 'passion', 'intimacy', 'romance', 'couple', 'devotion', 'sweetheart', 'falling-in-love', 'tension'],
    weight: 1.0,
    negation: ['platonic', 'friendship', 'asexual'],
  },
  scary: {
    expansion: ['thriller', 'suspense', 'horror', 'dark', 'mysterious', 'paranormal', 'ghost', 'haunting', 'creepy', 'spine-tingling', 'jump-scare', 'psychological'],
    weight: 1.0,
    negation: ['cozy', 'lighthearted', 'comforting'],
  },
  mysterious: {
    expansion: ['thriller', 'suspense', 'intrigue', 'secret', 'hidden', 'clue', 'detective', 'puzzle', 'enigma', 'cryptic', 'ambiguous', 'shadowy'],
    weight: 0.95,
    negation: ['straightforward', 'simple', 'predictable'],
  },
  cozy: {
    expansion: ['comfort', 'wholesome', 'warm', 'safe', 'homey', 'peaceful', 'gentle', 'feel-good', 'relaxing', 'small-town', 'countryside', 'fireplace'],
    weight: 1.0,
    negation: ['dark', 'intense', 'violent', 'gritty'],
  },
  epic: {
    expansion: ['grand', 'adventure', 'journey', 'quest', 'saga', 'sweeping', 'large-scale', 'historical', 'world-building', 'complex', 'immersive', 'detailed'],
    weight: 0.95,
    negation: ['short', 'simple', 'minimalist'],
  },
  dark: {
    expansion: ['psychological', 'gritty', 'noir', 'gothic', 'cynical', 'sinister', 'morally-grey', 'violent', 'twisted', 'bleak', 'noir-thriller', 'brooding'],
    weight: 0.9,
    negation: ['lighthearted', 'happy', 'wholesome'],
  },
  healing: {
    expansion: ['therapeutic', 'recovery', 'growth', 'self-discovery', 'empowerment', 'cathartic', 'hopeful', 'transformative', 'journey', 'positive', 'uplifting', 'inspiring'],
    weight: 1.0,
    negation: ['traumatic', 'depressing', 'destructive'],
  },
  funny: {
    expansion: ['humorous', 'hilarious', 'comic', 'witty', 'laugh', 'silly', 'absurd', 'satire', 'parody', 'lighthearted', 'entertaining', 'tongue-in-cheek'],
    weight: 1.0,
    negation: ['serious', 'dark', 'tragic'],
  },
  inspiring: {
    expansion: ['motivational', 'uplifting', 'empowering', 'hopeful', 'transformative', 'educational', 'growth', 'achievement', 'success', 'positivity', 'aspiration'],
    weight: 1.0,
    negation: ['cynical', 'depressing', 'discouraging'],
  },
  adventure: {
    expansion: ['thrilling', 'action-packed', 'journey', 'quest', 'exploration', 'danger', 'excitement', 'discovery', 'high-stakes', 'adrenaline', 'survival', 'epic'],
    weight: 0.95,
    negation: ['slow-paced', 'introspective', 'domestic'],
  },
  dystopian: {
    expansion: ['future', 'bleak', 'oppressive', 'rebellion', 'survival', 'dark', 'government-control', 'post-apocalyptic', 'societal', 'warning', 'grim'],
    weight: 0.9,
    negation: ['utopian', 'lighthearted'],
  },
  magical: {
    expansion: ['fantasy', 'magic', 'enchanted', 'supernatural', 'mystical', 'wonder', 'enchantment', 'spells', 'creatures', 'otherworldly', 'whimsical'],
    weight: 0.95,
    negation: ['realistic', 'contemporary', 'grounded'],
  },
  thoughtful: {
    expansion: ['philosophical', 'introspective', 'reflective', 'literary', 'profound', 'complex', 'nuanced', 'cerebral', 'meditative', 'meaningful', 'contemplative'],
    weight: 0.9,
    negation: ['fast-paced', 'action-heavy', 'light'],
  },
};

/**
 * Expand user query with mood synonyms
 * Input: "happy" → Output: ["happy", "uplifting", "cheerful", "wholesome", ...]
 */
export function expandMoodQuery(userQuery) {
  const normalizedQuery = userQuery.toLowerCase().trim();
  const tokens = normalizedQuery.split(/\s+/);
  
  const expandedTerms = new Set();
  const expandedWeights = {}; // Track weight for each term
  
  tokens.forEach((token) => {
    // Add original token
    expandedTerms.add(token);
    expandedWeights[token] = expandedWeights[token] || 1.0;
    
    // Check if token matches a mood
    if (MOOD_SYNONYMS[token]) {
      const moodData = MOOD_SYNONYMS[token];
      
      // Add all synonyms with reduced weight (0.8 of original)
      moodData.expansion.forEach((syn) => {
        expandedTerms.add(syn);
        expandedWeights[syn] = expandedWeights[syn] || moodData.weight * 0.8;
      });
    }
  });
  
  return {
    original: userQuery,
    expanded: Array.from(expandedTerms),
    weights: expandedWeights,
    negationTerms: tokens
      .flatMap((t) => MOOD_SYNONYMS[t]?.negation || [])
      .filter((term, idx, arr) => arr.indexOf(term) === idx), // deduplicate
  };
}

/**
 * Positive sentiment words that boost relevance
 */
const POSITIVE_SENTIMENT_WORDS = [
  'inspiring', 'beautiful', 'heartwarming', 'uplifting', 'wonderful', 'amazing',
  'love', 'beloved', 'cherished', 'captivating', 'brilliant', 'masterpiece',
  'moving', 'touching', 'profound', 'enlightening', 'transformative', 'empowering',
  'joyful', 'hopeful', 'healing', 'comforting', 'warm', 'wholesome',
];

/**
 * Score a single book's relevance to the expanded mood query
 * Considers: title, genre, mood tags, description, sentiment, rating
 */
export function scoreBookRelevance(book, expandedQuery) {
  let score = 0;
  const { expanded, weights, negationTerms } = expandedQuery;
  
  // Prepare searchable text
  const title = (book.title || '').toLowerCase();
  const author = (book.author || '').toLowerCase();
  const description = (book.description || '').toLowerCase();
  const genre = Array.isArray(book.genre)
    ? book.genre.map((g) => (g || '').toLowerCase()).join(' ')
    : (book.genre || '').toLowerCase();
  const mood = Array.isArray(book.mood)
    ? book.mood.map((m) => (m || '').toLowerCase()).join(' ')
    : (book.mood || '').toLowerCase();
  
  // Combine all text for holistic search
  const allText = `${title} ${author} ${genre} ${mood} ${description}`;
  
  // Penalty for negation terms (e.g., if user wants happy, penalize sad books)
  let negationPenalty = 0;
  negationTerms.forEach((negTerm) => {
    if (allText.includes(negTerm)) {
      negationPenalty += 0.3; // Each negation term reduces score
    }
  });
  
  // Score each expanded term
  expanded.forEach((term) => {
    const termWeight = weights[term] || 1.0;
    
    // Title match (highest priority)
    if (title.includes(term)) {
      score += 15 * termWeight; // Strong boost for title matches
    }
    
    // Genre match
    if (genre.includes(term)) {
      score += 12 * termWeight;
    }
    
    // Mood/vibe tag match (very important for mood queries)
    if (mood.includes(term)) {
      score += 14 * termWeight; // Prioritize mood matches
    }
    
    // Author match
    if (author.includes(term)) {
      score += 8 * termWeight;
    }
    
    // Description match (broader context)
    if (description.includes(term)) {
      score += 4 * termWeight; // Lighter weight, but still counts
    }
  });
  
  // Sentiment boost: check if description contains positive words
  const sentimentScore = POSITIVE_SENTIMENT_WORDS.filter((word) =>
    description.includes(word)
  ).length;
  score += sentimentScore * 3; // +3 per positive sentiment word
  
  // Rating boost (normalized 0-5 to 0-5 points)
  const rating = Number(book.rating) || 0;
  if (rating >= 4.5) score += 5;
  else if (rating >= 4.0) score += 3;
  else if (rating >= 3.5) score += 1;
  
  // Apply negation penalty (reduce final score)
  score = Math.max(0, score - negationPenalty * score);
  
  return score;
}

/**
 * Rank books by mood relevance
 * Returns top N books sorted by relevance score descending
 */
export function rankBooksByMood(userQuery, books, { topK = 10, minScore = 0 } = {}) {
  console.log('[MoodScoring] rankBooksByMood:', { query: userQuery, booksCount: books.length, topK });
  
  const expandedQuery = expandMoodQuery(userQuery);
  console.log('[MoodScoring] Expanded query:', {
    original: expandedQuery.original,
    expandedTerms: expandedQuery.expanded.length,
    negationTerms: expandedQuery.negationTerms,
  });
  
  // Score all books
  const scored = books.map((book) => ({
    book,
    score: scoreBookRelevance(book, expandedQuery),
  }));
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  // Filter by minimum score and limit to topK
  const topBooks = scored
    .filter((item) => item.score >= minScore)
    .slice(0, topK);
  
  console.log('[MoodScoring] Ranked results:', {
    found: topBooks.length,
    topScores: topBooks.slice(0, 3).map((item) => ({
      title: item.book.title,
      score: item.score.toFixed(2),
    })),
  });
  
  return topBooks.map((item) => ({ ...item.book, relevanceScore: item.score }));
}

/**
 * Format relevance explanation for AI to use in response
 * Helps the LLM understand WHY a book matches
 */
export function getRelevanceExplanation(book, userQuery) {
  const expandedQuery = expandMoodQuery(userQuery);
  const score = scoreBookRelevance(book, expandedQuery);
  
  const explanations = [];
  
  // Title relevance
  if ((book.title || '').toLowerCase().includes(userQuery.toLowerCase())) {
    explanations.push(`title directly mentions "${userQuery}"`);
  }
  
  // Mood relevance
  if (book.mood) {
    const moods = Array.isArray(book.mood) ? book.mood : [book.mood];
    const matchedMoods = moods.filter((m) =>
      expandedQuery.expanded.some((term) => (m || '').toLowerCase().includes(term))
    );
    if (matchedMoods.length > 0) {
      explanations.push(`mood tags: ${matchedMoods.join(', ')}`);
    }
  }
  
  // Genre relevance
  if (book.genre) {
    const genres = Array.isArray(book.genre) ? book.genre : [book.genre];
    const matchedGenres = genres.filter((g) =>
      expandedQuery.expanded.some((term) => (g || '').toLowerCase().includes(term))
    );
    if (matchedGenres.length > 0) {
      explanations.push(`genre: ${matchedGenres.join(', ')}`);
    }
  }
  
  // Rating
  if (book.rating && book.rating >= 4.0) {
    explanations.push(`highly rated (${book.rating}/5)`);
  }
  
  return explanations.length > 0
    ? explanations.join('; ')
    : 'matches your search criteria';
}

export default {
  MOOD_SYNONYMS,
  expandMoodQuery,
  scoreBookRelevance,
  rankBooksByMood,
  getRelevanceExplanation,
};
