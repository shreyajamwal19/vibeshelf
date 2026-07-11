/**
 * KnownBooksDatabase.js
 * 
 * Curated database of well-known, critically acclaimed books
 * Acts as a quality filter to ensure Book AI only recommends books
 * that are recognizable, well-reviewed, and culturally significant
 * 
 * This gives ChatGPT-like knowledge - when asked for "sad books",
 * we recommend "The Midnight Library", "It Ends With Us", "The Song of Achilles"
 * NOT obscure books no one has heard of
 */

// Comprehensive list of well-known, critically acclaimed books across genres/moods
const KNOWN_BOOKS = [
  // === EMOTIONAL/SAD ===
  { title: "The Midnight Library", author: "Matt Haig", keywords: ["sad", "emotional", "life", "choices", "hope", "dark"], rating: 4.2 },
  { title: "It Ends With Us", author: "Colleen Hoover", keywords: ["sad", "emotional", "domestic abuse", "dark", "heavy"], rating: 4.6 },
  { title: "The Song of Achilles", author: "Madeline Miller", keywords: ["sad", "emotional", "tragedy", "ancient", "love"], rating: 4.3 },
  { title: "Before the Coffee Gets Cold", author: "Toshikazu Kawaguchi", keywords: ["sad", "emotional", "regret", "time", "hope"], rating: 4.2 },
  { title: "The Nightingale", author: "Kristin Hannah", keywords: ["sad", "emotional", "war", "heartbreaking", "family"], rating: 4.5 },
  { title: "All the Light We Cannot See", author: "Anthony Doerr", keywords: ["sad", "emotional", "war", "love", "fate"], rating: 4.6 },
  { title: "Me Before You", author: "Jojo Moyes", keywords: ["sad", "emotional", "love", "difficult", "choice"], rating: 4.2 },
  { title: "The Thirteenth Tale", author: "Diane Setterfield", keywords: ["sad", "emotional", "gothic", "mystery", "family"], rating: 4.1 },
  { title: "The Kite Runner", author: "Khaled Hosseini", keywords: ["sad", "emotional", "redemption", "friendship", "betrayal"], rating: 4.5 },
  { title: "A Thousand Splendid Suns", author: "Khaled Hosseini", keywords: ["sad", "emotional", "women", "Afghanistan", "resilience"], rating: 4.6 },
  { title: "The Book Thief", author: "Markus Zusak", keywords: ["sad", "emotional", "war", "death", "love", "words"], rating: 4.4 },
  { title: "Eleanor Oliphant Is Completely Fine", author: "Gail Honeyman", keywords: ["sad", "emotional", "loneliness", "healing", "friendship"], rating: 4.1 },
  { title: "Still Alice", author: "Lisa Genova", keywords: ["sad", "emotional", "family", "disease", "heartbreaking"], rating: 4.2 },
  { title: "When Breath Becomes Air", author: "Paul Kalanithi", keywords: ["sad", "emotional", "death", "life", "profound"], rating: 4.3 },
  { title: "The Fault in Our Stars", author: "John Green", keywords: ["sad", "emotional", "young adult", "cancer", "love"], rating: 4.2 },
  { title: "We Need to Talk About Kevin", author: "Lionel Shriver", keywords: ["sad", "dark", "psychological", "motherhood"], rating: 3.9 },

  // === COZY/COMFORT ===
  { title: "The House in Cerulean Sea", author: "TJ Klune", keywords: ["cozy", "comfort", "heartwarming", "found family", "magical"], rating: 4.6 },
  { title: "Remarkably Bright", author: "Catherine Isaac", keywords: ["cozy", "comfort", "heartwarming", "family"], rating: 4.0 },
  { title: "The Cottage by the Sea", author: "Rosalind Laker", keywords: ["cozy", "comfort", "lighthouse", "love"], rating: 4.1 },
  { title: "Beach Read", author: "Emily Henry", keywords: ["cozy", "comfort", "romance", "light", "beach"], rating: 4.2 },
  { title: "One Day in December", author: "Josie Silver", keywords: ["cozy", "comfort", "romance", "heartwarming"], rating: 4.1 },
  { title: "A Man Called Ove", author: "Fredrik Backman", keywords: ["cozy", "comfort", "heartwarming", "old man", "community"], rating: 4.5 },
  { title: "The Giver of Stars", author: "Jojo Moyes", keywords: ["cozy", "comfort", "historical", "women"], rating: 4.1 },
  { title: "Lessons in Chemistry", author: "Bonnie Garmus", keywords: ["cozy", "comfort", "empowerment", "1960s"], rating: 4.3 },
  { title: "The Midnight Library", author: "Matt Haig", keywords: ["cozy", "comfort", "hope", "choices"], rating: 4.2 },

  // === THRILLING/MYSTERY ===
  { title: "Gone Girl", author: "Gillian Flynn", keywords: ["thriller", "mystery", "dark", "suspense", "twist"], rating: 4.1 },
  { title: "The Girl on the Train", author: "Paula Hawkins", keywords: ["thriller", "mystery", "suspense", "psychological"], rating: 4.0 },
  { title: "We Need to Talk About Kevin", author: "Lionel Shriver", keywords: ["thriller", "dark", "psychological"], rating: 3.9 },
  { title: "Big Little Lies", author: "Liane Moriarty", keywords: ["mystery", "suspense", "dark", "women"], rating: 4.2 },
  { title: "The Woman in Cabin 10", author: "Ruth Ware", keywords: ["thriller", "mystery", "suspense"], rating: 3.8 },
  { title: "In a Dark, Dark Wood", author: "Ruth Ware", keywords: ["thriller", "mystery", "suspense", "dark"], rating: 3.7 },
  { title: "The Silent Patient", author: "Alex Michaelides", keywords: ["thriller", "mystery", "psychological", "twist"], rating: 4.2 },
  { title: "One of Us Is Lying", author: "Karen M. McManus", keywords: ["mystery", "young adult", "suspense"], rating: 4.1 },
  { title: "The Thursday Murder Club", author: "Richard Osman", keywords: ["mystery", "cozy mystery", "funny", "heartwarming"], rating: 4.4 },
  { title: "A Good Girl's Guide to Murder", author: "Holly Jackson", keywords: ["mystery", "young adult", "suspense"], rating: 4.3 },

  // === FANTASY/ADVENTURE ===
  { title: "Howl's Moving Castle", author: "Diana Wynne Jones", keywords: ["fantasy", "adventure", "magical", "whimsical"], rating: 4.3 },
  { title: "Piranesi", author: "Susanna Clarke", keywords: ["fantasy", "magical", "mysterious", "unique"], rating: 4.1 },
  { title: "The House in the Cerulean Sea", author: "TJ Klune", keywords: ["fantasy", "magical", "heartwarming", "found family"], rating: 4.6 },
  { title: "Sorcery of Thorns", author: "Margaret Rogerson", keywords: ["fantasy", "young adult", "magical", "romance"], rating: 4.2 },
  { title: "Six of Crows", author: "Leigh Bardugo", keywords: ["fantasy", "heist", "adventure", "dark"], rating: 4.5 },
  { title: "The Invisible Library", author: "Genevieve Cogman", keywords: ["fantasy", "adventure", "magical", "librarian"], rating: 3.8 },
  { title: "The Night Circus", author: "Erin Morgenstern", keywords: ["fantasy", "magical", "romance", "atmospheric"], rating: 4.0 },
  { title: "The Starless Sea", author: "Erin Morgenstern", keywords: ["fantasy", "magical", "maze", "atmospheric"], rating: 3.9 },
  { title: "Warbreaker", author: "Brandon Sanderson", keywords: ["fantasy", "adventure", "magic system"], rating: 4.2 },
  { title: "Mistborn: The Final Empire", author: "Brandon Sanderson", keywords: ["fantasy", "adventure", "rebellion", "magic"], rating: 4.4 },

  // === ROMANCE ===
  { title: "The Hating Game", author: "Sally Thorne", keywords: ["romance", "enemies to lovers", "funny", "light"], rating: 4.2 },
  { title: "Outlander", author: "Diana Gabaldon", keywords: ["romance", "historical", "adventure", "epic"], rating: 4.3 },
  { title: "Me Before You", author: "Jojo Moyes", keywords: ["romance", "emotional", "difficult choices"], rating: 4.2 },
  { title: "The Time Traveler's Wife", author: "Audrey Niffenegger", keywords: ["romance", "magical", "emotional"], rating: 3.8 },
  { title: "Notting Hill", author: "Richard Curtis", keywords: ["romance", "light", "fun"], rating: 4.1 },
  { title: "Beach Read", author: "Emily Henry", keywords: ["romance", "light", "beach", "fun"], rating: 4.2 },
  { title: "Carry On", author: "Rainbow Rowell", keywords: ["romance", "fantasy", "LGBTQ+", "young adult"], rating: 4.3 },

  // === SCIENCE FICTION ===
  { title: "The Martian", author: "Andy Weir", keywords: ["sci-fi", "survival", "funny", "space"], rating: 4.4 },
  { title: "Project Hail Mary", author: "Andy Weir", keywords: ["sci-fi", "adventure", "space", "funny"], rating: 4.6 },
  { title: "Dune", author: "Frank Herbert", keywords: ["sci-fi", "epic", "space", "politics"], rating: 4.2 },
  { title: "The Three-Body Problem", author: "Liu Cixin", keywords: ["sci-fi", "hard sci-fi", "philosophical"], rating: 4.0 },
  { title: "Foundation", author: "Isaac Asimov", keywords: ["sci-fi", "classic", "epic"], rating: 4.0 },
  { title: "Ender's Game", author: "Orson Scott Card", keywords: ["sci-fi", "young adult", "military", "twist"], rating: 4.3 },
  { title: "The Expanse", author: "James S.A. Corey", keywords: ["sci-fi", "space opera", "epic"], rating: 4.2 },

  // === HISTORICAL FICTION ===
  { title: "The Nightingale", author: "Kristin Hannah", keywords: ["historical", "war", "emotional", "family"], rating: 4.5 },
  { title: "All the Light We Cannot See", author: "Anthony Doerr", keywords: ["historical", "war", "romance", "poetic"], rating: 4.6 },
  { title: "Outlander", author: "Diana Gabaldon", keywords: ["historical", "romance", "adventure"], rating: 4.3 },
  { title: "The Book Thief", author: "Markus Zusak", keywords: ["historical", "war", "emotional", "unique narrator"], rating: 4.4 },
  { title: "Wolf Hall", author: "Hilary Mantel", keywords: ["historical", "ambitious", "detailed"], rating: 4.0 },

  // === PSYCHOLOGICAL/DARK ===
  { title: "The Silent Patient", author: "Alex Michaelides", keywords: ["psychological", "dark", "twist", "unreliable"], rating: 4.2 },
  { title: "Gone Girl", author: "Gillian Flynn", keywords: ["psychological", "dark", "twist"], rating: 4.1 },
  { title: "We Need to Talk About Kevin", author: "Lionel Shriver", keywords: ["psychological", "dark", "disturbing"], rating: 3.9 },
  { title: "The Kind Worth Killing", author: "Peter Swanson", keywords: ["psychological", "dark", "thriller"], rating: 3.9 },
  { title: "Verity", author: "Colleen Hoover", keywords: ["psychological", "dark", "twisted", "unreliable"], rating: 4.5 },

  // === LITERARY/THOUGHTFUL ===
  { title: "The Midnight Library", author: "Matt Haig", keywords: ["literary", "thoughtful", "philosophical"], rating: 4.2 },
  { title: "Eleanor Oliphant Is Completely Fine", author: "Gail Honeyman", keywords: ["literary", "character-driven", "emotional"], rating: 4.1 },
  { title: "The Kite Runner", author: "Khaled Hosseini", keywords: ["literary", "emotional", "redemption"], rating: 4.5 },
  { title: "Educated", author: "Tara Westover", keywords: ["literary", "memoir", "thought-provoking"], rating: 4.3 },
  { title: "Becoming", author: "Michelle Obama", keywords: ["memoir", "inspiring", "well-written"], rating: 4.6 },

  // === HUMOROUS/LIGHT ===
  { title: "The Hating Game", author: "Sally Thorne", keywords: ["funny", "light", "romance"], rating: 4.2 },
  { title: "A Man Called Ove", author: "Fredrik Backman", keywords: ["funny", "heartwarming", "character-driven"], rating: 4.5 },
  { title: "The Thursday Murder Club", author: "Richard Osman", keywords: ["funny", "cozy", "mystery"], rating: 4.4 },
  { title: "Howl's Moving Castle", author: "Diana Wynne Jones", keywords: ["funny", "magical", "whimsical"], rating: 4.3 },
  { title: "The Martian", author: "Andy Weir", keywords: ["funny", "sci-fi", "survival"], rating: 4.4 },
];

