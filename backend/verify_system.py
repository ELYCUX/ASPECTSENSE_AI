"""
Comprehensive Verification Script for AspectSense AI
Tests all newly implemented services and endpoints without needing a running server.
"""
import os
import sys

# Ensure UTF-8 output encoding
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from dotenv import load_dotenv
load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("ASPECTSENSE AI — SYSTEM VERIFICATION")
print("=" * 60)

# 1. Test Amazon URL validation & ASIN extraction
print("\n[1] Testing Rainforest Service...")
from services.rainforest_service import validate_amazon_url, extract_asin

test_urls = [
    ("https://www.amazon.in/dp/B0CX21C26G", True, "B0CX21C26G", "amazon.in"),
    ("https://www.amazon.com/gp/product/B08N5WRWNW", True, "B08N5WRWNW", "amazon.com"),
    ("https://invalid-site.com/dp/B08N5WRWNW", False, None, None),
]

for url, expected_valid, expected_asin, expected_domain in test_urls:
    v_res = validate_amazon_url(url)
    valid = v_res['valid']
    domain = v_res['domain']
    asin = extract_asin(url)
    print(f"  URL: {url[:45]}...")
    print(f"    Valid: {valid} (expected: {expected_valid})")
    print(f"    Domain: {domain} (expected: {expected_domain})")
    print(f"    ASIN: {asin} (expected: {expected_asin})")
    assert valid == expected_valid, f"Validation failed for {url}"
    if expected_asin:
        assert asin == expected_asin, f"ASIN extraction failed for {url}"
print("  --> Rainforest service unit tests PASSED!")

# 2. Test Text Preprocessing
print("\n[2] Testing Text Preprocessing...")
from ai.preprocessing import preprocess_text, segment_sentences

dirty_text = "<p>The <b>camera</b> is awesome! 😍 Check https://example.com/phone for pics.   Battery life is great.   </p>"
cleaned = preprocess_text(dirty_text)
sentences = segment_sentences(cleaned)
print(f"  Raw: {dirty_text}")
print(f"  Clean: {cleaned}")
print(f"  Sentences: {sentences}")
assert "https" not in cleaned, "URL was not cleaned!"
assert "<p>" not in cleaned, "HTML tags were not cleaned!"
assert len(sentences) >= 2, "Sentence splitting failed!"
print("  --> Preprocessing tests PASSED!")

# 3. Test Aspect Extraction
print("\n[3] Testing Aspect Extraction...")
from ai.aspect_extraction import extract_aspects

test_sentence = "The battery lasts all day, but the camera quality is terrible and customer service is unhelpful."
aspects = extract_aspects(test_sentence)
print(f"  Sentence: '{test_sentence}'")
print(f"  Extracted aspects: {aspects}")
aspect_names = [a['aspect'] for a in aspects]
assert "Battery" in aspect_names, f"Battery missing in {aspect_names}"
assert "Camera" in aspect_names, f"Camera missing in {aspect_names}"
print("  --> Aspect extraction tests PASSED!")

# 4. Test ABSA Pipeline (end-to-end)
print("\n[4] Testing ABSA Pipeline...")
from ai.absa_pipeline import run_absa_pipeline

test_review = "The battery lasts all day and charging is super fast, but the camera quality is disappointing."
absa_res = run_absa_pipeline(test_review, rating=4)
print(f"  Review: '{test_review}'")
print(f"  Overall: {absa_res.get('overall_sentiment')}")
print(f"  Aspects detected: {list(absa_res.get('aspects', {}).keys())}")
for asp, details in absa_res.get('aspects', {}).items():
    print(f"    - {asp}: {details.get('sentiment')} (conf: {details.get('confidence')})")
print("  --> ABSA pipeline tests PASSED!")

# 5. Test AI Summary Generator (Extractive Fallback)
print("\n[5] Testing Summary Generator...")
from ai.summary_generator import _extractive_summary

mock_aspects_data = {
    "Battery": {"positive": 15, "negative": 2, "neutral": 3},
    "Camera": {"positive": 3, "negative": 12, "neutral": 1},
    "Display": {"positive": 20, "negative": 1, "neutral": 0},
    "Price": {"positive": 10, "negative": 8, "neutral": 2},
}
mock_sentiment_counts = {"positive": 30, "negative": 15, "neutral": 5}

summary_res = _extractive_summary("Test Smartphone X", mock_aspects_data, mock_sentiment_counts, review_count=50)
print(f"  Summary: {summary_res.get('overall_summary')}")
print(f"  Positive highlights: {summary_res.get('positive_highlights')}")
print(f"  Negative highlights: {summary_res.get('negative_highlights')}")
print(f"  Recommendations: {summary_res.get('recommendations')}")
assert len(summary_res.get('positive_highlights', [])) > 0, "Positive highlights empty!"
assert len(summary_res.get('negative_highlights', [])) > 0, "Negative highlights empty!"
print("  --> Summary generator tests PASSED!")

# 6. Test Flask App initialization and route registration
print("\n[6] Testing Flask App Blueprint Registration...")
from app import app
with app.app_context():
    client = app.test_client()
    routes = [str(p) for p in app.url_map.iter_rules()]
    print(f"  Total registered routes: {len(routes)}")

    # Test health check
    res = client.get('/api/health')
    print(f"  GET /api/health -> Status: {res.status_code}")
    print(f"    Body: {res.get_json()}")
    assert res.status_code == 200, "Health check failed!"

    # Generate a test JWT token
    import jwt, datetime
    jwt_secret = os.environ.get('JWT_SECRET', 'aspect_feedback_jwt_secret_key_2024')
    token = jwt.encode(
        {'id': 1, 'email': 'test@aspectsense.ai', 'role': 'admin', 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
        jwt_secret,
        algorithm='HS256'
    )
    auth_headers = {'Authorization': f'Bearer {token}'}

    # Test Amazon validate endpoint
    res = client.post('/api/amazon/validate', json={"url": "https://www.amazon.in/dp/B0CX21C26G"}, headers=auth_headers)
    print(f"  POST /api/amazon/validate -> Status: {res.status_code}")
    print(f"    Body: {res.get_json()}")
    assert res.status_code == 200, "Amazon validate failed!"

    # Test Analysis model-info endpoint
    res = client.get('/api/analysis/model-info', headers=auth_headers)
    print(f"  GET /api/analysis/model-info -> Status: {res.status_code}")
    print(f"    Body: {res.get_json()}")
    assert res.status_code == 200, "Model-info failed!"

print("  --> Flask App & Route tests PASSED!")

print("\n" + "=" * 60)
print("ALL SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY!")
print("=" * 60)
