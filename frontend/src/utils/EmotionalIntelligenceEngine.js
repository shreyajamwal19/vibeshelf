/**
 * EmotionalIntelligenceEngine.js
 * 
 * 3-STAGE HUMAN-LIKE RECOMMENDATION PIPELINE
 * 
 * Transforms Book AI from shallow keyword-matching to deeply thoughtful recommendations
 * that understand emotional arcs, tones, and the true essence of books.
 * 
 * STAGE 1: Broad Retrieval (Top 100 candidates across all fields)
 * STAGE 2: Deep Emotional Reranking (Analyze descriptions, infer emotional depth)
 * STAGE 3: Human-Like Curation (Remove duplicates, diversify, finalize top 5)
 */

/**
 * STAGE 1: BROAD RETRIEVAL
 * Search across FULL dataset using semantic mood expansion
 * Returns top 100 candidate books with initial scoring
 */
export function stage1BroadRetrieval(query, allBooks, expandedMoodIntent, { topK = 100 } = {}) {
  if (!allBooks || allBooks.length === 0) return [];
  
  console.log('[EIE] STAGE 1: Broad retrieval starting', { query, topK, totalBooks: allBooks.length });
  
  const { expansion, sentimentWords, genreBoosts, excludeKeywords } = expandedMoodIntent;
  
  // Score all books across multiple dimensions
  const scoredBooks = allBooks.map(book => {
    let score = 0;
    
    const title = (book.title || '').toLowerCase();
    const author = (book.author || '').toLowerCase();
    const description = (book.description || '').toLowerCase();
    const genre = book.genre ? (Array.isArray(book.genre) ? book.genre.join(' ') : book.genre).toLowerCase() : '';
    const moodTags = book.moodTags ? (Array.isArray(book.moodTags) ? book.moodTags : [book.moodTags]) : [];
    const summary = (book.synopsis || book.summary || '').toLowerCase();
    const reviews = (book.reviews || '').toLowerCase();
    
    // ============ TITLE MATCH (Weight: 2.5x) ============
    // Title keywords are strongest signals
    expansion.forEach(term => {
      if (title.includes(term)) score += 3;
    });
    
    // ============ MOOD TAGS MATCH (Weight: 3x) ============
    // Explicit mood tags are reliable
    expansion.forEach(term => {
      moodTags.forEach(tag => {
        if ((tag || '').toLowerCase().includes(term)) score += 3.5;
      });
    });
    
    // ============ DESCRIPTION ANALYSIS (Weight: 2.5x) ============
    // Description is primary source of emotional truth
    expansion.forEach(term => {
      const descMatches = (description.match(new RegExp(term, 'g')) || []).length;
      score += Math.min(descMatches * 1.5, 4); // Cap per term to avoid double-counting
    });
    
    // ============ SENTIMENT WORDS (Weight: 2x) ============
    // Look for positive emotional language
    sentimentWords.forEach(word => {
      if (description.includes(word)) score += 2;
      if (summary.includes(word)) score += 1.5;
    });
    
    // ============ GENRE BOOST (Weight: 2x) ============
    // Genre alignment is important but not primary
    genreBoosts.forEach(g => {
      if (genre.includes(g.toLowerCase())) score += 2;
    });
    
    // ============ AUTHOR MATCH (Weight: 1x) ============
    // Famous authors in mood category
    if (author.includes('nicholas sparks') || author.includes('colleen hoover')) score += 1;
    
    // ============ RATING BOOST (Weight: 1.5x) ============
    // Quality as proxy for emotional impact
    const rating = book.rating ? Number(book.rating) : null;
    if (rating && rating >= 4.5) score += 2;
    else if (rating && rating >= 4.0) score += 1.5;
    else if (rating && rating >= 3.5) score += 1;
    
    // ============ REVIEWS SIGNAL (Weight: 0.5x) ============
    // If reviews mention mood keywords
    expansion.forEach(term => {
      const reviewMatches = (reviews.match(new RegExp(term, 'g')) || []).length;
      if (reviewMatches > 0) score += Math.min(reviewMatches * 0.3, 1);
    });
    
    // ============ EXCLUDE KEYWORDS PENALTY ============
    // Remove strongly contradictory books
    excludeKeywords.forEach(keyword => {
      if (title.includes(keyword)) score -= 15;
      if (description.includes(keyword)) score -= 8;
    });
    
    return {
      ...book,
      stage1Score: Math.max(0, score),
    };
  });
  
  // Sort and return top candidates
  const candidates = scoredBooks
    .filter(b => b.stage1Score > 0)
    .sort((a, b) => b.stage1Score - a.stage1Score)
    .slice(0, topK);
  
  console.log('[EIE] STAGE 1 complete:', {
    evaluated: allBooks.length,
    candidates: candidates.length,
    topScores: candidates.slice(0, 3).map(b => ({ title: b.title, stage1Score: b.stage1Score.toFixed(1) })),
  });
  
  return candidates;
}

