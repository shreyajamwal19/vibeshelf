/**
 * SemanticMoodIntelligence.js
 * 
 * Advanced semantic mood expansion and intelligent book ranking system.
 * Transforms "happy books" into emotionally intelligent recommendations
 * that search across all book fields and understand hidden emotional meaning.
 */

/**
 * SEMANTIC MOOD EXPANSION
 * Maps user moods to deep emotional meaning and expansion terms
 */
export const SEMANTIC_MOOD_MAP = {
  happy: {
    primary: 'uplifting and joyful',
    expansion: [
      'uplifting', 'cheerful', 'wholesome', 'cozy', 'humorous', 'warm',
      'heartwarming', 'comforting', 'joyful', 'hopeful', 'feel-good',
      'light', 'fun', 'laugh', 'smile', 'serotonin', 'positive',
      'optimistic', 'delightful', 'pleasing', 'satisfying', 'upbeat'
    ],
    sentimentWords: [
      'heartwarming', 'beautiful', 'delightful', 'wonderful', 'lovely',
      'charming', 'engaging', 'uplifting', 'inspiring', 'light-hearted'
    ],
    genreBoosts: ['Contemporary', 'Comedy', 'Romance', 'Young Adult', 'Children'],
    excludeKeywords: ['sad', 'dark', 'tragic', 'grief', 'depressing', 'heavy', 'violence'],
    ratingThreshold: 3.5, // Prefer highly-rated
  },
  cozy: {
    primary: 'warm, comfortable, and comforting',
    expansion: [
      'comfort', 'wholesome', 'warm', 'safe', 'homey', 'peaceful',
      'gentle', 'feel-good', 'relaxing', 'small-town', 'countryside',
      'fireplace', 'tea', 'quiet', 'intimate', 'familiar', 'charming'
    ],
    sentimentWords: ['cozy', 'comforting', 'charming', 'peaceful', 'homey'],
    genreBoosts: ['Contemporary', 'Fantasy', 'Romance', 'Mystery'],
    excludeKeywords: ['dark', 'intense', 'violent', 'gritty', 'cyberpunk', 'dystopian'],
    ratingThreshold: 3.8,
  },
  sad: {
    primary: 'emotionally deep and cathartic',
    expansion: [
      'emotional', 'tragic', 'healing', 'grief', 'bittersweet', 'melancholic',
      'poignant', 'touching', 'moving', 'heartbreaking', 'cathartic',
      'profound', 'meaningful', 'raw', 'vulnerable', 'honest'
    ],
    sentimentWords: ['moving', 'profound', 'meaningful', 'touching', 'beautiful'],
    genreBoosts: ['Literary Fiction', 'Contemporary', 'Historical'],
    excludeKeywords: ['light', 'funny', 'cheerful', 'humorous', 'fluffy'],
    ratingThreshold: 3.8, // Sad books need to be well-written
  },
  dark: {
    primary: 'psychologically intense and noir',
    expansion: [
      'psychological', 'gritty', 'noir', 'gothic', 'cynical', 'sinister',
      'morally-grey', 'twisted', 'bleak', 'brooding', 'edgy', 'intense',
      'complex', 'dark academia', 'morally ambiguous'
    ],
    sentimentWords: ['dark', 'intense', 'complex', 'twisted', 'brooding'],
    genreBoosts: ['Thriller', 'Mystery', 'Horror', 'Literary Fiction'],
    excludeKeywords: ['lighthearted', 'happy', 'wholesome', 'fuzzy'],
    ratingThreshold: 3.7,
  },
  romantic: {
    primary: 'emotionally intimate and passionate',
    expansion: [
      'love', 'chemistry', 'relationships', 'soulmate', 'slow-burn',
      'passion', 'intimacy', 'romance', 'couple', 'devotion', 'falling-in-love',
      'tension', 'romance-focused', 'love-centered', 'emotional connection'
    ],
    sentimentWords: ['romantic', 'passionate', 'intimate', 'engaging', 'beautiful'],
    genreBoosts: ['Romance', 'Contemporary', 'Fantasy', 'Young Adult'],
    excludeKeywords: ['platonic', 'asexual', 'friendship-focused'],
    ratingThreshold: 3.6,
  },
  adventure: {
    primary: 'thrilling and immersive',
    expansion: [
      'thrilling', 'action-packed', 'journey', 'quest', 'exploration',
      'danger', 'excitement', 'discovery', 'high-stakes', 'adrenaline',
      'survival', 'epic', 'adventurous', 'suspenseful', 'dynamic'
    ],
    sentimentWords: ['thrilling', 'exciting', 'engaging', 'immersive', 'gripping'],
    genreBoosts: ['Adventure', 'Fantasy', 'Science Fiction', 'Historical Fiction'],
    excludeKeywords: ['slow-paced', 'introspective', 'domestic'],
    ratingThreshold: 3.7,
  },
  scary: {
    primary: 'intensely frightening and suspenseful',
    expansion: [
      'thriller', 'suspense', 'horror', 'mysterious', 'paranormal',
      'ghost', 'haunting', 'creepy', 'spine-tingling', 'psychological-thriller',
      'terrifying', 'chilling', 'ominous', 'unsettling'
    ],
    sentimentWords: ['thrilling', 'suspenseful', 'gripping', 'intense', 'chilling'],
    genreBoosts: ['Horror', 'Thriller', 'Mystery', 'Paranormal'],
    excludeKeywords: ['cozy', 'lighthearted', 'comforting'],
    ratingThreshold: 3.6,
  },
  inspiring: {
    primary: 'motivational and empowering',
    expansion: [
      'motivational', 'uplifting', 'empowering', 'hopeful', 'transformative',
      'educational', 'growth', 'achievement', 'success', 'positivity',
      'aspiration', 'enlightening', 'encouraging', 'insightful'
    ],
    sentimentWords: ['inspiring', 'uplifting', 'empowering', 'meaningful', 'profound'],
    genreBoosts: ['Literary Fiction', 'Biography', 'Contemporary', 'Self-Help'],
    excludeKeywords: ['cynical', 'depressing', 'discouraging'],
    ratingThreshold: 3.8,
  },
  funny: {
    primary: 'humorous and entertaining',
    expansion: [
      'humorous', 'hilarious', 'comic', 'witty', 'laugh', 'silly',
      'absurd', 'satire', 'parody', 'lighthearted', 'entertaining',
      'tongue-in-cheek', 'clever', 'amusing', 'comical'
    ],
    sentimentWords: ['funny', 'hilarious', 'witty', 'charming', 'delightful'],
    genreBoosts: ['Comedy', 'Contemporary', 'Young Adult', 'Fantasy'],
    excludeKeywords: ['serious', 'dark', 'tragic', 'heavy'],
    ratingThreshold: 3.6,
  },
  magical: {
    primary: 'wondrous and enchanting',
    expansion: [
      'fantasy', 'magic', 'enchanted', 'supernatural', 'mystical',
      'wonder', 'enchantment', 'spells', 'creatures', 'otherworldly',
      'whimsical', 'magical', 'fantastical', 'dreamy'
    ],
    sentimentWords: ['enchanting', 'magical', 'wondrous', 'beautiful', 'immersive'],
    genreBoosts: ['Fantasy', 'Young Adult', 'Contemporary Fantasy'],
    excludeKeywords: ['realistic', 'contemporary', 'grounded'],
    ratingThreshold: 3.7,
  },
  thoughtful: {
    primary: 'intellectually stimulating and profound',
    expansion: [
      'philosophical', 'introspective', 'reflective', 'literary',
      'profound', 'complex', 'nuanced', 'cerebral', 'meditative',
      'meaningful', 'contemplative', 'insightful', 'thought-provoking'
    ],
    sentimentWords: ['profound', 'meaningful', 'insightful', 'intelligent', 'complex'],
    genreBoosts: ['Literary Fiction', 'Science Fiction', 'Philosophy'],
    excludeKeywords: ['fast-paced', 'action-heavy', 'light'],
    ratingThreshold: 3.8,
  },
};

