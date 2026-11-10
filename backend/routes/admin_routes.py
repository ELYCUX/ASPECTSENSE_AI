import math
import datetime
from flask import Blueprint, request, jsonify, g
from middleware.auth import token_required, admin_required, invalidate_user_cache
from models.user_model import UserModel
from config.db import execute_query

admin_bp = Blueprint('admin', __name__)

# Apply token_required and admin_required to ALL routes in this blueprint
@admin_bp.before_request
@token_required
@admin_required
def check_admin_access():
    pass

def log_activity(action, target_type=None, target_id=None, description='', metadata=None):
    """Record an action in the audit log table."""
    try:
        ip = request.remote_addr or request.headers.get('X-Forwarded-For', '')
        admin_id = g.user.get('id') if hasattr(g, 'user') else None
        admin_email = g.user.get('email') if hasattr(g, 'user') else None
        execute_query(
            '''INSERT INTO admin_activity_logs 
               (admin_id, admin_email, action, target_type, target_id, description, ip_address, metadata)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)''',
            [admin_id, admin_email, action, target_type, target_id, description, ip, metadata]
        )
    except Exception as e:
        print(f"Failed to log admin activity: {e}")

# ============================================================
# 1. ADMIN DASHBOARD STATS
# ============================================================
_admin_dashboard_cache = {}
ADMIN_CACHE_TTL = 30  # seconds

def get_cached_admin_dashboard():
    entry = _admin_dashboard_cache.get('stats')
    if entry and (datetime.datetime.utcnow() - entry['ts']).total_seconds() < ADMIN_CACHE_TTL:
        return entry['data']
    return None

def set_cached_admin_dashboard(data):
    _admin_dashboard_cache['stats'] = {'data': data, 'ts': datetime.datetime.utcnow()}

def invalidate_admin_cache():
    _admin_dashboard_cache.clear()