/**
 * STAGE 2: DEEP EMOTIONAL RERANKING
 * Analyze descriptions to infer emotional arc, tone, and depth
 * This is where the "human taste intelligence" happens
 */

export function analyzeBookEmotion(description) {
  /**
   * Analyze a book description to extract emotional signals:
   * - Emotional depth (surface vs profound)
   * - Emotional arc (sad → hopeful, etc)
   * - Tone (comforting vs devastating)
   * - Emotional center (what's core to the story)
   */
  
  if (!description) return { depth: 0, arc: 'neutral', tone: 'neutral', isCentral: false };
  
  const text = description.toLowerCase();
  
  // ============ EMOTIONAL DEPTH SIGNALS ============
  const depthIndicators = {
    veryDeep: ['profound', 'raw', 'vulnerable', 'introspective', 'cathartic', 'existential', 'meditation', 'transcendent'],
    deep: ['emotional', 'touching', 'moving', 'intimate', 'meaningful', 'reflective', 'powerful'],
    moderate: ['engaging', 'compelling', 'heartfelt', 'sincere', 'honest'],
    surface: ['fun', 'entertaining', 'light', 'humorous', 'playful', 'witty'],
  };
  
  let emotionalDepth = 0;
  depthIndicators.veryDeep.forEach(word => { if (text.includes(word)) emotionalDepth = Math.max(emotionalDepth, 4); });
  depthIndicators.deep.forEach(word => { if (text.includes(word)) emotionalDepth = Math.max(emotionalDepth, 3); });
  depthIndicators.moderate.forEach(word => { if (text.includes(word)) emotionalDepth = Math.max(emotionalDepth, 2); });
  depthIndicators.surface.forEach(word => { if (text.includes(word)) emotionalDepth = Math.max(emotionalDepth, 1); });
  
  // ============ EMOTIONAL ARC DETECTION ============
  // What journey does the book take emotionally?
  let emotionalArc = 'neutral';
  
  const upwardArcs = {
    hopeful: ['hope', 'healing', 'redemption', 'recovery', 'triumph', 'overcome', 'bittersweet hope'],
    joyful: ['joy', 'happiness', 'celebration', 'love', 'warmth', 'uplifting'],
    empowering: ['strength', 'empowerment', 'courage', 'resilience', 'inspiring', 'motivating'],
  };
  
  const downwardArcs = {
    tragic: ['tragedy', 'loss', 'grief', 'devastating', 'heartbreaking', 'tragedy'],
    dark: ['darkness', 'despair', 'anguish', 'suffering', 'bleak', 'noir'],
  };
  
  const stableArcs = {
    bittersweet: ['bittersweet', 'mixed', 'complicated', 'complex emotions', 'tender pain'],
    contemplative: ['reflection', 'meditation', 'quiet', 'introspection', 'philosophical'],
  };
  
  for (const [key, words] of Object.entries(upwardArcs)) {
    if (words.some(w => text.includes(w))) emotionalArc = 'uplifting';
  }
  for (const [key, words] of Object.entries(downwardArcs)) {
    if (words.some(w => text.includes(w))) emotionalArc = 'tragic';
  }
  for (const [key, words] of Object.entries(stableArcs)) {
    if (words.some(w => text.includes(w))) emotionalArc = 'complex';
  }
  
  // ============ TONE ANALYSIS ============
  // Is this comforting or devastating?
  let tone = 'neutral';
  
  const comfortingSignals = ['comfort', 'safe', 'warm', 'wholesome', 'cozy', 'embrace', 'healing', 'gentle', 'soothing'];
  const devastatingSignals = ['devastating', 'haunting', 'disturbing', 'unsettling', 'raw', 'visceral', 'traumatic', 'cruel'];
  const intenseSignals = ['psychological thriller', 'intense', 'gripping', 'suspenseful', 'dark', 'twisted'];
  
  let comfortScore = 0, devastatingScore = 0, intenseScore = 0;
  comfortingSignals.forEach(word => { if (text.includes(word)) comfortScore++; });
  devastatingSignals.forEach(word => { if (text.includes(word)) devastatingScore++; });
  intenseSignals.forEach(word => { if (text.includes(word)) intenseScore++; });
  
  if (comfortScore > devastatingScore && comfortScore > intenseScore) tone = 'comforting';
  else if (devastatingScore > comfortScore) tone = 'devastating';
  else if (intenseScore > comfortScore) tone = 'intense';
  
  // ============ EMOTIONAL CENTRALITY ============
  // Is the emotion central to the plot or just background?
  const centralitySignals = ['emotion', 'emotional journey', 'heartfelt', 'raw emotion', 'explores', 'examines emotions', 'centers on'];
  const isCentral = centralitySignals.some(signal => text.includes(signal));
  
  // ============ ENDING TONE ============
  // Happy ending, sad ending, bittersweet?
  let endingTone = 'unspecified';
  if (text.includes('happy ending') || text.includes('triumphant end')) endingTone = 'happy';
  else if (text.includes('sad ending') || text.includes('tragic end') || text.includes('bittersweet ending')) endingTone = 'sad';
  else if (text.includes('open ending') || text.includes('ambiguous')) endingTone = 'ambiguous';
  
  return {
    depth: emotionalDepth,        // 0-4 scale
    arc: emotionalArc,            // 'uplifting', 'tragic', 'complex', 'neutral'
    tone: tone,                   // 'comforting', 'devastating', 'intense', 'neutral'
    isCentral: isCentral,         // boolean
    endingTone: endingTone,       // 'happy', 'sad', 'ambiguous', 'unspecified'
  };
}

