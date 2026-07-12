import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { BOOK_LIBRARY } from '../data/BookLibrary.js';

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
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 3000);
      
      fetchPromiseRef.current = fetch(`${import.meta.env.VITE_API_URL}/api/books`, {
        signal: abortController.signal
      })
        .then(response => {
          clearTimeout(timeoutId);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then(data => {
          const booksList = data.books || data.data || [];
          console.log('[BooksDataContext] ✅ Loaded from backend:', booksList.length, 'books');
          setBooks(booksList);
          setError(null);
          setUsingFallback(false);
          return booksList;
        })
        .catch(err => {
          clearTimeout(timeoutId);
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
