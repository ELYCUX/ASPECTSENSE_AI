from functools import wraps
import os
import datetime
from flask import request, jsonify, g
import jwt
from models.user_model import UserModel

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        token = None
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'success': False, 'message': 'Access denied. No token provided.'}), 401

        try:
            jwt_secret = os.environ.get('JWT_SECRET', 'aspect_feedback_jwt_secret_key_2024')
            decoded = jwt.decode(token, jwt_secret, algorithms=['HS256'])
            
            # Fetch fresh user profile from DB to prevent role tampering and enforce real-time status checks
            user = UserModel.find_by_id(decoded.get('id'))
            if not user:
                return jsonify({'success': False, 'message': 'User no longer exists.'}), 401
            
            # Verify account status
            status = user.get('account_status', 'active')
            if status == 'suspended':
                return jsonify({
                    'success': False,
                    'message': 'Account is suspended. Please contact administrator.',
                    'code': 'ACCOUNT_SUSPENDED'
                }), 403

            g.user = user
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Session expired. Please log in again.'}), 403
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': 'Invalid authentication token.'}), 403
        except Exception as e:
            return jsonify({'success': False, 'message': 'Authentication failed.'}), 401

        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Ensure token_required was run or run it
        if not hasattr(g, 'user') or not g.user:
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'success': False, 'message': 'Access denied. No token provided.'}), 401
            try:
                jwt_secret = os.environ.get('JWT_SECRET', 'aspect_feedback_jwt_secret_key_2024')
                decoded = jwt.decode(auth_header.split(' ')[1], jwt_secret, algorithms=['HS256'])
                user = UserModel.find_by_id(decoded.get('id'))
                if not user:
                    return jsonify({'success': False, 'message': 'User not found.'}), 401
                if user.get('account_status') == 'suspended':
                    return jsonify({'success': False, 'message': 'Account is suspended.'}), 403
                g.user = user
            except Exception:
                return jsonify({'success': False, 'message': 'Invalid token.'}), 403

        # Check trusted role from DB
        role = g.user.get('role', '').lower()
        if role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Forbidden. Administrator privileges required.',
                'code': 'FORBIDDEN_ADMIN_REQUIRED'
            }), 403

        return f(*args, **kwargs)
    return decorated


def user_required(f):
    """Ensures caller has a valid, active user account."""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if not g.user:
            return jsonify({'success': False, 'message': 'Authentication required.'}), 401
        return f(*args, **kwargs)
    return decorated