export function computeEmotionalDepthScore(book, moodIntent) {
  /**
   * Score how emotionally aligned a book is with the user's mood
   * Returns 0-100 score based on emotional analysis
   */
  
  const emotion = analyzeBookEmotion(book.description);
  const { mood, primary } = moodIntent;
  
  let score = 0;
  
  // ============ DEPTH ALIGNMENT ============
  // Deeper books better for sad/thoughtful moods
  const deepMoods = ['sad', 'thoughtful', 'dark', 'romantic'];
  const surfaceMoods = ['happy', 'funny', 'adventure'];
  
  if (deepMoods.includes(mood)) {
    // For sad/thoughtful: prefer deeper books
    score += emotion.depth * 15; // 0-60 points
  } else if (surfaceMoods.includes(mood)) {
    // For happy/fun: prefer lighter books (but depth isn't bad)
    score += Math.max(0, 4 - emotion.depth) * 10; // 0-40 points, prefers light
  } else {
    // For other moods: moderate depth is good
    score += (Math.abs(emotion.depth - 2) < 1 ? 20 : 10);
  }
  
  // ============ TONE ALIGNMENT ============
  // Match tone to mood
  if (mood === 'sad' || mood === 'dark') {
    if (emotion.tone === 'devastating' || emotion.tone === 'intense') score += 20;
    else if (emotion.tone === 'neutral') score += 10;
    else if (emotion.tone === 'comforting') score += 5; // Healing sadness
  } else if (mood === 'happy' || mood === 'funny') {
    if (emotion.tone === 'comforting') score += 20;
    else if (emotion.tone === 'intense') score += 5;
  } else if (mood === 'cozy') {
    if (emotion.tone === 'comforting') score += 25;
  }
  
  // ============ ARC ALIGNMENT ============
  if (mood === 'happy' || mood === 'inspiring') {
    if (emotion.arc === 'uplifting') score += 20;
    else if (emotion.arc === 'complex') score += 5;
  } else if (mood === 'sad') {
    if (emotion.arc === 'tragic' || emotion.arc === 'complex') score += 20;
    else if (emotion.arc === 'uplifting') score += 10; // Healing journey
  } else if (mood === 'dark') {
    if (emotion.arc === 'tragic' || emotion.arc === 'complex') score += 20;
  }
  
  // ============ EMOTIONAL CENTRALITY BONUS ============
  // Book that focuses on emotion > surface-level emotional content
  if (emotion.isCentral) score += 15;
  
  // ============ ENDING TONE BONUS ============
  if (mood === 'happy' || mood === 'inspiring') {
    if (emotion.endingTone === 'happy') score += 10;
  } else if (mood === 'sad') {
    if (emotion.endingTone === 'sad' || emotion.endingTone === 'bittersweet') score += 10;
  }
  
  // Cap at 100
  return Math.min(100, Math.max(0, score));
}

