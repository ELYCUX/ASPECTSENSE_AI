from config.db import execute_query

class ProductModel:
    @staticmethod
    def find_all(limit=20, offset=0, search='', user_id=None, is_admin=False):
        conditions = []
        params = []

        if not is_admin and user_id is not None:
            params.append(user_id)
            conditions.append(f"(user_id = ${len(params)} OR is_shared = TRUE)")

        if search:
            params.append(f"%{search}%")
            conditions.append(f"(name ILIKE ${len(params)} OR brand ILIKE ${len(params)} OR category ILIKE ${len(params)})")

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ''
        query = f"SELECT * FROM products {where} ORDER BY created_at DESC LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}"
        params.extend([limit, offset])
        return execute_query(query, params, fetch_all=True)

    @staticmethod
    def find_by_id(id):
        return execute_query('SELECT * FROM products WHERE id = $1', [id], fetch_one=True)

    @staticmethod
    def count(search='', user_id=None, is_admin=False):
        conditions = []
        params = []

        if not is_admin and user_id is not None:
            params.append(user_id)
            conditions.append(f"(user_id = ${len(params)} OR is_shared = TRUE)")

        if search:
            params.append(f"%{search}%")
            conditions.append(f"(name ILIKE ${len(params)} OR brand ILIKE ${len(params)} OR category ILIKE ${len(params)})")

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ''
        query = f"SELECT COUNT(*) FROM products {where}"
        result = execute_query(query, params, fetch_one=True)
        return int(result['count']) if result else 0

    @staticmethod
    def create(name, category, brand, price=0.0, description='', image_url='', user_id=None):
        return execute_query(
            '''INSERT INTO products (name, category, brand, price, description, image_url, user_id, is_shared, avg_rating, review_count)
               VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, 0.0, 0)
               RETURNING *''',
            [name, category, brand, price, description, image_url, user_id],
            fetch_one=True
        )