@admin_bp.route('/dashboard', methods=['GET'])
def get_admin_dashboard():
    try:
        # Check cache
        force_refresh = request.args.get('refresh') == 'true'
        if not force_refresh:
            cached = get_cached_admin_dashboard()
            if cached:
                return jsonify({'success': True, 'data': cached, 'cached': True}), 200

        # Execute single optimized aggregate query — combines 7 sequential queries into 1 round-trip
        query = '''
        SELECT json_build_object(
            'user_stats', (
                SELECT json_build_object(
                    'total_users', COUNT(*),
                    'active_users', COUNT(*) FILTER (WHERE account_status = 'active'),
                    'suspended_users', COUNT(*) FILTER (WHERE account_status = 'suspended'),
                    'admin_users', COUNT(*) FILTER (WHERE role = 'admin')
                ) FROM users
            ),
            'content_stats', (
                SELECT json_build_object(
                    'total_products', (SELECT COUNT(*) FROM products),
                    'total_reviews', (SELECT COUNT(*) FROM reviews),
                    'imported_reviews', (SELECT COUNT(*) FROM reviews WHERE source IN ('amazon', 'amazon_import', 'rainforest_amazon')),
                    'analyzed_reviews', (SELECT COUNT(*) FROM reviews WHERE analysis_method IS NOT NULL),
                    'total_imports', (SELECT COUNT(*) FROM amazon_imports),
                    'pending_jobs', (SELECT COUNT(*) FROM analysis_jobs WHERE status = 'pending'),
                    'failed_jobs', (SELECT COUNT(*) FROM analysis_jobs WHERE status = 'failed')
                )
            ),
            'recent_users', (
                SELECT COALESCE(json_agg(u), '[]'::json) FROM (
                    SELECT id, name, email, role, account_status, created_at, last_login 
                    FROM users ORDER BY created_at DESC LIMIT 5
                ) u
            ),
            'recent_imports', (
                SELECT COALESCE(json_agg(i), '[]'::json) FROM (
                    SELECT id, asin, marketplace, product_title, imported_count, status, created_at 
                    FROM amazon_imports ORDER BY created_at DESC LIMIT 5
                ) i
            ),
            'recent_logs', (
                SELECT COALESCE(json_agg(l), '[]'::json) FROM (
                    SELECT id, admin_email, action, target_type, target_id, description, ip_address, created_at 
                    FROM admin_activity_logs ORDER BY created_at DESC LIMIT 8
                ) l
            ),
            'growth_data', (
                SELECT COALESCE(json_agg(g), '[]'::json) FROM (
                    SELECT DATE(created_at) as date, COUNT(*) as count 
                    FROM users 
                    WHERE created_at >= NOW() - INTERVAL '30 days'
                    GROUP BY DATE(created_at) ORDER BY date ASC
                ) g
            ),
            'categories', (
                SELECT COALESCE(json_agg(c), '[]'::json) FROM (
                    SELECT category, COUNT(*) as count 
                    FROM products 
                    WHERE category IS NOT NULL 
                    GROUP BY category ORDER BY count DESC LIMIT 6
                ) c
            )
        ) AS dashboard_data;
        '''

        row = execute_query(query, fetch_one=True)
        raw_data = row.get('dashboard_data', {}) if row else {}
        if isinstance(raw_data, str):
            import json
            raw_data = json.loads(raw_data)

        user_stats = raw_data.get('user_stats') or {}
        content_stats = raw_data.get('content_stats') or {}
        recent_users = raw_data.get('recent_users') or []
        recent_imports = raw_data.get('recent_imports') or []
        recent_logs = raw_data.get('recent_logs') or []
        growth_data = raw_data.get('growth_data') or []
        categories = raw_data.get('categories') or []

        # Format dates
        for item in recent_users:
            if item.get('created_at') and isinstance(item['created_at'], datetime.datetime):
                item['created_at'] = item['created_at'].isoformat()
            if item.get('last_login') and isinstance(item['last_login'], datetime.datetime):
                item['last_login'] = item['last_login'].isoformat()

        for item in recent_imports:
            if item.get('created_at') and isinstance(item['created_at'], datetime.datetime):
                item['created_at'] = item['created_at'].isoformat()

        for item in recent_logs:
            if item.get('created_at') and isinstance(item['created_at'], datetime.datetime):
                item['created_at'] = item['created_at'].isoformat()

        for item in growth_data:
            if item.get('date'):
                item['date'] = str(item['date'])

        result = {
            'kpis': {
                'totalUsers': int(user_stats.get('total_users', 0)),
                'activeUsers': int(user_stats.get('active_users', 0)),
                'suspendedUsers': int(user_stats.get('suspended_users', 0)),
                'adminUsers': int(user_stats.get('admin_users', 0)),
                'totalProducts': int(content_stats.get('total_products', 0)),
                'totalReviews': int(content_stats.get('total_reviews', 0)),
                'importedReviews': int(content_stats.get('imported_reviews', 0)),
                'analyzedReviews': int(content_stats.get('analyzed_reviews', 0)),
                'totalImports': int(content_stats.get('total_imports', 0)),
                'pendingJobs': int(content_stats.get('pending_jobs', 0)),
                'failedJobs': int(content_stats.get('failed_jobs', 0))
            },
            'recentUsers': recent_users,
            'recentImports': recent_imports,
            'recentLogs': recent_logs,
            'growthData': growth_data,
            'categories': categories
        }

        set_cached_admin_dashboard(result)
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        print(f"Admin Dashboard Error: {e}")
        return jsonify({'success': False, 'message': f'Failed to fetch admin statistics: {str(e)}'}), 500

