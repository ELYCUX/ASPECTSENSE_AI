"""
Comprehensive RBAC and Portal Verification Script
Runs all 11 security tests required by the project specifications.
"""
import os
import sys

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from dotenv import load_dotenv
load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from models.user_model import UserModel
from config.db import execute_query
import jwt, datetime

print("=" * 65)
print("ASPECTSENSE AI — ROLE-BASED ACCESS CONTROL (RBAC) TEST SUITE")
print("=" * 65)

client = app.test_client()
jwt_secret = os.environ.get('JWT_SECRET', 'aspect_feedback_jwt_secret_key_2024')

# Fetch real demo and admin users
admin_user = UserModel.find_by_email('admin@aspectai.com')
demo_user = UserModel.find_by_email('demo@aspectai.com')

assert admin_user is not None, "Admin user not found in DB!"
assert demo_user is not None, "Demo user not found in DB!"

print(f"\nLoaded Test Accounts:")
print(f"  Admin: #{admin_user['id']} {admin_user['email']} (role: {admin_user['role']}, status: {admin_user.get('account_status')})")
print(f"  User:  #{demo_user['id']} {demo_user['email']} (role: {demo_user['role']}, status: {demo_user.get('account_status')})")

def make_token(user_id, email, role='user'):
    payload = {
        'id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=2)
    }
    return jwt.encode(payload, jwt_secret, algorithm='HS256')

admin_token = make_token(admin_user['id'], admin_user['email'], 'admin')
user_token = make_token(demo_user['id'], demo_user['email'], 'user')

# -------------------------------------------------------------
# TEST 1: Unauthenticated request to protected endpoint
# -------------------------------------------------------------
print("\n[TEST 1] Unauthenticated request to /api/admin/dashboard...")
res = client.get('/api/admin/dashboard')
print(f"  Status: {res.status_code} (Expected: 401)")
assert res.status_code == 401, "Failed: Unauthenticated request was not blocked with 401!"
print("  --> PASSED! (401 Unauthorized)")

# -------------------------------------------------------------
# TEST 2: Normal user attempts to access Admin Portal API
# -------------------------------------------------------------
print("\n[TEST 2] Normal user requesting /api/admin/dashboard & /api/admin/users...")
res = client.get('/api/admin/dashboard', headers={'Authorization': f'Bearer {user_token}'})
print(f"  /api/admin/dashboard Status: {res.status_code} (Expected: 403)")
assert res.status_code == 403, "Failed: Normal user accessed admin dashboard!"

res2 = client.get('/api/admin/users', headers={'Authorization': f'Bearer {user_token}'})
print(f"  /api/admin/users Status: {res2.status_code} (Expected: 403)")
assert res2.status_code == 403, "Failed: Normal user accessed admin users!"
print("  --> PASSED! (403 Forbidden)")

# -------------------------------------------------------------
# TEST 3: Admin user accesses Admin Portal API
# -------------------------------------------------------------
print("\n[TEST 3] Admin requesting /api/admin/dashboard...")
res = client.get('/api/admin/dashboard', headers={'Authorization': f'Bearer {admin_token}'})
print(f"  Status: {res.status_code} (Expected: 200)")
assert res.status_code == 200, "Failed: Admin could not access admin dashboard!"
body = res.get_json()
print(f"  KPIs Total Users: {body['data']['kpis']['totalUsers']}")
print(f"  KPIs Active Users: {body['data']['kpis']['activeUsers']}")
print(f"  KPIs Total Products: {body['data']['kpis']['totalProducts']}")
print(f"  KPIs Total Reviews: {body['data']['kpis']['totalReviews']}")
print("  --> PASSED! (200 OK with system statistics)")

# -------------------------------------------------------------
# TEST 4: Admin views registered users with metrics
# -------------------------------------------------------------
print("\n[TEST 4] Admin requesting /api/admin/users...")
res = client.get('/api/admin/users', headers={'Authorization': f'Bearer {admin_token}'})
print(f"  Status: {res.status_code} (Expected: 200)")
assert res.status_code == 200, "Failed: Admin could not list users!"
users_list = res.get_json()['data']['users']
print(f"  Retrieved {len(users_list)} registered users with product/review metrics.")
assert len(users_list) > 0
print("  --> PASSED!")

# -------------------------------------------------------------
# TEST 5: User details view
# -------------------------------------------------------------
print(f"\n[TEST 5] Admin viewing User #{demo_user['id']} details...")
res = client.get(f"/api/admin/users/{demo_user['id']}", headers={'Authorization': f'Bearer {admin_token}'})
print(f"  Status: {res.status_code} (Expected: 200)")
assert res.status_code == 200, "Failed to load user details!"
details = res.get_json()['data']
print(f"  User: {details['user']['name']} ({details['user']['email']})")
print(f"  Products associated: {len(details['products'])}")
print(f"  Reviews associated: {len(details['reviews'])}")
print("  --> PASSED!")

