import os
import requests
import random
import string

BASE_URL = "http://localhost:5000/api"

def get_random_string(length=8):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

def run_tests():
    print("Testing AspectAI Flask API...")
    
    # 1. Health check
    try:
        r = requests.get(f"{BASE_URL}/health")
        print(f"Health Check: Status {r.status_code}, Body: {r.json()}")
        assert r.status_code == 200
        assert r.json().get('status') == 'OK'
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return

    # 2. Register user
    email = f"test_{get_random_string()}@example.com"
    password = "password123"
    name = "Test User"
    
    print(f"\nRegistering new user: {email}...")
    try:
        r = requests.post(f"{BASE_URL}/auth/register", json={
            "name": name,
            "email": email,
            "password": password
        })
        print(f"Register: Status {r.status_code}, Body: {r.json()}")
        assert r.status_code == 201
        assert r.json().get('success') is True
        token = r.json()['data']['token']
    except Exception as e:
        print(f"❌ Registration failed: {e}")
        return

    # 3. Register same user (should fail with 409)
    print("\nRegistering duplicates...")
    try:
        r = requests.post(f"{BASE_URL}/auth/register", json={
            "name": name,
            "email": email,
            "password": password
        })
        print(f"Register Duplicate: Status {r.status_code}, Body: {r.json()}")
        assert r.status_code == 409
        assert r.json().get('success') is False
    except Exception as e:
        print(f"❌ Duplicate registration validation failed: {e}")
        return

    # 4. Login
    print("\nLogging in user...")
    try:
        r = requests.post(f"{BASE_URL}/auth/login", json={
            "email": email,
            "password": password
        })
        print(f"Login: Status {r.status_code}, Body: {r.json()}")
        assert r.status_code == 200
        assert r.json().get('success') is True
        token = r.json()['data']['token']
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 5. Get Me
    print("\nRequesting /auth/me...")
    try:
        r = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"Me: Status {r.status_code}, Body: {r.json()}")
        assert r.status_code == 200
        assert r.json().get('success') is True
        assert r.json()['data']['user']['email'] == email
    except Exception as e:
        print(f"❌ /auth/me failed: {e}")
        return

    # 6. Fetch products
    print("\nFetching products...")
    try:
        r = requests.get(f"{BASE_URL}/products", headers=headers)
        products_data = r.json()
        print(f"Products: Status {r.status_code}, Total: {products_data['data']['pagination']['total']}")
        assert r.status_code == 200
        assert products_data.get('success') is True
        assert len(products_data['data']['products']) > 0
        product_id = products_data['data']['products'][0]['id']
    except Exception as e:
        print(f"❌ Fetch products failed: {e}")
        return

    # 7. Fetch single product
    print(f"\nFetching product {product_id}...")
    try:
        r = requests.get(f"{BASE_URL}/products/{product_id}", headers=headers)
        print(f"Product: Status {r.status_code}, Name: {r.json()['data']['product']['name']}")
        assert r.status_code == 200
        assert r.json().get('success') is True
    except Exception as e:
        print(f"❌ Fetch single product failed: {e}")
        return

    # 8. Fetch reviews
    print("\nFetching reviews...")
    try:
        r = requests.get(f"{BASE_URL}/reviews", headers=headers)
        reviews_data = r.json()
        print(f"Reviews: Status {r.status_code}, Total: {reviews_data['data']['pagination']['total']}")
        assert r.status_code == 200
        assert reviews_data.get('success') is True
    except Exception as e:
        print(f"❌ Fetch reviews failed: {e}")
        return

    # 9. Fetch aspect sentiment
    print("\nFetching aspect-sentiment...")
    try:
        r = requests.get(f"{BASE_URL}/reviews/aspect-sentiment", headers=headers)
        print(f"Aspect Sentiment: Status {r.status_code}, Count: {len(r.json()['data'])}")
        assert r.status_code == 200
    except Exception as e:
        print(f"❌ Fetch aspect sentiment failed: {e}")
        return

    # 10. Fetch distributions
    print("\nFetching reviews distribution...")
    try:
        r = requests.get(f"{BASE_URL}/reviews/distribution", headers=headers)
        dist_data = r.json()
        print(f"Distribution: Status {r.status_code}, Monthly Count: {len(dist_data['data']['monthly'])}")
        assert r.status_code == 200
    except Exception as e:
        print(f"❌ Fetch reviews distribution failed: {e}")
        return

    # 11. Fetch dashboard stats
    print("\nFetching dashboard stats...")
    try:
        r = requests.get(f"{BASE_URL}/dashboard/stats", headers=headers)
        stats_data = r.json()
        print(f"Dashboard Stats: Status {r.status_code}, KPIs: {stats_data['data']['kpi']}")
        assert r.status_code == 200
        print("\n🎉 ALL TESTS IN VERIFY_BACKEND.PY PASSED SUCCESSFULLY! Flask backend matches Node.js format. 🎉")
    except Exception as e:
        print(f"❌ Fetch dashboard stats failed: {e}")
        return

if __name__ == '__main__':
    run_tests()