@admin_bp.route('/users', methods=['GET'])
def get_users():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 15))
        offset = (page - 1) * limit
        search = request.args.get('search', '').strip()
        role = request.args.get('role', '').strip() or None
        status = request.args.get('status', '').strip() or None
        sort_by = request.args.get('sortBy', 'created_at')
        sort_dir = request.args.get('sortDir', 'DESC')

        users = UserModel.find_all_with_metrics(
            limit=limit, offset=offset, search=search,
            role=role, status=status, sort_by=sort_by, sort_dir=sort_dir
        )
        total = UserModel.count(search=search, role=role, status=status)

        for u in users:
            for k in ['created_at', 'updated_at', 'last_login']:
                if u.get(k) and isinstance(u[k], datetime.datetime):
                    u[k] = u[k].isoformat()

        return jsonify({
            'success': True,
            'data': {
                'users': users,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'totalPages': math.ceil(total / limit) if total > 0 else 1
                }
            }
        }), 200
    except Exception as e:
        print(f"Admin Get Users Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to retrieve users.'}), 500


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user_details(user_id):
    try:
        details = UserModel.get_user_activity_summary(user_id)
        if not details or not details.get('user'):
            return jsonify({'success': False, 'message': 'User not found.'}), 404

        # Clean timestamps
        user = dict(details['user'])
        user.pop('password_hash', None)
        for k in ['created_at', 'updated_at', 'last_login']:
            if user.get(k) and isinstance(user[k], datetime.datetime):
                user[k] = user[k].isoformat()
        details['user'] = user

        for p in details.get('products', []):
            if p.get('created_at') and isinstance(p['created_at'], datetime.datetime):
                p['created_at'] = p['created_at'].isoformat()

        for r in details.get('reviews', []):
            if r.get('created_at') and isinstance(r['created_at'], datetime.datetime):
                r['created_at'] = r['created_at'].isoformat()

        for i in details.get('imports', []):
            if i.get('created_at') and isinstance(i['created_at'], datetime.datetime):
                i['created_at'] = i['created_at'].isoformat()

        for l in details.get('activity_logs', []):
            if l.get('created_at') and isinstance(l['created_at'], datetime.datetime):
                l['created_at'] = l['created_at'].isoformat()

        return jsonify({'success': True, 'data': details}), 200
    except Exception as e:
        print(f"Admin User Details Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to load user details.'}), 500


@admin_bp.route('/users/<int:user_id>/status', methods=['PUT'])
def update_user_status(user_id):
    try:
        data = request.json or {}
        new_status = data.get('status', '').lower()

        if new_status not in ['active', 'suspended', 'pending']:
            return jsonify({'success': False, 'message': 'Status must be active, suspended, or pending.'}), 400

        # Safety check: Administrator cannot suspend themselves
        if user_id == g.user['id'] and new_status == 'suspended':
            return jsonify({'success': False, 'message': 'You cannot suspend your own administrative account.'}), 400

        target_user = UserModel.find_by_id(user_id)
        if not target_user:
            return jsonify({'success': False, 'message': 'User not found.'}), 404

        updated = UserModel.update_status(user_id, new_status); invalidate_user_cache(user_id); invalidate_admin_cache()

        action_name = 'USER_SUSPENDED' if new_status == 'suspended' else 'USER_ACTIVATED'
        log_activity(
            action=action_name,
            target_type='user',
            target_id=user_id,
            description=f"Admin {g.user['email']} changed status of user {target_user['email']} from {target_user.get('account_status')} to {new_status}"
        )

        return jsonify({
            'success': True,
            'message': f"User account has been {new_status}.",
            'data': {'user': updated}
        }), 200
    except Exception as e:
        print(f"Update Status Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to update user status.'}), 500


@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
def update_user_role(user_id):
    try:
        data = request.json or {}
        new_role = data.get('role', '').lower()

        if new_role not in ['admin', 'user', 'analyst']:
            return jsonify({'success': False, 'message': 'Role must be admin, user, or analyst.'}), 400

        # Prevent admin from demoting themselves
        if user_id == g.user['id'] and new_role != 'admin':
            return jsonify({'success': False, 'message': 'You cannot revoke your own administrator role.'}), 400

        target_user = UserModel.find_by_id(user_id)
        if not target_user:
            return jsonify({'success': False, 'message': 'User not found.'}), 404

        updated = UserModel.update_role(user_id, new_role); invalidate_user_cache(user_id); invalidate_admin_cache()

        log_activity(
            action='ROLE_CHANGED',
            target_type='user',
            target_id=user_id,
            description=f"Admin {g.user['email']} changed role of user {target_user['email']} to {new_role}"
        )

        return jsonify({
            'success': True,
            'message': f"User role updated to {new_role}.",
            'data': {'user': updated}
        }), 200
    except Exception as e:
        print(f"Update Role Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to update user role.'}), 500


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user_profile(user_id):
    try:
        data = request.json or {}
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()

        if not name or not email:
            return jsonify({'success': False, 'message': 'Name and email are required.'}), 400

        target = UserModel.find_by_id(user_id)
        if not target:
            return jsonify({'success': False, 'message': 'User not found.'}), 404

        # Check if email is already taken by another user
        if email != target['email']:
            existing = UserModel.find_by_email(email)
            if existing and existing['id'] != user_id:
                return jsonify({'success': False, 'message': 'Email is already in use by another account.'}), 409

        updated = UserModel.update_profile(user_id, name, email)

        log_activity(
            action='USER_UPDATED',
            target_type='user',
            target_id=user_id,
            description=f"Admin {g.user['email']} edited profile of user {email}"
        )

        return jsonify({
            'success': True,
            'message': 'User profile updated successfully.',
            'data': {'user': updated}
        }), 200
    except Exception as e:
        print(f"Edit User Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to update user profile.'}), 500


@admin_bp.route('/users/<int:user_id>/reset-password', methods=['POST'])
def send_password_reset(user_id):
    try:
        target = UserModel.find_by_id(user_id)
        if not target:
            return jsonify({'success': False, 'message': 'User not found.'}), 404

        log_activity(
            action='PASSWORD_RESET_INITIATED',
            target_type='user',
            target_id=user_id,
            description=f"Password reset initiated for user {target['email']} by admin {g.user['email']}"
        )

        return jsonify({
            'success': True,
            'message': f"Password reset instructions have been dispatched to {target['email']}."
        }), 200
    except Exception as e:
        print(f"Reset Password Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to process password reset.'}), 500


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        if user_id == g.user['id']:
            return jsonify({'success': False, 'message': 'You cannot delete your own administrative account.'}), 400

        target = UserModel.find_by_id(user_id)
        if not target:
            return jsonify({'success': False, 'message': 'User not found.'}), 404

        UserModel.delete(user_id)

        log_activity(
            action='USER_DELETED',
            target_type='user',
            target_id=user_id,
            description=f"Admin {g.user['email']} deleted account of user {target['email']}"
        )

        return jsonify({
            'success': True,
            'message': f"User {target['email']} deleted successfully."
        }), 200
    except Exception as e:
        print(f"Delete User Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to delete user.'}), 500


# ============================================================
# 3. ADMIN ACTIVITY LOGS
# ============================================================
@admin_bp.route('/activity-logs', methods=['GET'])
def get_activity_logs():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        offset = (page - 1) * limit
        action = request.args.get('action', '').strip()
        search = request.args.get('search', '').strip()

        query = 'SELECT * FROM admin_activity_logs WHERE 1=1'
        count_query = 'SELECT COUNT(*) FROM admin_activity_logs WHERE 1=1'
        params = []

        if action:
            params.append(action)
            query += f" AND action = ${len(params)}"
            count_query += f" AND action = ${len(params)}"
        if search:
            params.append(f"%{search}%")
            query += f" AND (description ILIKE ${len(params)} OR admin_email ILIKE ${len(params)})"
            count_query += f" AND (description ILIKE ${len(params)} OR admin_email ILIKE ${len(params)})"

        total_res = execute_query(count_query, params, fetch_one=True)
        total = int(total_res['count']) if total_res else 0

        query += f" ORDER BY created_at DESC LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}"
        params.extend([limit, offset])

        logs = execute_query(query, params, fetch_all=True) or []

        for log in logs:
            if log.get('created_at') and isinstance(log['created_at'], datetime.datetime):
                log['created_at'] = log['created_at'].isoformat()

        return jsonify({
            'success': True,
            'data': {
                'logs': logs,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'totalPages': math.ceil(total / limit) if total > 0 else 1
                }
            }
        }), 200
    except Exception as e:
        print(f"Activity Logs Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch activity logs.'}), 500


# ============================================================
# 4. SYSTEM SETTINGS
# ============================================================
@admin_bp.route('/settings', methods=['GET'])
def get_system_settings():
    try:
        settings = execute_query('SELECT * FROM system_settings ORDER BY id ASC', fetch_all=True) or []
        settings_map = {}
        for s in settings:
            settings_map[s['key']] = s['value']

        return jsonify({
            'success': True,
            'data': {
                'settings': settings_map,
                'raw': settings
            }
        }), 200
    except Exception as e:
        print(f"Get Settings Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to retrieve system settings.'}), 500


@admin_bp.route('/settings', methods=['PUT'])
def update_system_settings():
    try:
        data = request.json or {}
        key = data.get('key')
        value = data.get('value')

        if not key or value is None:
            return jsonify({'success': False, 'message': 'Key and value are required.'}), 400

        execute_query(
            '''INSERT INTO system_settings (key, value, updated_by, updated_at)
               VALUES ($1, $2, $3, NOW())
               ON CONFLICT (key) DO UPDATE 
               SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()''',
            [key, value, g.user['id']]
        )

        log_activity(
            action='CONFIGURATION_CHANGED',
            target_type='setting',
            description=f"Admin {g.user['email']} updated configuration key: {key}"
        )

        return jsonify({'success': True, 'message': f'Setting {key} updated successfully.'}), 200
    except Exception as e:
        print(f"Update Settings Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to update system setting.'}), 500


# ============================================================
# 5. ADMIN CONTENT & JOB MANAGEMENT
# ============================================================
@admin_bp.route('/products', methods=['GET'])
def get_all_products_admin():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        offset = (page - 1) * limit
        search = request.args.get('search', '').strip()

        query = '''
            SELECT 
                p.*, 
                u.name as owner_name, 
                u.email as owner_email,
                (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as review_count
            FROM products p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE 1=1
        '''
        params = []
        if search:
            params.append(f"%{search}%")
            query += f" AND (p.name ILIKE ${len(params)} OR p.brand ILIKE ${len(params)} OR p.category ILIKE ${len(params)})"

        total_res = execute_query(f"SELECT COUNT(*) FROM products p WHERE 1=1 {' AND (p.name ILIKE $1 OR p.brand ILIKE $1 OR p.category ILIKE $1)' if search else ''}", [f"%{search}%"] if search else [], fetch_one=True)
        total = int(total_res['count']) if total_res else 0

        query += f" ORDER BY p.created_at DESC LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}"
        params.extend([limit, offset])

        products = execute_query(query, params, fetch_all=True) or []

        for p in products:
            if p.get('price') is not None: p['price'] = float(p['price'])
            if p.get('avg_rating') is not None: p['avg_rating'] = float(p['avg_rating'])
            if p.get('created_at') and isinstance(p['created_at'], datetime.datetime):
                p['created_at'] = p['created_at'].isoformat()

        return jsonify({
            'success': True,
            'data': {
                'products': products,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'totalPages': math.ceil(total / limit) if total > 0 else 1
                }
            }
        }), 200
    except Exception as e:
        print(f"Admin Products Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to retrieve products.'}), 500


@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product_admin(product_id):
    try:
        product = execute_query('SELECT * FROM products WHERE id = $1', [product_id], fetch_one=True)
        if not product:
            return jsonify({'success': False, 'message': 'Product not found.'}), 404

        # Delete reviews, summaries, imports, then product
        execute_query('DELETE FROM reviews WHERE product_id = $1', [product_id])
        execute_query('DELETE FROM ai_summaries WHERE product_id = $1', [product_id])
        execute_query('DELETE FROM amazon_imports WHERE product_id = $1', [product_id])
        execute_query('DELETE FROM products WHERE id = $1', [product_id])

        log_activity(
            action='PRODUCT_DELETED',
            target_type='product',
            target_id=product_id,
            description=f"Admin {g.user['email']} deleted product '{product['name']}' and associated reviews"
        )

        return jsonify({'success': True, 'message': f"Product '{product['name']}' deleted successfully."}), 200
    except Exception as e:
        print(f"Admin Delete Product Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to delete product.'}), 500


@admin_bp.route('/reviews', methods=['GET'])
def get_all_reviews_admin():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        offset = (page - 1) * limit
        search = request.args.get('search', '').strip()
        sentiment = request.args.get('sentiment', '').strip()

        query = '''
            SELECT r.*, p.name as product_name, u.name as user_name_owner, u.email as user_email_owner
            FROM reviews r
            LEFT JOIN products p ON r.product_id = p.id
            LEFT JOIN users u ON r.user_id = u.id
            WHERE 1=1
        '''
        params = []
        if sentiment:
            params.append(sentiment)
            query += f" AND r.sentiment = ${len(params)}"
        if search:
            params.append(f"%{search}%")
            query += f" AND (r.body ILIKE ${len(params)} OR r.user_name ILIKE ${len(params)} OR p.name ILIKE ${len(params)})"

        total_res = execute_query(f"SELECT COUNT(*) FROM reviews r LEFT JOIN products p ON r.product_id = p.id WHERE 1=1 {' AND r.sentiment = $1' if sentiment else ''} {' AND (r.body ILIKE $2 OR r.user_name ILIKE $2 OR p.name ILIKE $2)' if (sentiment and search) else (' AND (r.body ILIKE $1 OR r.user_name ILIKE $1 OR p.name ILIKE $1)' if search else '')}", params, fetch_one=True)
        total = int(total_res['count']) if total_res else 0

        query += f" ORDER BY r.created_at DESC LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}"
        params.extend([limit, offset])

        reviews = execute_query(query, params, fetch_all=True) or []

        for r in reviews:
            if r.get('created_at') and isinstance(r['created_at'], datetime.datetime):
                r['created_at'] = r['created_at'].isoformat()

        return jsonify({
            'success': True,
            'data': {
                'reviews': reviews,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'totalPages': math.ceil(total / limit) if total > 0 else 1
                }
            }
        }), 200
    except Exception as e:
        print(f"Admin Reviews Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to retrieve reviews.'}), 500


@admin_bp.route('/reviews/<int:review_id>', methods=['DELETE'])
def delete_review_admin(review_id):
    try:
        rev = execute_query('SELECT * FROM reviews WHERE id = $1', [review_id], fetch_one=True)
        if not rev:
            return jsonify({'success': False, 'message': 'Review not found.'}), 404

        execute_query('DELETE FROM reviews WHERE id = $1', [review_id])

        log_activity(
            action='REVIEW_DELETED',
            target_type='review',
            target_id=review_id,
            description=f"Admin {g.user['email']} deleted review ID #{review_id}"
        )

        return jsonify({'success': True, 'message': 'Review deleted successfully.'}), 200
    except Exception as e:
        print(f"Admin Delete Review Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to delete review.'}), 500


@admin_bp.route('/imports', methods=['GET'])
def get_all_imports_admin():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        offset = (page - 1) * limit

        imports = execute_query(
            '''SELECT ai.*, u.name as imported_by_name, u.email as imported_by_email 
               FROM amazon_imports ai 
               LEFT JOIN users u ON ai.user_id = u.id 
               ORDER BY ai.created_at DESC 
               LIMIT $1 OFFSET $2''',
            [limit, offset], fetch_all=True
        ) or []

        total_res = execute_query('SELECT COUNT(*) FROM amazon_imports', fetch_one=True)
        total = int(total_res['count']) if total_res else 0

        for imp in imports:
            if imp.get('created_at') and isinstance(imp['created_at'], datetime.datetime):
                imp['created_at'] = imp['created_at'].isoformat()

        return jsonify({
            'success': True,
            'data': {
                'imports': imports,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'totalPages': math.ceil(total / limit) if total > 0 else 1
                }
            }
        }), 200
    except Exception as e:
        print(f"Admin Imports Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to retrieve Amazon imports.'}), 500


@admin_bp.route('/ai-jobs', methods=['GET'])
def get_ai_jobs_admin():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        offset = (page - 1) * limit

        jobs = execute_query(
            '''SELECT aj.*, p.name as product_name 
               FROM analysis_jobs aj 
               LEFT JOIN products p ON aj.product_id = p.id 
               ORDER BY aj.created_at DESC 
               LIMIT $1 OFFSET $2''',
            [limit, offset], fetch_all=True
        ) or []

        total_res = execute_query('SELECT COUNT(*) FROM analysis_jobs', fetch_one=True)
        total = int(total_res['count']) if total_res else 0

        for j in jobs:
            if j.get('created_at') and isinstance(j['created_at'], datetime.datetime):
                j['created_at'] = j['created_at'].isoformat()
            if j.get('updated_at') and isinstance(j['updated_at'], datetime.datetime):
                j['updated_at'] = j['updated_at'].isoformat()

        return jsonify({
            'success': True,
            'data': {
                'jobs': jobs,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'totalPages': math.ceil(total / limit) if total > 0 else 1
                }
            }
        }), 200
    except Exception as e:
        print(f"Admin AI Jobs Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to retrieve AI processing jobs.'}), 500
