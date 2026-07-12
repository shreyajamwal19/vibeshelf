/**
 * AIBookRecommender.jsx
 * 
 * React component for AI-powered book recommendations using Ollama
 * Features:
 * - Beautiful UI for mood input
 * - Real-time loading state
 * - Displays 5 book recommendations with vibe descriptions
 * - Error handling with user-friendly messages
 * - Responsive design (Tailwind CSS)
 * 
 * Usage:
 * import AIBookRecommender from './components/AIBookRecommender';
 * 
 * <AIBookRecommender />
 */

import { useState } from 'react';

export default function AIBookRecommender() {
  const [mood, setMood] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleGetRecommendations = async (e) => {
    e.preventDefault();

    if (!mood.trim()) {
      setError('Please tell us your mood!');
      return;
    }

    if (mood.trim().length > 500) {
      setError('Mood description too long (max 500 characters)');
      return;
    }

    setLoading(true);
    setError(null);
    setBooks([]);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mood: mood.trim() }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setError('Rate limit exceeded. Please wait before trying again.');
        return;
      }

      // Backend can return either an array (legacy) or a wrapper { source, recommendations }
      let recs = [];
      if (Array.isArray(data)) recs = data;
      else if (data.recommendations) recs = data.recommendations;
      else if (data.books) recs = data.books;

      if (!recs || recs.length === 0) {
        setError(data.error || 'Failed to get recommendations. Please try again.');
      } else {
        // prefer GROQ source when backend signals it, otherwise accept fallback
        setBooks(recs);
        if (data.processingTimeMs) setProcessingTime(data.processingTimeMs);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(
        'Network error. Make sure the backend is running and Ollama is available.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!mood.trim()) return;
    
    setLoadingMore(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mood: mood.trim() }),
      });

      const data = await response.json();

      if (data.success && data.books) {
        // Add new books to existing list, avoiding duplicates
        const newBooks = [...books];
        for (const book of data.books) {
          if (!newBooks.find(b => b.title === book.title)) {
            newBooks.push(book);
          }
        }
        setBooks(newBooks);
      } else {
        setError(data.error || 'Failed to load more books. Please try again.');
      }
    } catch (err) {
      console.error('Error loading more books:', err);
      setError('Network error. Could not load more books.');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            📚 Find Your Next Vibe
          </h1>
          <p className="text-lg text-purple-300">
            AI-powered book recommendations tailored to your mood
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 mb-12 border border-purple-500/20">
          <form onSubmit={handleGetRecommendations}>
            <div className="mb-6">
              <label htmlFor="mood" className="block text-white font-semibold mb-3">
                What's your mood right now? ✨
              </label>
              <input
                id="mood"
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="e.g., heartbreak, happy and adventurous, dark and mysterious..."
                className="w-full px-4 py-3 bg-slate-700 text-white placeholder-slate-400 rounded-lg border border-purple-500/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105 disabled:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating your vibe...
                </span>
              ) : (
                <span>🎯 Get Book Recommendations</span>
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-8">
            <p className="text-red-200">❌ {error}</p>
          </div>
        )}

        {/* Processing Time */}
        {processingTime && (
          <div className="text-center mb-6">
            <p className="text-purple-300 text-sm">
              ⚡ Generated in {(processingTime / 1000).toFixed(2)}s
            </p>
          </div>
        )}

        {/* Books Grid */}
        {books.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-8">
              Your {mood} Vibes 💫
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book, index) => (
                <div
                  key={index}
                  className="bg-slate-800 rounded-lg border border-purple-500/30 hover:border-purple-500/60 p-6 transition hover:shadow-lg hover:shadow-purple-500/20 transform hover:-translate-y-1"
                >
                  {/* Book Number */}
                  <div className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mb-4">
                    {index + 1}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-2">
                    {book.title}
                  </h3>

                  {/* Author */}
                  <p className="text-purple-400 font-semibold mb-4">
                    by {book.author}
                  </p>

                  {/* Reason / Vibe */}
                  <p className="text-slate-300 leading-relaxed text-sm">
                    {book.reason}
                  </p>

                  {/* Add to Bookshelf Button (Optional) */}
                  <button className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded transition">
                    📖 Add to Bookshelf
                  </button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    📚 Load More Books
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  handleGetRecommendations({ preventDefault: () => {} });
                }}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
              >
                🔄 Get Different Mood
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && books.length === 0 && !error && mood && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              Enter your mood above to discover your next favorite books! 📚
            </p>
          </div>
        )}

        {/* Examples Section */}
        {books.length === 0 && !loading && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
            <h3 className="text-white font-bold text-lg mb-4">Try these moods:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                '💔 heartbreak',
                '😊 happy and uplifting',
                '🌙 dark and mysterious',
                '✨ fantasy escape',
                '🔥 intense and thrilling',
                '🌿 calm and peaceful',
              ].map((exampleMood) => (
                <button
                  key={exampleMood}
                  onClick={() => setMood(exampleMood.replace(/^[^a-z]+/, ''))}
                  className="text-left px-4 py-2 bg-slate-700 hover:bg-purple-600 text-slate-200 rounded transition text-sm"
                >
                  {exampleMood}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
