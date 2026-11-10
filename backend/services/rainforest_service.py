"""
Rainforest API Service — Fetch Amazon product details and reviews.
All requests go through Flask backend; API key is never exposed to frontend.
"""
import os
import re
import logging
import requests
from urllib.parse import urlparse, unquote

logger = logging.getLogger(__name__)

RAINFOREST_BASE_URL = "https://api.rainforestapi.com/request"

# Supported Amazon marketplace domains and their codes
AMAZON_DOMAINS = {
    "amazon.in": "amazon.in",
    "amazon.com": "amazon.com",
    "amazon.co.uk": "amazon.co.uk",
    "amazon.de": "amazon.de",
    "amazon.co.jp": "amazon.co.jp",
    "amazon.ca": "amazon.ca",
    "amazon.com.au": "amazon.com.au",
    "amazon.fr": "amazon.fr",
    "amazon.es": "amazon.es",
    "amazon.it": "amazon.it",
    "amazon.nl": "amazon.nl",
    "amazon.com.br": "amazon.com.br",
    "amazon.sg": "amazon.sg",
    "amazon.ae": "amazon.ae",
    "amazon.sa": "amazon.sa",
}


def validate_amazon_url(url: str) -> dict:
    """
    Validate that a URL is a supported Amazon marketplace URL.

    Returns:
        dict with {valid: bool, domain: str, reason: str}
    """
    if not url or not isinstance(url, str):
        return {"valid": False, "domain": None, "reason": "URL is empty"}

    url = url.strip()

    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return {"valid": False, "domain": None, "reason": "URL must start with http:// or https://"}

        # Strip www. prefix
        netloc = parsed.netloc.lower().replace("www.", "")

        if netloc not in AMAZON_DOMAINS:
            supported = ", ".join(sorted(AMAZON_DOMAINS.keys()))
            return {
                "valid": False,
                "domain": netloc,
                "reason": f"Unsupported marketplace '{netloc}'. Supported: {supported}"
            }

        return {"valid": True, "domain": netloc, "reason": "Valid Amazon URL"}

    except Exception as e:
        return {"valid": False, "domain": None, "reason": f"Invalid URL format: {str(e)}"}


def extract_asin(url: str) -> str | None:
    """
    Extract ASIN from Amazon product URL.
    Handles common patterns:
    - /dp/ASIN
    - /gp/product/ASIN
    - /product/ASIN
    - ?asin=ASIN
    """
    if not url:
        return None

    url = unquote(url)

    patterns = [
        r'/dp/([A-Z0-9]{10})',
        r'/gp/product/([A-Z0-9]{10})',
        r'/product/([A-Z0-9]{10})',
        r'[?&]asin=([A-Z0-9]{10})',
        r'/([A-Z0-9]{10})/?\?',
        r'/([A-Z0-9]{10})/?$',
    ]

    for pattern in patterns:
        match = re.search(pattern, url, re.IGNORECASE)
        if match:
            asin = match.group(1).upper()
            if len(asin) == 10:
                return asin

    return None


def _get_api_key() -> str | None:
    return os.environ.get("RAINFOREST_API_KEY")


def _make_request(params: dict, timeout: int = 30) -> dict:
    """Make a request to Rainforest API with error handling."""
    api_key = _get_api_key()
    if not api_key:
        raise ValueError("RAINFOREST_API_KEY is not configured in environment.")

    params["api_key"] = api_key

    try:
        response = requests.get(RAINFOREST_BASE_URL, params=params, timeout=timeout)

        if response.status_code == 400:
            try:
                err_msg = response.json().get("request_info", {}).get("message")
                if err_msg:
                    raise ValueError(f"Rainforest API: {err_msg}")
            except Exception as parse_err:
                if isinstance(parse_err, ValueError):
                    raise parse_err
            raise ValueError(f"Bad request to Rainforest API: {response.text[:200]}")
        elif response.status_code == 401:
            raise PermissionError("Invalid Rainforest API key.")
        elif response.status_code == 402:
            raise PermissionError("Rainforest API credits exhausted. Please top up your account.")
        elif response.status_code == 422:
            raise ValueError(f"Invalid request parameters: {response.text[:200]}")
        elif response.status_code == 429:
            raise ConnectionError("Rainforest API rate limit reached. Please retry in a moment.")
        elif response.status_code >= 500:
            raise ConnectionError(f"Rainforest API server error ({response.status_code}).")

        response.raise_for_status()
        return response.json()

    except requests.Timeout:
        raise TimeoutError("Rainforest API request timed out after 30 seconds.")
    except requests.ConnectionError:
        raise ConnectionError("Could not connect to Rainforest API. Check your internet connection.")