/**
 * Expand mood query with semantic understanding
 * "happy" → rich semantic expansion with weights
 */
export function expandMoodIntent(userQuery) {
  const normalized = userQuery.toLowerCase().trim();
  
  // Check if user mentioned a mood we understand
  const matchedMood = Object.keys(SEMANTIC_MOOD_MAP).find(mood =>
    normalized.includes(mood) || normalized.startsWith(mood)
  );
  
  if (!matchedMood) {
    // Fallback: use as-is if no recognized mood
    return {
      mood: normalized,
      primary: normalized,
      expansion: [normalized],
      sentimentWords: [],
      genreBoosts: [],
      excludeKeywords: [],
      ratingThreshold: 3.5,
      confidence: 0.3,
    };
  }
  
  const moodConfig = SEMANTIC_MOOD_MAP[matchedMood];
  
  return {
    mood: matchedMood,
    primary: moodConfig.primary,
    expansion: moodConfig.expansion,
    sentimentWords: moodConfig.sentimentWords,
    genreBoosts: moodConfig.genreBoosts,
    excludeKeywords: moodConfig.excludeKeywords,
    ratingThreshold: moodConfig.ratingThreshold,
    confidence: 1.0, // We recognized the mood
  };
}

/**
 * SEMANTIC BOOK SCORING
 * Score books across multiple dimensions with emotional intelligence
 */
