# Save as vibe_recommender.py

import pickle
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import time
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration ---
INDEX_FILE = os.getenv('VIBE_INDEX_FILE', 'book_vibe_index.pkl')
MODEL_NAME = os.getenv('VIBE_MODEL_NAME', 'all-MiniLM-L6-v2')
MAX_QUERY_LENGTH = 500
MIN_RESULTS = 1

# --- Main App Functions ---

def load_data(model_name, index_file):
    """Loads the AI model and the book vibe index."""
    logger.info("Loading AI model...")
    try:
        model = SentenceTransformer(model_name)
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return None, None, None
    
    logger.info(f"Loading book vibe index from {index_file}...")
    try:
        with open(index_file, 'rb') as f:
            index_data = pickle.load(f)
    except FileNotFoundError:
        logger.error(f"ERROR: {index_file} not found. Did you run create_vibe_index.py?")
        return None, None, None
    except Exception as e:
        logger.error(f"Error loading index: {e}")
        return None, None, None

    return model, index_data['embeddings'], index_data['metadata']

def find_top_matches(user_phrase, model, embeddings, metadata, top_n=10):
    """Finds the top N matching book descriptions."""
    # Input validation
    user_phrase = user_phrase.strip()
    if not user_phrase:
        raise ValueError("Query cannot be empty")
    if len(user_phrase) > 500:
        raise ValueError("Query too long (max 500 characters)")
    
    start_time = time.time()
    
    # 1. Create embedding for the user's phrase
    phrase_embedding = model.encode([user_phrase])[0]
    
    # 2. Calculate similarities
    similarities = cosine_similarity([phrase_embedding], embeddings)[0]
    
    # Normalize scores to 0-1 range
    min_sim = similarities.min()
    max_sim = similarities.max()
    if max_sim > min_sim:
        similarities = (similarities - min_sim) / (max_sim - min_sim)
    else:
        similarities = np.clip(similarities, 0, 1)
    
    # 3. Get the indices of the top N descriptions
    top_indices = np.argsort(similarities)[-top_n:][::-1] # Best first
    
    recommendations = []
    for idx in top_indices:
        recommendations.append({
            'title': metadata[idx]['title'],
            'author': metadata[idx]['author'],
            'description': metadata[idx]['description'],
            'score': similarities[idx]
        })
            
    end_time = time.time()
    logger.info(f"Search completed in {end_time - start_time:.2f} seconds")
    return recommendations

# --- Main execution ---
if __name__ == "__main__":
    logger.info("--- Starting AI Book Vibe Recommender ---")
    
    # 1. Load data ONCE at the start
    model, embeddings, metadata = load_data(MODEL_NAME, INDEX_FILE)
    
    if model:
        logger.info("Recommender is ready!")
        logger.info("-" * 50)
        
        # 2. Main app loop
        while True:
            # 3. Ask to exit FIRST
            exit_choice = input("\nDo you want to exit the recommender? (yes/no): ")
            if exit_choice.lower().strip() == 'yes':
                break # This breaks the 'while True' loop and ends the program

            # 4. If 'no', ask how many books
            try:
                user_top_n = int(input("\nHow many recommendations would you like? (e.g., 5, 10, 20): "))
                if user_top_n <= 0:
                    user_top_n = 10
                    logger.info("Invalid number, defaulting to 10.")
            except ValueError:
                user_top_n = 10
                logger.info("Invalid input, defaulting to 10 recommendations.")
            
            # 5. Ask for the phrase
            user_query = input("\nYour phrase: ")
            
            if not user_query.strip():
                logger.info("No phrase entered, please try again.")
                continue
            
            # 6. Find and show matches
            recommendations_list = find_top_matches(user_query, model, embeddings, metadata, top_n=user_top_n)
            
            logger.info(f"Top {len(recommendations_list)} Vibe Matches For: '{user_query}'")
            
            for i, rec in enumerate(recommendations_list):
                # Format score as a percentage (e.g., "85%")
                score_percent = f"{rec['score']:.0%}"
                
                logger.info(f"{i+1}. {rec['title']} by {rec['author']}")
                logger.info(f"   Reason: Its synopsis has a {score_percent} vibe match to your phrase.")
                logger.info(f"   Synopsis: {rec['description'][:200]}...")
            
            logger.info("-" * 50)

    # 7. This is where the program jumps to after breaking the loop
    logger.info("Goodbye!")
    logger.info("--- AI Book Vibe Recommender Complete ---")