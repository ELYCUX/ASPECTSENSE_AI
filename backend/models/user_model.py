from config.db import execute_query
import datetime

class UserModel:
    @staticmethod
    def find_by_email(email):
        return execute_query('SELECT * FROM users WHERE email = $1', [email], fetch_one=True)

    @staticmethod
    def find_by_id(id):
        return execute_query(
            'SELECT id, name, email, role, account_status, last_login, created_at, updated_at FROM users WHERE id = $1',
            [id], fetch_one=True
        )

    @staticmethod
    def create(name, email, password_hash, role='user', account_status='active'):
        return execute_query(
            '''INSERT INTO users (name, email, password_hash, role, account_status) 
               VALUES ($1, $2, $3, $4, $5) 
               RETURNING id, name, email, role, account_status, created_at''',
            [name, email, password_hash, role, account_status],
            fetch_one=True
        )

    @staticmethod
    def update_last_login(user_id):
        return execute_query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user_id]
        )

    @staticmethod
    def update_status(user_id, status):
        return execute_query(
            'UPDATE users SET account_status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role, account_status',
            [status, user_id],
            fetch_one=True
        )

    @staticmethod
    def update_role(user_id, role):
        return execute_query(
            'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role, account_status',
            [role, user_id],
            fetch_one=True
        )

    @staticmethod
    def update_profile(user_id, name, email):
        return execute_query(
            'UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, email, role, account_status',
            [name, email, user_id],
            fetch_one=True
        )

    @staticmethod
    def update_password(user_id, password_hash):
        return execute_query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [password_hash, user_id]
        )

    @staticmethod
    def delete(user_id):
        # Nullify user_id references in products, reviews, imports to preserve catalog
        execute_query('UPDATE products SET user_id = NULL WHERE user_id = $1', [user_id])
        execute_query('UPDATE reviews SET user_id = NULL WHERE user_id = $1', [user_id])
        execute_query('UPDATE amazon_imports SET user_id = NULL WHERE user_id = $1', [user_id])
        return execute_query('DELETE FROM users WHERE id = $1', [user_id])

    @staticmethod
    def count(search='', role=None, status=None):
        query = 'SELECT COUNT(*) FROM users WHERE 1=1'
        params = []
        if search:
            params.append(f"%{search}%")
            query += f" AND (name ILIKE ${len(params)} OR email ILIKE ${len(params)})"
        if role:
            params.append(role)
            query += f" AND role = ${len(params)}"
        if status:
            params.append(status)
            query += f" AND account_status = ${len(params)}"
        result = execute_query(query, params, fetch_one=True)
        return int(result['count']) if result else 0

    @staticmethod
    def find_all_with_metrics(limit=20, offset=0, search='', role=None, status=None, sort_by='created_at', sort_dir='DESC'):
        query = '''
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role, 
                COALESCE(u.account_status, 'active') as account_status, 
                u.last_login, 
                u.created_at, 
                u.updated_at,
                (SELECT COUNT(*) FROM products p WHERE p.user_id = u.id) as products_count,
                (SELECT COUNT(*) FROM reviews r WHERE r.user_id = u.id) as reviews_count,
                (SELECT COUNT(*) FROM amazon_imports ai WHERE ai.user_id = u.id) as imports_count
            FROM users u
            WHERE 1=1
        '''
        params = []
        if search:
            params.append(f"%{search}%")
            query += f" AND (u.name ILIKE ${len(params)} OR u.email ILIKE ${len(params)})"
        if role:
            params.append(role)
            query += f" AND u.role = ${len(params)}"
        if status:
            params.append(status)
            query += f" AND u.account_status = ${len(params)}"

        valid_sorts = {'created_at': 'u.created_at', 'name': 'u.name', 'last_login': 'u.last_login'}
        order_col = valid_sorts.get(sort_by, 'u.created_at')
        order_dir = 'ASC' if sort_dir.upper() == 'ASC' else 'DESC'
        query += f" ORDER BY {order_col} {order_dir} LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}"
        params.extend([limit, offset])

        return execute_query(query, params, fetch_all=True)

    @staticmethod
    def get_user_activity_summary(user_id):
        """Fetch complete activity footprint of a user for the User Details page."""
        user = UserModel.find_by_id(user_id)
        if not user:
            return None

        products = execute_query(
            'SELECT id, name, category, brand, created_at FROM products WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
            [user_id], fetch_all=True
        ) or []

        reviews = execute_query(
            '''SELECT r.id, r.product_id, p.name as product_name, r.rating, r.sentiment, r.created_at 
               FROM reviews r 
               LEFT JOIN products p ON r.product_id = p.id 
               WHERE r.user_id = $1 ORDER BY r.created_at DESC LIMIT 10''',
            [user_id], fetch_all=True
        ) or []

        imports = execute_query(
            'SELECT id, asin, marketplace, product_title, imported_count, status, created_at FROM amazon_imports WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
            [user_id], fetch_all=True
        ) or []

        activity_logs = execute_query(
            'SELECT action, description, created_at, ip_address FROM admin_activity_logs WHERE target_id = $1 OR admin_id = $1 ORDER BY created_at DESC LIMIT 15',
            [user_id], fetch_all=True
        ) or []

        return {
            'user': user,
            'products': products,
            'reviews': reviews,
            'imports': imports,
            'activity_logs': activity_logs
        }