export function scoreBookSemantics(book, expandedMoodIntent) {
  const {
    expansion,
    sentimentWords,
    genreBoosts,
    excludeKeywords,
    ratingThreshold,
  } = expandedMoodIntent;
  
  let score = 0;
  
  // Normalize book data
  const title = (book.title || '').toLowerCase();
  const author = (book.author || '').toLowerCase();
  const description = (book.description || '').toLowerCase();
  const genre = book.genre ? (Array.isArray(book.genre) ? book.genre.join(' ') : book.genre).toLowerCase() : '';
  const moodTags = book.moodTags ? (Array.isArray(book.moodTags) ? book.moodTags : [book.moodTags]) : [];
  const moodTagsText = moodTags.map(m => (m || '').toLowerCase()).join(' ');
  const summary = (book.synopsis || book.summary || '').toLowerCase();
  
  // ============ MOOD SEMANTIC SCORE (Weight: 5x) ============
  let moodScore = 0;
  expansion.forEach(term => {
    const weight = 1;
    if (title.includes(term)) moodScore += 3 * weight;
    if (moodTagsText.includes(term)) moodScore += 4 * weight;
    if (description.includes(term)) moodScore += 2 * weight;
    if (summary.includes(term)) moodScore += 1 * weight;
  });
  score += moodScore * 5;
  
  // ============ DESCRIPTION SIMILARITY (Weight: 4x) ============
  let descriptionScore = 0;
  const allTextFields = `${title} ${description} ${summary}`;
  expansion.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = (allTextFields.match(regex) || []).length;
    descriptionScore += Math.min(matches * 0.5, 2); // Cap at 2 per term
  });
  score += descriptionScore * 4;
  
  // ============ GENRE MATCH (Weight: 3x) ============
  let genreScore = 0;
  genreBoosts.forEach(g => {
    if (genre.includes(g.toLowerCase())) genreScore += 2;
  });
  score += genreScore * 3;
  
  // ============ POSITIVE SENTIMENT (Weight: 3x) ============
  let sentimentScore = 0;
  sentimentWords.forEach(word => {
    if (description.includes(word)) sentimentScore += 2;
    if (summary.includes(word)) sentimentScore += 1.5;
  });
  score += sentimentScore * 3;
  
  // ============ RATING BOOST (Weight: 2x) ============
  let ratingScore = 0;
  const rating = book.rating ? Number(book.rating) : null;
  if (rating && rating >= 4.2) {
    ratingScore = 3; // Excellent books get boost
  } else if (rating && rating >= ratingThreshold) {
    ratingScore = 2; // Good books in target mood range
  } else if (rating && rating >= 3.0) {
    ratingScore = 0.5; // Okay books get slight boost
  }
  score += ratingScore * 2;
  
  // ============ POPULARITY BOOST (Weight: 1x) ============
  // Prefer books that seem well-known/popular
  let popularityScore = 0;
  if (book.popularity) {
    popularityScore = Math.min(Number(book.popularity) / 10, 2); // Cap at 2
  } else if (book.rating && Number(book.rating) >= 4.0) {
    popularityScore = 1; // High ratings suggest popularity
  }
  score += popularityScore * 1;
  
  // ============ NEGATIVE PENALTY ============
  // Remove books that contradict the mood
  excludeKeywords.forEach(keyword => {
    if (title.includes(keyword)) score -= 10;
    if (description.includes(keyword)) score -= 5;
    if (genre.includes(keyword)) score -= 3;
  });
  
  return Math.max(0, score); // Never go below 0
}

/**
 * SEMANTIC RERANKING
 * After scoring, apply emotional intelligence to rerank top results
 */
function rerankcandidates(candidates, expandedMoodIntent) {
  // For happy/cozy/inspiring: prefer uplifting books, remove dark ones
  const mood = expandedMoodIntent.mood;
  
  const shouldPreferUplifting = ['happy', 'cozy', 'funny', 'inspiring'].includes(mood);
  const shouldPreferDark = ['dark', 'scary'].includes(mood);
  
  return candidates.map(book => {
    let adjustment = 0;
    const description = (book.description || '').toLowerCase();
    const summary = (book.synopsis || '').toLowerCase();
    const allText = `${description} ${summary}`;
    
    if (shouldPreferUplifting) {
      // Boost books with positive endings
      if (allText.includes('happy ending') || allText.includes('hopeful')) adjustment += 2;
      // Boost comfort reads
      if (allText.includes('comfort') || allText.includes('escape')) adjustment += 1;
      // Penalize downer endings
      if (allText.includes('sad ending') || allText.includes('bittersweet ending')) adjustment -= 1;
    }
    
    if (shouldPreferDark) {
      // Boost psychologically complex books
      if (allText.includes('psychological') || allText.includes('morally grey')) adjustment += 2;
      // Penalize too-light books
      if (allText.includes('light-hearted') || allText.includes('wholesome')) adjustment -= 1;
    }
    
    return {
      ...book,
      score: (book.score || 0) + adjustment,
    };
  });
}

