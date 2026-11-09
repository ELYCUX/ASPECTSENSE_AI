import json
from config.db import execute_query

class ReviewModel:
    @staticmethod
    def find_all(limit=10, offset=0, product_id=None, sentiment=None, search='', user_id=None, is_admin=False):
        params = []
        conditions = []

        if not is_admin and user_id is not None:
            params.append(user_id)
            conditions.append(f"(r.user_id = ${len(params)} OR r.is_shared = TRUE)")

        if product_id:
            params.append(product_id)
            conditions.append(f"r.product_id = ${len(params)}")
        if sentiment:
            params.append(sentiment)
            conditions.append(f"r.sentiment = ${len(params)}")
        if search:
            params.append(f"%{search}%")
            conditions.append(f"(r.body ILIKE ${len(params)} OR r.user_name ILIKE ${len(params)} OR p.name ILIKE ${len(params)} OR p.brand ILIKE ${len(params)})")

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ''
        query = f"""
            SELECT r.*, p.name as product_name, p.category, p.brand
            FROM reviews r
            JOIN products p ON r.product_id = p.id
            {where}
            ORDER BY r.created_at DESC
            LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
        """
        params.extend([limit, offset])
        return execute_query(query, params, fetch_all=True)

    @staticmethod
    def count(product_id=None, sentiment=None, search='', user_id=None, is_admin=False):
        params = []
        conditions = []
        join_clause = ""

        if not is_admin and user_id is not None:
            params.append(user_id)
            conditions.append(f"(r.user_id = ${len(params)} OR r.is_shared = TRUE)")

        if product_id:
            params.append(product_id)
            conditions.append(f"r.product_id = ${len(params)}")
        if sentiment:
            params.append(sentiment)
            conditions.append(f"r.sentiment = ${len(params)}")
        if search:
            params.append(f"%{search}%")
            join_clause = "JOIN products p ON r.product_id = p.id"
            conditions.append(f"(r.body ILIKE ${len(params)} OR r.user_name ILIKE ${len(params)} OR p.name ILIKE ${len(params)} OR p.brand ILIKE ${len(params)})")
        
        where = f"WHERE {' AND '.join(conditions)}" if conditions else ''
        parts = ["SELECT COUNT(*) FROM reviews r"]
        if join_clause:
            parts.append(join_clause)
        if where:
            parts.append(where)
        query = " ".join(parts)
        result = execute_query(query, params, fetch_one=True)
        return int(result['count']) if result else 0

    @staticmethod
    def get_sentiment_counts():
        return execute_query("""
            SELECT sentiment, COUNT(*) as count 
            FROM reviews 
            WHERE sentiment IS NOT NULL 
            GROUP BY sentiment
        """, fetch_all=True)

    @staticmethod
    def get_rating_distribution():
        return execute_query("""
            SELECT rating, COUNT(*) as count 
            FROM reviews 
            WHERE rating IS NOT NULL 
            GROUP BY rating 
            ORDER BY rating ASC
        """, fetch_all=True)

    @staticmethod
    def get_aspect_sentiment_breakdown(product_id=None):
        query = "SELECT aspects FROM reviews WHERE aspects IS NOT NULL"
        params = []
        if product_id:
            query += " AND product_id = $1"
            params.append(product_id)
            
        rows = execute_query(query, params, fetch_all=True)
        aspect_map = {}
        for r in rows:
            aspects = r.get('aspects')
            if isinstance(aspects, str):
                try:
                    aspects = json.loads(aspects)
                except Exception:
                    continue
            
            if isinstance(aspects, dict):
                for aspect, sentiment in aspects.items():
                    if isinstance(sentiment, dict):
                        sentiment = sentiment.get('sentiment', 'neutral')
                    if aspect not in aspect_map:
                        aspect_map[aspect] = {'positive': 0, 'negative': 0, 'neutral': 0}
                    if sentiment in aspect_map[aspect]:
                        aspect_map[aspect][sentiment] += 1
                    
        return [{'aspect': aspect, **counts} for aspect, counts in aspect_map.items()]

    @staticmethod
    def get_reviews_per_month():
        query = """
            SELECT TO_CHAR(created_at, 'Mon') as month, COUNT(*) as count
            FROM reviews
            WHERE created_at >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
            ORDER BY EXTRACT(MONTH FROM created_at)
        """
        return execute_query(query, fetch_all=True)

    @staticmethod
    def get_average_rating():
        result = execute_query('SELECT ROUND(AVG(rating)::numeric, 1) as avg_rating FROM reviews', fetch_one=True)
        if result and result.get('avg_rating') is not None:
            return float(result['avg_rating'])
        return 0.0

    @staticmethod
    def create_review(product_id, user_name, rating, body, sentiment, aspects, source="manual", user_id=None):
        query = """
            INSERT INTO reviews (product_id, user_name, rating, body, sentiment, aspects, source, user_id, is_shared)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)
            RETURNING *
        """
        params = [product_id, user_name, rating, body, sentiment, aspects, source, user_id]
        return execute_query(query, params, fetch_one=True)

    @staticmethod
    def get_all_reviews_for_text():
        query = "SELECT id, body FROM reviews"
        return execute_query(query, fetch_all=True)
