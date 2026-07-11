# Save as process_descriptions.py

import pandas as pd
import json
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# --- Configuration ---
CSV_FILE_PATH = os.getenv('BOOKS_CSV_PATH', 'books_1.Best_Books_Ever.csv')
OUTPUT_JSON = os.getenv('OUTPUT_JSON', 'book_descriptions.json')

# --- Main execution ---
if __name__ == "__main__":
    logger.info("--- Starting Book Description Processing ---")
    
    book_database = []

    if not os.path.exists(CSV_FILE_PATH):
        logger.error(f"File not found: {CSV_FILE_PATH}")
        logger.info("Please ensure CSV_FILE_PATH environment variable or 'books_1.Best_Books_Ever.csv' is available.")
        exit(1)

    try:
        logger.info(f"Reading {CSV_FILE_PATH}...")
        df = pd.read_csv(CSV_FILE_PATH, encoding='utf-8', on_bad_lines='skip')

        # Check for required columns
        required_cols = ['title', 'author', 'description']
        missing_cols = [col for col in required_cols if col not in df.columns]
        
        if missing_cols:
            logger.error(f"CSV file missing columns: {missing_cols}")
            exit(1)
            
        # Clean data
        df_clean = df[required_cols].dropna()
        book_database = df_clean.to_dict('records')
                
        if book_database:
            with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
                json.dump(book_database, f, indent=2)
                
            logger.info(f"SUCCESS! Extracted {len(book_database)} book descriptions.")
            logger.info(f"All data saved to {OUTPUT_JSON}")
        else:
            logger.error("No book data was processed from the CSV.")
            exit(1)

    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        exit(1)

    logger.info("--- Book Description Processing Complete ---")