# -------------------------------------------------------------
# TEST 6: Account Suspension & Real-time Enforcement
# -------------------------------------------------------------
print(f"\n[TEST 6] Admin suspending user #{demo_user['id']}...")
res = client.put(f"/api/admin/users/{demo_user['id']}/status", 
                 json={'status': 'suspended'}, 
                 headers={'Authorization': f'Bearer {admin_token}'})
print(f"  Suspend Status: {res.status_code} (Expected: 200)")
assert res.status_code == 200

# Verify suspended user is immediately blocked even with previously valid token
res_blocked = client.get('/api/reviews', headers={'Authorization': f'Bearer {user_token}'})
print(f"  Suspended user accessing /api/reviews Status: {res_blocked.status_code} (Expected: 403)")
assert res_blocked.status_code == 403, "Failed: Suspended user was not blocked!"
assert 'suspended' in res_blocked.get_json()['message'].lower()
print("  --> PASSED! (Suspended user immediately blocked with 403)")

# Reactivate the user
print(f"  Reactivating user #{demo_user['id']}...")
res_active = client.put(f"/api/admin/users/{demo_user['id']}/status", 
                        json={'status': 'active'}, 
                        headers={'Authorization': f'Bearer {admin_token}'})
assert res_active.status_code == 200
print("  --> PASSED! (User restored to active)")

# -------------------------------------------------------------
# TEST 7: Self-Demotion & Self-Suspension Prevention
# -------------------------------------------------------------
print("\n[TEST 7] Testing Admin Self-Protection Rules...")
# Admin attempting to suspend oneself
res_self_suspend = client.put(f"/api/admin/users/{admin_user['id']}/status", 
                              json={'status': 'suspended'}, 
                              headers={'Authorization': f'Bearer {admin_token}'})
print(f"  Admin self-suspend Status: {res_self_suspend.status_code} (Expected: 400)")
assert res_self_suspend.status_code == 400, "Failed: Admin was able to suspend themselves!"

# Admin attempting to revoke own role
res_self_demote = client.put(f"/api/admin/users/{admin_user['id']}/role", 
                             json={'role': 'user'}, 
                             headers={'Authorization': f'Bearer {admin_token}'})
print(f"  Admin self-demote Status: {res_self_demote.status_code} (Expected: 400)")
assert res_self_demote.status_code == 400, "Failed: Admin was able to demote themselves!"
print("  --> PASSED! (Self-protection rules enforced)")

# -------------------------------------------------------------
# TEST 8: Admin Activity Audit Trail
# -------------------------------------------------------------
print("\n[TEST 8] Fetching Admin Audit Logs...")
res = client.get('/api/admin/activity-logs', headers={'Authorization': f'Bearer {admin_token}'})
print(f"  Status: {res.status_code} (Expected: 200)")
assert res.status_code == 200
logs = res.get_json()['data']['logs']
print(f"  Found {len(logs)} audit entries in database.")
actions_recorded = [l['action'] for l in logs]
print(f"  Recent Actions: {actions_recorded[:5]}")
assert len(logs) > 0, "No audit logs found!"
print("  --> PASSED! (Audit logging verified)")

# -------------------------------------------------------------
# TEST 9: System Settings Management
# -------------------------------------------------------------
print("\n[TEST 9] Testing System Settings...")
res = client.get('/api/admin/settings', headers={'Authorization': f'Bearer {admin_token}'})
assert res.status_code == 200
settings = res.get_json()['data']['settings']
print(f"  Current App Info: {settings.get('app_info')}")
print(f"  Current Review Limits: {settings.get('review_limits')}")
print("  --> PASSED!")

# -------------------------------------------------------------
# TEST 10: User Notifications Endpoint
# -------------------------------------------------------------
print(f"\n[TEST 10] Testing User Notifications...")
res = client.get('/api/notifications', headers={'Authorization': f'Bearer {user_token}'})
print(f"  Status: {res.status_code} (Expected: 200)")
assert res.status_code == 200
print("  --> PASSED!")

# -------------------------------------------------------------
# TEST 11: User Portal Existing Functionality Preserved
# -------------------------------------------------------------
print("\n[TEST 11] Verifying existing user portal endpoints...")
res_products = client.get('/api/products', headers={'Authorization': f'Bearer {user_token}'})
assert res_products.status_code == 200, "User products failed!"
res_reviews = client.get('/api/reviews', headers={'Authorization': f'Bearer {user_token}'})
assert res_reviews.status_code == 200, "User reviews failed!"
res_dash = client.get('/api/dashboard/stats', headers={'Authorization': f'Bearer {user_token}'})
assert res_dash.status_code == 200, f"User dashboard failed: {res_dash.status_code} {res_dash.data}"
print(f"  User products count: {len(res_products.get_json()['data']['products'])}")
print(f"  User reviews count: {len(res_reviews.get_json()['data']['reviews'])}")
print("  --> PASSED! (All existing user functionality preserved)")

print("\n" + "=" * 65)
print("ALL 11 RBAC & DUAL-PORTAL SECURITY TESTS PASSED SUCCESSFULLY!")
print("=" * 65)
