import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { BOOK_LIBRARY } from '../data/BookLibrary.js';
import { fetchBooks } from '../services/api'; // Import fetchBooks from api.js

/**
 * BooksDataContext - SINGLE SOURCE OF TRUTH for books dataset
 * 
 * Guarantees:
 * - Fetches EXACTLY ONCE per session
 * - Falls back to local BOOK_LIBRARY if backend unavailable
 * - Never leaves books empty (always has fallback)
 * - All AI searches run against cached data
 */

const BooksDataContext = createContext(null);

export const BooksDataProvider = ({ children }) => {
  const [books, setBooks] = useState(BOOK_LIBRARY || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);
  
  const fetchInitiatedRef = useRef(false);
  const fetchPromiseRef = useRef(null);

  useEffect(() => {
    if (fetchInitiatedRef.current) return;
    
    fetchInitiatedRef.current = true;

    if (!fetchPromiseRef.current) {
      // Use the fetchBooks function from api.js to leverage retry and longer timeout
      fetchPromiseRef.current = fetchBooks()
        .then(data => {
          const booksList = data.books || data.data || [];
          console.log('[BooksDataContext] ✅ Loaded from backend:', booksList.length, 'books');
          setBooks(booksList);
          setError(null);
          setUsingFallback(false);
          return booksList;
        })
        .catch(err => {
          console.log('[BooksDataContext] ⚠️ Backend unavailable, using local BOOK_LIBRARY');
          console.log('[BooksDataContext] Error:', err.message);
          setBooks(BOOK_LIBRARY || []);
          setUsingFallback(true);
          setError(null); // Don't show error - fallback works
          return BOOK_LIBRARY || [];
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  const value = {
    books,
    loading,
    error,
    usingFallback,
  };

  return (
    <BooksDataContext.Provider value={value}>
      {children}
    </BooksDataContext.Provider>
  );
};

/**
 * Hook to access books data anywhere in app
 */
export const useBooksData = () => {
  const context = useContext(BooksDataContext);
  if (!context) {
    throw new Error('useBooksData must be used inside BooksDataProvider');
  }
  return context;
};

export default BooksDataContext;