/**
 * Powerful authors who are known for specific moods/styles
 * When these authors appear, it's a strong signal
 */
export const KNOWN_AUTHORS = {
  emotional: ["Colleen Hoover", "Khaled Hosseini", "Kristin Hannah", "Matt Haig", "Jojo Moyes"],
  cozy: ["Fredrik Backman", "TJ Klune", "Emery Fort", "Jenny Bayliss"],
  thriller: ["Gillian Flynn", "Paula Hawkins", "Ruth Ware", "Alex Michaelides"],
  fantasy: ["Brandon Sanderson", "Leigh Bardugo", "Erin Morgenstern", "Diana Wynne Jones"],
  romance: ["Emily Henry", "Sally Thorne", "Rainbow Rowell", "Diana Gabaldon"],
  scifi: ["Andy Weir", "Liu Cixin", "Isaac Asimov", "Frank Herbert"],
};

/**
 * Check if a book is in the known books database
 * Returns quality score if found, null if not
 */
export function getKnownBookScore(title, author) {
  if (!title) return null;
  
  const titleLower = title.toLowerCase().trim();
  
  for (const book of KNOWN_BOOKS) {
    const bookTitleLower = book.title.toLowerCase();
    
    // Exact match or close match
    if (titleLower === bookTitleLower) {
      if (!author || author.toLowerCase() === book.author.toLowerCase()) {
        return {
          isKnown: true,
          quality: 1.0,
          rating: book.rating,
          title: book.title,
          author: book.author,
        };
      }
    }
    
    // Partial match (book title contains query, at least 80% match)
    if (titleLower.includes(bookTitleLower) || bookTitleLower.includes(titleLower)) {
      const similarity = Math.min(
        titleLower.length,
        bookTitleLower.length
      ) / Math.max(titleLower.length, bookTitleLower.length);
      
      if (similarity >= 0.8) {
        return {
          isKnown: true,
          quality: similarity,
          rating: book.rating,
          title: book.title,
          author: book.author,
        };
      }
    }
  }
  
  return null; // Not a known book
}