def fetch_product_details(amazon_url: str) -> dict:
    """
    Fetch product details from Rainforest API using ASIN + domain or URL.

    Args:
        amazon_url: Full Amazon product URL

    Returns:
        dict with product details or raises exception
    """
    asin = extract_asin(amazon_url)
    domain_info = validate_amazon_url(amazon_url)
    domain = domain_info.get("domain")

    # Prefer ASIN + amazon_domain (cleaner, faster, avoids complex tracking params)
    if asin and domain:
        params = {
            "type": "product",
            "asin": asin,
            "amazon_domain": domain,
        }
    else:
        params = {
            "type": "product",
            "url": amazon_url,
        }

    data = _make_request(params)
    product = data.get("product", {})

    if not product:
        raise ValueError("Product not found or unavailable.")

    return {
        "asin": product.get("asin"),
        "title": product.get("title", "Unknown Product"),
        "brand": product.get("brand", ""),
        "image_url": product.get("main_image", {}).get("link", ""),
        "rating": product.get("rating"),
        "ratings_total": product.get("ratings_total"),
        "reviews_total": product.get("reviews_total"),
        "url": amazon_url,
        "category": product.get("categories_flat", ""),
        "price": product.get("buybox_winner", {}).get("price", {}).get("value"),
        "currency": product.get("buybox_winner", {}).get("price", {}).get("currency", ""),
        # Top reviews from product page (available without extra cost)
        "top_reviews": product.get("top_reviews", []),
    }


def fetch_product_reviews(amazon_url: str, page: int = 1) -> dict:
    """
    Fetch customer reviews from Rainforest API reviews endpoint.

    Args:
        amazon_url: Full Amazon product URL
        page: Page number (default 1)

    Returns:
        dict with reviews list and metadata
    """
    asin = extract_asin(amazon_url)
    domain_info = validate_amazon_url(amazon_url)
    domain = domain_info.get("domain")

    if asin and domain:
        params = {
            "type": "reviews",
            "asin": asin,
            "amazon_domain": domain,
            "page": page,
        }
    else:
        params = {
            "type": "reviews",
            "url": amazon_url,
            "page": page,
        }

    try:
        data = _make_request(params)
        reviews = data.get("reviews", [])
        summary = data.get("reviews_summary", {})

        return {
            "reviews": normalize_rainforest_reviews(reviews),
            "total_reviews": data.get("reviews_total"),
            "current_page": page,
            "has_more": data.get("pagination", {}).get("next_page_link") is not None,
            "summary": summary
        }
    except Exception as e:
        logger.warning(f"Reviews endpoint failed: {e}. Returning empty.")
        return {"reviews": [], "total_reviews": 0, "current_page": 1, "has_more": False, "summary": {}}


def normalize_rainforest_reviews(reviews: list) -> list:
    """
    Normalize Rainforest API review objects to internal schema.

    Args:
        reviews: Raw review list from Rainforest API

    Returns:
        list of normalized review dicts
    """
    normalized = []
    for r in reviews:
        if not r:
            continue

        # Extract rating (Rainforest uses rating as float like 4.0)
        raw_rating = r.get("rating") or r.get("star_rating")
        try:
            rating = max(1, min(5, round(float(raw_rating))))
        except (TypeError, ValueError):
            rating = 3

        # Text
        body = r.get("body") or r.get("review_comment") or ""

        # Title
        title = r.get("title", "")

        # Date
        date = r.get("date", {})
        if isinstance(date, dict):
            review_date = date.get("utc") or date.get("raw", "")
        else:
            review_date = str(date) if date else ""

        # Reviewer
        profile = r.get("profile", {}) or {}
        reviewer_name = profile.get("name") or r.get("author", {}).get("name") or "Anonymous"

        # Verified purchase
        verified = r.get("verified_purchase", False)

        # External ID
        external_id = r.get("id") or r.get("review_id") or ""

        if not body.strip():
            continue

        normalized.append({
            "external_review_id": str(external_id),
            "reviewer_name": reviewer_name,
            "rating": rating,
            "title": title,
            "body": body.strip(),
            "review_date": review_date,
            "verified_purchase": verified,
            "source": "rainforest_amazon"
        })

    return normalized


def get_reviews_for_product(amazon_url: str) -> list:
    """
    Get all available reviews, combining top_reviews from product + reviews endpoint.
    Returns deduplicated list.
    """
    all_reviews = []
    seen_ids = set()

    # First try reviews endpoint
    reviews_data = fetch_product_reviews(amazon_url)
    for r in reviews_data.get("reviews", []):
        eid = r.get("external_review_id", "")
        if eid and eid not in seen_ids:
            seen_ids.add(eid)
            all_reviews.append(r)
        elif not eid:
            all_reviews.append(r)

    return all_reviews
