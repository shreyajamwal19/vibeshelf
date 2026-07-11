/**
 * AISessionContext.js - Tracks user preferences and conversation context
 * Enables personalized recommendations and intelligent follow-ups
 */

class AISessionContext {
  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.conversationHistory = [];
    this.shownBooks = new Set();
    this.likedGenres = new Set();
    this.likedMoods = new Set();
    this.likedTropes = new Set();
    this.dislikedThemes = new Set();
    this.dislikedGenres = new Set();
    this.userInstructions = [];
    this.satisfactionState = 'neutral'; // 'neutral', 'happy', 'refining'
    this.likedAuthors = new Set();
    this.avoidedAuthors = new Set();
    this.requestCount = 0;
    this.startTime = Date.now();

    console.log('[AISessionContext] Initialized session:', this.sessionId);
  }

  /**
   * Add a conversation turn
   */
  addConversation(userMessage, aiResponse, recommendations = []) {
    this.conversationHistory.push({
      timestamp: Date.now(),
      userMessage,
      aiResponse,
      recommendationCount: recommendations.length,
      recommendations: recommendations.map(r => ({
        id: r.id,
        title: r.title,
        author: r.author,
      })),
    });

    // Track shown books
    recommendations.forEach(r => this.shownBooks.add(r.id));

    this.requestCount += 1;
    console.log(`[AISessionContext] Added conversation turn #${this.requestCount}`);
  }

  /**
   * Record user feedback on a recommendation
   */
  recordFeedback(bookId, sentiment, reason = '') {
    if (sentiment === 'like') {
      this.conversationHistory[this.conversationHistory.length - 1]?.liked?.add(bookId);
      this.satisfactionState = 'happy';
      console.log('[AISessionContext] User liked a recommendation');
    } else if (sentiment === 'dislike') {
      this.conversationHistory[this.conversationHistory.length - 1]?.disliked?.add(bookId);
      console.log('[AISessionContext] User disliked a recommendation');
    }
  }

  /**
   * Update genre preferences
   */
  updateGenrePreference(genre, isLike = true) {
    if (isLike) {
      this.likedGenres.add(genre.toLowerCase());
      this.dislikedGenres.delete(genre.toLowerCase());
    } else {
      this.dislikedGenres.add(genre.toLowerCase());
      this.likedGenres.delete(genre.toLowerCase());
    }
  }

  /**
   * Update mood preferences
   */
  updateMoodPreference(mood, isLike = true) {
    if (isLike) {
      this.likedMoods.add(mood.toLowerCase());
    }
  }

  /**
   * Update theme preferences
   */
  updateThemePreference(theme, isDislike = true) {
    if (isDislike) {
      this.dislikedThemes.add(theme.toLowerCase());
    }
  }

  /**
   * Update author preference
   */
  updateAuthorPreference(author, isLike = true) {
    if (isLike) {
      this.likedAuthors.add(author);
    } else {
      this.avoidedAuthors.add(author);
    }
  }

  /**
   * Add follow-up instruction
   */
  addInstruction(instruction) {
    this.userInstructions.push({
      timestamp: Date.now(),
      instruction,
    });
    console.log('[AISessionContext] Added instruction:', instruction);
  }

  /**
   * Get system prompt for WebLLM to understand context
   */
  getContextPrompt() {
    const liked = Array.from(this.likedGenres).join(', ') || 'not specified';
    const disliked = Array.from(this.dislikedGenres).join(', ') || 'none';
    const avoidThemes = Array.from(this.dislikedThemes).join(', ') || 'none';
    const instructions = this.userInstructions
      .slice(-3) // Last 3 instructions
      .map(i => `- ${i.instruction}`)
      .join('\n');

    return `You are VibeShelf AI, a knowledgeable and warm book librarian. 

Current session context:
- Total recommendations made: ${this.requestCount}
- Books shown so far: ${this.shownBooks.size}
- User's liked genres: ${liked}
- User's disliked genres: ${disliked}
- Avoid themes: ${avoidThemes}
- Liked authors: ${Array.from(this.likedAuthors).join(', ') || 'not specified'}
- User satisfaction: ${this.satisfactionState}

Recent user instructions:
${instructions || '(none yet)'}

Remember:
- NEVER recommend books already shown in this conversation
- Consider the user's stated preferences and past feedback
- Explain WHY each book matches their taste
- Be warm, encouraging, and literary in tone`;
  }

  /**
   * Get a summary of conversation for context
   */
  getConversationSummary(maxTurns = 5) {
    const recent = this.conversationHistory.slice(-maxTurns);
    return recent
      .map((turn, i) => `Turn ${i + 1}: "${turn.userMessage}" → ${turn.recommendationCount} books recommended`)
      .join('\n');
  }

  /**
   * Reset session (for testing)
   */
  reset() {
    this.conversationHistory = [];
    this.shownBooks.clear();
    this.likedGenres.clear();
    this.likedMoods.clear();
    this.likedTropes.clear();
    this.dislikedThemes.clear();
    this.dislikedGenres.clear();
    this.userInstructions = [];
    this.satisfactionState = 'neutral';
    this.requestCount = 0;
    console.log('[AISessionContext] Session reset');
  }

  /**
   * Get session stats
   */
  getStats() {
    return {
      sessionId: this.sessionId,
      requestCount: this.requestCount,
      booksShown: this.shownBooks.size,
      satisfactionState: this.satisfactionState,
      likedGenres: Array.from(this.likedGenres),
      dislikedGenres: Array.from(this.dislikedGenres),
      conversationTurns: this.conversationHistory.length,
      sessionDurationMs: Date.now() - this.startTime,
    };
  }
}

// Global session instance
let globalSession = null;

export function initializeSession() {
  globalSession = new AISessionContext();
  return globalSession;
}

export function getSession() {
  if (!globalSession) {
    globalSession = new AISessionContext();
  }
  return globalSession;
}

export function resetSession() {
  globalSession?.reset();
  globalSession = new AISessionContext();
}

export default {
  initializeSession,
  getSession,
  resetSession,
  AISessionContext,
};
