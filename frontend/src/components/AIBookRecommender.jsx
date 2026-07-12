import { useState } from 'react';

export default function AIBookRecommender() {
  const [mood, setMood] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);

  // Helper to safely append books without duplicates
  const processAndAppendBooks = (data) => {
  console.log("processAndAppendBooks called", data);

  let newRecommendations = [];

    // Flexible extraction to handle different backend response formats
    if (Array.isArray(data)) {
      newRecommendations = data;
    } else if (data.recommendations) {
      newRecommendations = data.recommendations;
    } else if (data.books) {
      newRecommendations = data.books;
    }

    if (newRecommendations.length > 0) {
      setBooks((prevBooks) => {
  console.log("Previous books:", prevBooks.length);
        const combined = [...prevBooks];
        for (const book of newRecommendations) {
          // Only add if it doesn't already exist in the list
          if (!combined.find((b) => b.title === book.title)) {
            combined.push(book);
          }
        }
          console.log("Combined books:", combined.length);
        return combined;
      });
      return true;
    }
    return false;
  };

  const handleGetRecommendations = async (e) => {
    if (e) e.preventDefault();

    if (!mood.trim()) {
      setError('Please tell us your mood!');
      return;
    }

    setLoading(true);
    setError(null);
    setBooks([]); // Clear only on a brand new search

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: mood.trim() }),
      });

      const data = await response.json();
      
      if (!processAndAppendBooks(data)) {
        setError(data.error || 'No recommendations found.');
      }

      if (data.processingTimeMs) setProcessingTime(data.processingTimeMs);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Network error. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!mood.trim()) return;

    setLoadingMore(true);
    setError(null);

    try {
      // IMPORTANT: Append " more" to the mood string.
      // This ensures the backend sees this as a "RETRY" intent and 
      // keeps the session alive instead of resetting it.
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: `${mood.trim()} more` }),
      });

      const data = await response.json();

      if (!processAndAppendBooks(data)) {
        setError(data.error || 'Failed to load more books.');
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
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            📚 Find Your Next Vibe
          </h1>
        </div>

        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 mb-12 border border-purple-500/20">
          <form onSubmit={handleGetRecommendations}>
            <input
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="What's your mood?"
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-purple-500/30 mb-4"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-lg"
            >
              {loading ? 'Generating...' : '🎯 Get Book Recommendations'}
            </button>
          </form>
        </div>

        {error && <div className="text-red-400 mb-8">❌ {error}</div>}

        {books.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-8">Your Vibes 💫</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book, index) => (
                <div key={`${book.title}-${index}`} className="bg-slate-800 border border-purple-500/30 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-white mb-2">{book.title}</h3>
                  <p className="text-purple-400 mb-4">by {book.author}</p>
                  <p className="text-slate-300 text-sm">{book.reason}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-12">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg"
              >
                {loadingMore ? 'Loading...' : '📚 Load More Books'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}