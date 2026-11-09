import datetime
import os
import bcrypt
import jwt
from flask import Blueprint, request, jsonify, g
from models.user_model import UserModel
from middleware.auth import token_required
from config.db import execute_query

auth_bp = Blueprint('auth', __name__)

def log_admin_activity(admin_id, admin_email, action, target_type=None, target_id=None, description='', metadata=None):
    """Helper to record administrative actions into audit log."""
    try:
        ip = request.remote_addr or request.headers.get('X-Forwarded-For', '')
        execute_query(
            '''INSERT INTO admin_activity_logs (admin_id, admin_email, action, target_type, target_id, description, ip_address, metadata)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)''',
            [admin_id, admin_email, action, target_type, target_id, description, ip, metadata]
        )
    except Exception as e:
        print(f"Failed to log admin activity: {e}")

def generate_token(user):
    expires_in_str = os.environ.get('JWT_EXPIRES_IN', '7d')
    days = 7
    if expires_in_str.endswith('d'):
        try:
            days = int(expires_in_str[:-1])
        except ValueError:
            pass
            
    payload = {
        'id': user['id'],
        'email': user['email'],
        'role': user.get('role', 'user'),
        'account_status': user.get('account_status', 'active'),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=days)
    }
    jwt_secret = os.environ.get('JWT_SECRET', 'aspect_feedback_jwt_secret_key_2024')
    return jwt.encode(payload, jwt_secret, algorithm='HS256')

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.json or {}
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not name or not email or not password:
            return jsonify({'success': False, 'message': 'Name, email, and password are required.'}), 400
        if len(password) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters.'}), 400

        existing = UserModel.find_by_email(email)
        if existing:
            return jsonify({'success': False, 'message': 'Email already registered.'}), 409

        # Hash password securely
        salt = bcrypt.gensalt(rounds=12)
        password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        # New users are always standard role 'user' and 'active'
        user = UserModel.create(name=name, email=email, password_hash=password_hash, role='user', account_status='active')
        
        if 'created_at' in user and isinstance(user['created_at'], datetime.datetime):
            user['created_at'] = user['created_at'].isoformat()
            
        token = generate_token(user)

        return jsonify({
            'success': True,
            'message': 'Registration successful.',
            'data': {'user': user, 'token': token}
        }), 201
    except Exception as e:
        print('Register Error:', e)
        return jsonify({'success': False, 'message': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json or {}
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required.'}), 400

        user = UserModel.find_by_email(email)
        if not user:
            return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401

        # Check account status BEFORE password verification to prevent brute forcing suspended accounts
        status = user.get('account_status', 'active')
        if status == 'suspended':
            return jsonify({
                'success': False,
                'message': 'Account is suspended. Please contact administrator.',
                'code': 'ACCOUNT_SUSPENDED'
            }), 403

        is_match = bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8'))
        if not is_match:
            return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401

        # Update last login timestamp
        UserModel.update_last_login(user['id'])

        # Record admin login in audit logs
        if user.get('role') == 'admin':
            log_admin_activity(
                admin_id=user['id'],
                admin_email=user['email'],
                action='ADMIN_LOGIN',
                description=f"Administrator {user['name']} logged in"
            )

        token = generate_token(user)
        
        user_data = {k: v for k, v in user.items() if k != 'password_hash'}
        if 'created_at' in user_data and isinstance(user_data['created_at'], datetime.datetime):
            user_data['created_at'] = user_data['created_at'].isoformat()
        if 'last_login' in user_data and isinstance(user_data['last_login'], datetime.datetime):
            user_data['last_login'] = user_data['last_login'].isoformat()

        return jsonify({
            'success': True,
            'message': 'Login successful.',
            'data': {'user': user_data, 'token': token}
        }), 200
    except Exception as e:
        print('Login Error:', e)
        return jsonify({'success': False, 'message': 'Login failed. Please try again.'}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_me():
    try:
        # g.user is already fetched freshly and verified by @token_required
        user = dict(g.user)
        user.pop('password_hash', None)
        
        for k in ['created_at', 'updated_at', 'last_login']:
            if k in user and isinstance(user[k], datetime.datetime):
                user[k] = user[k].isoformat()
            
        return jsonify({'success': True, 'data': {'user': user}}), 200
    except Exception as e:
        print('GetMe Error:', e)
        return jsonify({'success': False, 'message': 'Failed to fetch user.'}), 500
