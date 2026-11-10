import datetime
import json
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

        filter_clause = "AND is_read = FALSE" if unread_only else ""

        # Single combined query for notifications + unread count
        query = f"""
            SELECT 
                COUNT(*) FILTER (WHERE is_read = FALSE)::int AS unread_count,
                COALESCE(json_agg(n ORDER BY created_at DESC), '[]'::json) AS notifications
            FROM (
                SELECT * FROM user_notifications 
                WHERE user_id = $1 {filter_clause}
                ORDER BY created_at DESC 
                LIMIT 20
            ) n
        """

        res = execute_query(query, [user_id], fetch_one=True) or {}
        unread_count = res.get('unread_count', 0)
        notifications = res.get('notifications', [])
        if isinstance(notifications, str):
            notifications = json.loads(notifications)

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
def mark_all_read():
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