/**
 * Filter books to only return known, well-respected ones
 * This ensures AI recommendations feel like ChatGPT - only suggesting books people have heard of
 */
export function filterToKnownBooks(books) {
  if (!books || books.length === 0) return [];
  
  const knownBooks = [];
  const unknownCount = books.length;
  
  for (const book of books) {
    const knownScore = getKnownBookScore(book.title, book.author);
    
    if (knownScore) {
      knownBooks.push({
        ...book,
        knownScore: knownScore.quality,
        isWellKnown: true,
        knownRating: knownScore.rating,
      });
    }
  }
  
  console.log(`[KnownBooksDatabase] Filtered ${unknownCount} books → ${knownBooks.length} well-known books`);
  
  return knownBooks;
}

/**
 * Boost scoring for known books to ensure they rank higher
 * A "known, good book" is always better than an obscure one
 */
export function boostKnownBookScores(candidates) {
  if (!candidates || candidates.length === 0) return candidates;
  
  return candidates.map(book => {
    const knownScore = getKnownBookScore(book.title, book.author);
    
    if (knownScore && knownScore.quality > 0.9) {
      // Strong boost for well-known books (multiplier)
      const baseScore = book.relevanceScore || book.stage1Score || 0;
      const boostedScore = baseScore * 1.5; // 50% boost for known, quality books
      
      return {
        ...book,
        relevanceScore: boostedScore,
        stage1Score: boostedScore,
        isWellKnown: true,
        knownQuality: knownScore.quality,
      };
    }
    
    return book;
  });
}

