import axios from 'axios';
import API_BASE_URL from '../config';

console.log("API_BASE_URL =", API_BASE_URL);

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Set a more reasonable timeout of 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Utility for retrying API calls
async function retry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error; // Last attempt, rethrow
      console.warn(`API call failed, retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`, error);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

/**
 * Fetch books from backend API.
 * Calls: GET /api/books?page=1&limit=24
 * Backend expects page to be 1-based.
 */
export async function fetchBooks({ page = 1, limit = 24, genre = '' } = {}) {
  return retry(async () => {
    try {
      const params = { page, limit };
      if (genre) params.genre = genre;

      // ✅ CORRECT endpoint (this was the bug)
      const res = await client.get('/api/books', { params });

      // Backend returns:
      // { books, total, totalPages, hasMore }
      return res.data;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch books';

      const e = new Error(message);
      e.response = err?.response;
      throw e;
    }
  });
}

export default client;
