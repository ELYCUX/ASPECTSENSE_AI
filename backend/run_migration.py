import sys
import os

# Add current dir to path to allow importing config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.db import execute_query

def migrate():
    print("Starting migration...")
    
    query = """
    CREATE TABLE IF NOT EXISTS review_analysis_results (
        id SERIAL PRIMARY KEY,
        review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
        aspect_name VARCHAR(100),
        sentiment VARCHAR(20),
        rule_confidence VARCHAR(20),
        analysis_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
    );
    """
    
    try:
        execute_query(query)
        print("Migration successful! Table review_analysis_results created or verified.")
    except Exception as e:
        print(f"Migration failed: {e}")
        
if __name__ == '__main__':
    migrate()