export function stage2EmotionalReranking(candidates, moodIntent, { topK = 20 } = {}) {
  /**
   * Deep reranking using emotional intelligence
   * Top 100 becomes top 20 with emotional analysis
   */
  
  console.log('[EIE] STAGE 2: Emotional reranking', { candidates: candidates.length, topK });
  
  // Score each book emotionally
  const emotionallyScored = candidates.map(book => {
    const emotionalScore = computeEmotionalDepthScore(book, moodIntent);
    return {
      ...book,
      emotionalScore,
      stage2Score: (book.stage1Score || 0) * 0.6 + emotionalScore * 0.4, // Blend stage 1 + stage 2
    };
  });
  
  // Sort by combined score
  const reranked = emotionallyScored
    .sort((a, b) => b.stage2Score - a.stage2Score)
    .slice(0, topK);
  
  console.log('[EIE] STAGE 2 complete:', {
    reranked: reranked.length,
    topScores: reranked.slice(0, 3).map(b => ({
      title: b.title,
      stage1: b.stage1Score?.toFixed(1),
      emotional: b.emotionalScore?.toFixed(1),
      combined: b.stage2Score?.toFixed(1),
    })),
  });
  
  return reranked;
}

/**
 * STAGE 3: HUMAN-LIKE CURATION
 * Remove duplicates, diversify genres, ensure intentional top 5
 */

function isSimilarBook(book1, book2) {
  /**
   * Check if two books are duplicates or too similar
   * Same title, same author, or very similar vibes
   */
  const normalizeStr = (s) => (s || '').toLowerCase().trim();
  
  // Exact title match
  if (normalizeStr(book1.title) === normalizeStr(book2.title)) return true;
  
  // Same author + similar title pattern
  if (normalizeStr(book1.author) === normalizeStr(book2.author)) {
    const title1 = normalizeStr(book1.title);
    const title2 = normalizeStr(book2.title);
    // If titles share significant words, they're probably same series
    const words1 = title1.split(/\s+/);
    const words2 = title2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w));
    if (commonWords.length >= 2) return true;
  }
  
  return false;
}

function deduplicateBooks(books) {
  /**
   * Remove duplicate/similar books, keeping highest scored
   */
  const unique = [];
  const seen = new Set();
  
  for (const book of books) {
    // Skip if we've already added a duplicate
    const isDuplicate = unique.some(existing => isSimilarBook(book, existing));
    if (!isDuplicate) {
      unique.push(book);
      seen.add(book.id || book.title);
    }
  }
  
  return unique;
}

