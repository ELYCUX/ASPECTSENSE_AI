import datetime
from flask import Blueprint, request, jsonify, g
from middleware.auth import token_required
from config.db import execute_query

notification_bp = Blueprint('notifications', __name__)

@notification_bp.route('/', methods=['GET'])
@token_required
def get_notifications():
    try:
        user_id = g.user['id']
        unread_only = request.args.get('unread', 'false').lower() == 'true'

        query = 'SELECT * FROM user_notifications WHERE user_id = $1'
        params = [user_id]
        if unread_only:
            query += ' AND is_read = FALSE'
        query += ' ORDER BY created_at DESC LIMIT 20'

        notifications = execute_query(query, params, fetch_all=True) or []
        for n in notifications:
            if n.get('created_at') and isinstance(n['created_at'], datetime.datetime):
                n['created_at'] = n['created_at'].isoformat()

        unread_count_res = execute_query(
            'SELECT COUNT(*) FROM user_notifications WHERE user_id = $1 AND is_read = FALSE',
            [user_id], fetch_one=True
        )
        unread_count = int(unread_count_res['count']) if unread_count_res else 0

        return jsonify({
            'success': True,
            'data': {
                'notifications': notifications,
                'unreadCount': unread_count
            }
        }), 200
    except Exception as e:
        print(f"Get Notifications Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to retrieve notifications.'}), 500


@notification_bp.route('/<int:notification_id>/read', methods=['PUT'])
@token_required
def mark_as_read(notification_id):
    try:
        user_id = g.user['id']
        execute_query(
            'UPDATE user_notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
            [notification_id, user_id]
        )
        return jsonify({'success': True, 'message': 'Notification marked as read.'}), 200
    except Exception as e:
        print(f"Mark Read Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to update notification.'}), 500


@notification_bp.route('/read-all', methods=['PUT'])
@token_required
def mark_all_as_read():
    try:
        user_id = g.user['id']
        execute_query(
            'UPDATE user_notifications SET is_read = TRUE WHERE user_id = $1',
            [user_id]
        )
        return jsonify({'success': True, 'message': 'All notifications marked as read.'}), 200
    except Exception as e:
        print(f"Mark All Read Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to update notifications.'}), 500