/**
 * MAIN SEMANTIC SEARCH FUNCTION
 * Search across FULL 50k+ dataset with semantic mood intelligence
 */
export function semanticMoodSearch(userQuery, allBooks, { topK = 10 } = {}) {
  if (!userQuery || !userQuery.trim() || !allBooks || allBooks.length === 0) {
    return [];
  }
  
  console.log('[SemanticMoodIntelligence] Starting semantic search:', {
    query: userQuery,
    totalBooks: allBooks.length,
    topK,
  });
  
  // Step 1: Expand mood intent
  const expandedMoodIntent = expandMoodIntent(userQuery);
  console.log('[SemanticMoodIntelligence] Expanded mood intent:', expandedMoodIntent);
  
  // Step 2: Score ALL books (not just loaded ones!)
  const startScore = performance.now();
  const scoredBooks = allBooks.map(book => ({
    ...book,
    score: scoreBookSemantics(book, expandedMoodIntent),
  }));
  const scoreTime = performance.now() - startScore;
  
  // Step 3: Filter by minimum score and sort
  const minScore = 1; // Accept any book with score > 0
  const candidates = scoredBooks
    .filter(book => book.score >= minScore)
    .sort((a, b) => b.score - a.score);
  
  // Step 4: Rerank top 20 with emotional intelligence
  const topCandidates = candidates.slice(0, Math.max(topK * 2, 20));
  const reranked = rerankcandidates(topCandidates, expandedMoodIntent);
  reranked.sort((a, b) => b.score - a.score);
  
  // Step 5: Return top K
  const results = reranked.slice(0, topK).map(book => ({
    ...book,
    relevanceScore: Number(book.score.toFixed(1)),
  }));
  
  console.log('[SemanticMoodIntelligence] Semantic search complete:', {
    totalEvaluated: allBooks.length,
    scoreTimeMs: scoreTime.toFixed(1),
    matched: candidates.length,
    returning: results.length,
    topScores: results.slice(0, 3).map(b => ({
      title: b.title,
      score: b.relevanceScore,
    })),
  });
  
  return results;
}

/**
 * Generate emotionally intelligent explanation
 */
export function generateSemanticExplanation(book, expandedMoodIntent) {
  const mood = expandedMoodIntent.mood;
  const moodDescription = expandedMoodIntent.primary;
  
  const genre = book.genre ? (Array.isArray(book.genre) ? book.genre[0] : book.genre) : 'fiction';
  const tags = book.moodTags ? (Array.isArray(book.moodTags) ? book.moodTags.slice(0, 2).join(', ') : book.moodTags) : '';
  const rating = book.rating ? `(${book.rating}/5)` : '';
  
  // Craft mood-specific explanation
  const explanations = {
    happy: `This ${genre} book delivers ${moodDescription} vibes through its ${tags} storytelling. ${rating}`,
    cozy: `A perfect comfort read with ${tags} atmosphere that feels warm and inviting. ${rating}`,
    sad: `A profoundly moving story that explores ${tags} emotions with beautiful depth. ${rating}`,
    dark: `A psychologically intense journey with ${tags} themes that captivate thoughtful readers. ${rating}`,
    romantic: `An emotionally rich story centered on ${tags} connections that resonate deeply. ${rating}`,
    adventure: `An exhilarating journey filled with ${tags} moments and high-stakes excitement. ${rating}`,
    scary: `A spine-tingling thriller with ${tags} elements that keeps you gripped. ${rating}`,
    inspiring: `An empowering narrative that leaves readers feeling ${tags} and motivated. ${rating}`,
    funny: `A delightfully entertaining read with ${tags} humor that lifts the spirit. ${rating}`,
    magical: `An enchanting tale brimming with ${tags} wonder and otherworldly beauty. ${rating}`,
    thoughtful: `A intellectually stimulating work offering ${tags} insights and profound meaning. ${rating}`,
  };
  
  return explanations[mood] || `A ${genre} book with ${tags} qualities that matches your mood. ${rating}`;
}

/**
 * Create memoizable cache key for semantic search
 */
export function createSemanticCacheKey(query, totalBookCount) {
  return `semantic_search_${query.toLowerCase().trim()}_${totalBookCount}`;
}