function diversifyGenres(books, topK = 5) {
  /**
   * Ensure some genre diversity in final recommendations
   * Don't return 5 fantasy books even if they're all top-scored
   */
  
  const result = [];
  const genreCount = {};
  
  for (const book of books) {
    const genre = Array.isArray(book.genre) ? book.genre[0] : book.genre || 'unknown';
    
    // Prefer genres we haven't used yet
    const timesUsed = genreCount[genre] || 0;
    
    // Allow up to 2 books per genre for top 5
    if (timesUsed < 2) {
      result.push(book);
      genreCount[genre] = timesUsed + 1;
      
      if (result.length >= topK) break;
    }
  }
  
  // If we don't have enough after genre diversity, fill remaining with best-scored
  if (result.length < topK) {
    for (const book of books) {
      if (!result.find(b => b.id === book.id)) {
        result.push(book);
        if (result.length >= topK) break;
      }
    }
  }
  
  return result.slice(0, topK);
}

export function stage3HumanCuration(candidates, moodIntent, { topK = 5 } = {}) {
  /**
   * Final curation to ensure top 5 feel intentional and well-considered
   */
  
  console.log('[EIE] STAGE 3: Human curation', { candidates: candidates.length, topK });
  
  // 1. Deduplicate
  let curated = deduplicateBooks(candidates);
  
  // 2. Diversify genres (don't recommend 5 fantasy books)
  curated = diversifyGenres(curated, topK);
  
  // 3. Re-sort to keep highest-scored first
  curated.sort((a, b) => (b.stage2Score || 0) - (a.stage2Score || 0));
  
  // 4. Add relevance confidence (0-100 score)
  const finalResults = curated.map((book, idx) => ({
    ...book,
    relevanceScore: (book.stage2Score || 0).toFixed(1),
    emotionalConfidence: `${Math.round(book.emotionalScore || 0)}%`,
    rank: idx + 1,
  }));
  
  console.log('[EIE] STAGE 3 complete:', {
    final: finalResults.length,
    results: finalResults.map(b => ({
      rank: b.rank,
      title: b.title,
      score: b.relevanceScore,
      confidence: b.emotionalConfidence,
    })),
  });
  
  return finalResults;
}

/**
 * GENERATE HUMAN-LIKE REASONING
 * Create natural explanations for why each book matches
 */