/**
 * Build recommendation prompt with emphasis on known books
 * This ensures ChatGPT-like recommendations
 */
export function buildKnownBooksPrompt(matches, userQuery) {
  if (!matches || matches.length === 0) {
    return `You are a book recommendation expert with deep knowledge of acclaimed literature. 
The user asked: "${userQuery}". 

Unfortunately, we don't have well-known books matching this exact request in our library right now.

Suggest them 2-3 recommendations from world literature that would match their mood, and explain why.`;
  }
  
  const header = `You are a book recommendation expert with deep knowledge of acclaimed, well-known literature. 
The user is looking for: "${userQuery}"

I've carefully curated our collection and found these **well-known, critically acclaimed books** that match:`;
  
  const entries = matches.map((m, i) => {
    const g = Array.isArray(m.genre) ? m.genre.join(', ') : m.genre || 'Literary Fiction';
    const quality = m.isWellKnown ? '✓ Acclaimed' : 'Good';
    
    return `\n${i + 1}. **${m.title}** by ${m.author} [${quality}]
   Genre: ${g} | Rating: ${m.rating ? m.rating.toFixed(1) : 'N/A'}/5
   "${m.description ? m.description.slice(0, 200) : 'An excellent read'}..."`;
  }).join('\n');
  
  const tail = `\n\nThese are all well-respected books that readers and critics love. Based on the request for "${userQuery}":

- Pick the top 2-3 that best match
- Explain why each one fits the mood or need
- Use natural, warm language
- Be specific about what makes each book special
- Show genuine enthusiasm

Keep recommendations to 2-3 sentences each.`;
  
  return `${header}\n${entries}\n${tail}`;
}

/**
 * Get all books with a specific mood from the known database
 * Useful for building fallback recommendations
 */
export function getBooksWithKeyword(keyword) {
  const keywordLower = keyword.toLowerCase();
  return KNOWN_BOOKS.filter(book => 
    book.keywords.some(k => k.toLowerCase().includes(keywordLower))
  );
}

export default {
  KNOWN_BOOKS,
  KNOWN_AUTHORS,
  getKnownBookScore,
  filterToKnownBooks,
  boostKnownBookScores,
  buildKnownBooksPrompt,
  getBooksWithKeyword,
};
