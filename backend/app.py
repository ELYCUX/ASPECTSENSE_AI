import os
import sys
import time

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Import blueprints
from routes.auth_routes import auth_bp
from routes.product_routes import product_bp
from routes.review_routes import review_bp
from routes.dashboard_routes import dashboard_bp
from routes.report_routes import report_bp
from routes.amazon_routes import amazon_bp
from routes.analysis_routes import analysis_bp
from routes.admin_routes import admin_bp
from routes.notification_routes import notification_bp

app = Flask(__name__)
app.url_map.strict_slashes = False
PORT = int(os.environ.get('PORT', 5001))

# CORS Setup
frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
CORS(app, resources={r"/api/*": {"origins": [frontend_url, "http://localhost:5175", "http://localhost:5174"]}}, supports_credentials=True)

# Flask-Caching (simple in-memory; swap to Redis by setting CACHE_TYPE=redis and CACHE_REDIS_URL)
try:
    from flask_caching import Cache
    cache_config = {
        "CACHE_TYPE": os.environ.get("CACHE_TYPE", "SimpleCache"),
        "CACHE_DEFAULT_TIMEOUT": 30,
    }
    redis_url = os.environ.get("REDIS_URL") or os.environ.get("CACHE_REDIS_URL")
    if redis_url and cache_config["CACHE_TYPE"] == "redis":
        cache_config["CACHE_REDIS_URL"] = redis_url
    cache = Cache(app, config=cache_config)
    app.extensions['cache'] = cache
except ImportError:
    pass  # Flask-Caching optional

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(product_bp, url_prefix='/api/products')
app.register_blueprint(review_bp, url_prefix='/api/reviews')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(report_bp, url_prefix='/api/reports')
app.register_blueprint(amazon_bp, url_prefix='/api/amazon')
app.register_blueprint(analysis_bp, url_prefix='/api/analysis')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(notification_bp, url_prefix='/api/notifications')

# Health check
@app.route('/api/health', methods=['GET'])
def health():
    from ai.model_loader import get_model_info
    try:
        model_info = get_model_info()
    except Exception:
        model_info = {"analysis_method": "rule_based"}

    return jsonify({
        'status': 'OK',
        'message': 'AspectSense AI API is running',
        'timestamp': datetime.datetime.utcnow().isoformat() + 'Z',
        'models': model_info
    }), 200

# 404 Handler
@app.errorhandler(404)
def not_found(e):
    return jsonify({'success': False, 'message': 'Route not found'}), 404

# Global Error Handler
@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.error(f"Unhandled Exception: {e}", exc_info=True)
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

if __name__ == '__main__':
    print(f"\n🚀 AspectSense AI Flask API running on http://localhost:{PORT}")
    print(f"📊 Environment: {os.environ.get('NODE_ENV', 'development')}")
    print(f"🗄️  Supabase: {'Connected' if os.environ.get('SUPABASE_HOST') else 'Local fallback'}")
    print(f"🛡️  RBAC: Admin Portal & User Portal Active")
    print(f"🌧️  Rainforest API: {'Configured' if os.environ.get('RAINFOREST_API_KEY') else 'Not configured'}")
    print(f"🤖 LLM Provider: {os.environ.get('SUMMARY_PROVIDER', 'None (extractive summaries)')} ")
    print()
    app.run(host='0.0.0.0', port=PORT, debug=True)