export function generateEmotionalExplanation(book, moodIntent) {
  /**
   * Generate natural language explanation of why this book matches the mood
   * Much more thoughtful than generic explanations
   */
  
  const emotion = analyzeBookEmotion(book.description);
  const { mood, primary } = moodIntent;
  const genre = Array.isArray(book.genre) ? book.genre[0] : book.genre || 'fiction';
  
  const explanations = {
    happy: {
      comforting: `This ${genre} truly delivers uplifting joy. The description centers on heartwarming connections and hopeful moments—exactly what you need.`,
      neutral: `A feel-good read with wholesome vibes. The ${genre} focus on positive relationships makes this perfect for your happy mood.`,
      default: `Pure happiness and warmth radiate through this ${genre}. It's the kind of book that leaves you smiling.`,
    },
    sad: {
      tragic: `This emotionally powerful ${genre} explores profound grief and healing. The description shows real emotional depth—not shallow sadness, but meaningful catharsis.`,
      complex: `Bittersweet and moving, this ${genre} captures tender pain and quiet growth. It feels like talking to someone who truly understands sadness.`,
      default: `A deeply emotional ${genre} that doesn't shy away from sadness. The raw honesty in the description suggests this will resonate.`,
    },
    cozy: {
      comforting: `This ${genre} is pure comfort wrapped in pages. The description feels like a warm hug—safe, familiar, and inviting.`,
      neutral: `Wholesome and gentle, this ${genre} has that cozy intimate feeling you're looking for.`,
      default: `A comforting ${genre} with quiet, peaceful vibes perfect for settling in with.`,
    },
    dark: {
      devastating: `Psychologically intense and darkly compelling. This ${genre} has the kind of moral complexity and noir atmosphere that captivates.`,
      intense: `Gripping and morally grey, this ${genre} explores darkness without flinching. It's the thoughtful darkness you're seeking.`,
      default: `A dark, complex ${genre} that doesn't pull punches. The description promises psychological depth.`,
    },
    romantic: {
      default: `At its emotional heart, this ${genre} centers on deep human connection. The description suggests authentic, passionate relationships.`,
    },
    adventure: {
      default: `Thrilling and immersive, this ${genre} delivers the high-stakes excitement and discovery you want.`,
    },
    scary: {
      intense: `Spine-tingling and suspenseful, this ${genre} builds dread masterfully. The description promises genuine scares.`,
      default: `Gripping and unsettling, this ${genre} delivers the thrilling fear you're looking for.`,
    },
    inspiring: {
      uplifting: `Genuinely empowering, this ${genre} shows transformation and resilience. The kind of book that leaves you feeling hopeful and strong.`,
      default: `Motivational and uplifting, this ${genre} inspires through authentic human experience.`,
    },
    funny: {
      default: `Witty and genuinely entertaining, this ${genre} promises to make you laugh. The description suggests clever, sustained humor.`,
    },
    magical: {
      default: `Enchanting and wondrous, this ${genre} creates a magical world you'll want to escape into.`,
    },
    thoughtful: {
      default: `Intellectually rich and contemplative, this ${genre} offers the kind of profound insights that stay with you.`,
    },
  };
  
  const moodExplanations = explanations[mood];
  if (!moodExplanations) {
    return `This ${genre} matches your "${primary}" mood with emotional authenticity.`;
  }
  
  // Pick explanation based on tone
  if (emotion.tone && moodExplanations[emotion.tone]) {
    return moodExplanations[emotion.tone];
  }
  
  return moodExplanations.default || `This ${genre} is a perfect match for your mood.`;
}

/**
 * FULL 3-STAGE PIPELINE
 * Orchestrate all three stages into one powerful recommendation engine
 */

export function stage3RecommendationPipeline(query, allBooks, expandedMoodIntent, { topK = 5 } = {}) {
  /**
   * Complete 3-stage human-like recommendation pipeline
   * Returns curated top K results with deep reasoning
   */
  
  console.log('[EIE] ===== STARTING 3-STAGE PIPELINE =====');
  console.log(`[EIE] Query: "${query}"`);
  console.log(`[EIE] Total books to evaluate: ${allBooks.length}`);
  
  const startTime = performance.now();
  
  // STAGE 1: Broad retrieval (top 100)
  const stage1Results = stage1BroadRetrieval(query, allBooks, expandedMoodIntent, { topK: 100 });
  if (stage1Results.length === 0) {
    console.log('[EIE] No candidates found in stage 1');
    return [];
  }
  
  // STAGE 2: Emotional reranking (top 20)
  const stage2Results = stage2EmotionalReranking(stage1Results, expandedMoodIntent, { topK: 20 });
  
  // STAGE 3: Human curation (final top 5)
  const stage3Results = stage3HumanCuration(stage2Results, expandedMoodIntent, { topK });
  
  // Generate explanations
  const finalResults = stage3Results.map(book => ({
    ...book,
    explanation: generateEmotionalExplanation(book, expandedMoodIntent),
  }));
  
  const duration = (performance.now() - startTime).toFixed(0);
  console.log('[EIE] ===== PIPELINE COMPLETE =====');
  console.log(`[EIE] Total time: ${duration}ms`);
  console.log('[EIE] Final results:', finalResults.map(b => ({ title: b.title, rank: b.rank })));
  
  return finalResults;
}

export default {
  stage1BroadRetrieval,
  analyzeBookEmotion,
  computeEmotionalDepthScore,
  stage2EmotionalReranking,
  stage3HumanCuration,
  generateEmotionalExplanation,
  stage3RecommendationPipeline,
};
