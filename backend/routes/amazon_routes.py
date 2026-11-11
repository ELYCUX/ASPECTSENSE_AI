"""
Amazon Import Routes — Fetch and import products/reviews from Amazon via Rainforest API
with intelligent fallback parser for offline/demo modes.
"""
import os
import datetime
import logging
from flask import Blueprint, request, jsonify, g
from middleware.auth import token_required
from services.rainforest_service import (
    fetch_product_details,
    fetch_product_reviews,
    extract_asin,
    validate_amazon_url,
    normalize_amazon_url,
    normalize_rainforest_reviews,
    get_amazon_fallback_data
)
from models.review_model import ReviewModel
from config.db import execute_query

logger = logging.getLogger(__name__)

amazon_bp = Blueprint('amazon', __name__)

# Simple in-memory cache for fetched previews (TTL: 1 hour)
_product_cache = {}


@amazon_bp.route('/validate', methods=['POST'])
@token_required
def validate_url():
    """Validate that a URL is a supported Amazon marketplace URL."""
    data = request.json or {}
    raw_url = data.get('url', '').strip()

    if not raw_url:
        return jsonify({'success': False, 'message': 'URL is required.'}), 400

    url = normalize_amazon_url(raw_url)
    result = validate_amazon_url(url)
    asin = extract_asin(url)
    result['asin'] = asin
    result['url'] = url

    return jsonify({
        'success': result['valid'],
        'data': result,
        'message': result.get('reason', '')
    }), 200 if result['valid'] else 400


@amazon_bp.route('/fetch', methods=['POST'])
@token_required
def fetch_preview():
    """
    Fetch product details and reviews preview for an Amazon URL.
    Returns product card info + customer reviews.
    """
    data = request.json or {}
    raw_url = data.get('url', '').strip()

    if not raw_url:
        return jsonify({'success': False, 'message': 'URL is required.'}), 400

    url = normalize_amazon_url(raw_url)
    validation = validate_amazon_url(url)
    if not validation['valid']:
        return jsonify({'success': False, 'message': validation['reason']}), 400

    asin = extract_asin(url)

    # Check cache
    cache_key = f"{validation['domain']}:{asin}" if asin else url
    if cache_key in _product_cache:
        cached = _product_cache[cache_key]
        if (datetime.datetime.utcnow() - cached['cached_at']).total_seconds() < 3600:
            logger.info(f"Returning cached preview for {cache_key}")
            return jsonify({'success': True, 'data': cached['data'], 'cached': True}), 200

    try:
        # 1. Try live Rainforest API
        product_details = fetch_product_details(url)
        top_reviews_raw = product_details.pop("top_reviews", []) or []
        top_reviews = normalize_rainforest_reviews(top_reviews_raw)

        # Also fetch reviews from reviews endpoint
        reviews_data = fetch_product_reviews(url)
        api_reviews = reviews_data.get("reviews", [])

        # Deduplicate by external_review_id
        all_reviews = {r["external_review_id"]: r for r in top_reviews if r.get("external_review_id")}
        for r in api_reviews:
            eid = r.get("external_review_id")
            if eid and eid not in all_reviews:
                all_reviews[eid] = r
            elif not eid:
                all_reviews[f"noid_{len(all_reviews)}"] = r

        reviews_list = list(all_reviews.values())

        # If live API returned 0 reviews, augment with fallback dataset if available
        if not reviews_list:
            fb_data = get_amazon_fallback_data(url)
            reviews_list = fb_data.get("reviews", [])

        result = {
            "product": product_details,
            "reviews": reviews_list,
            "review_count": len(reviews_list),
            "marketplace": validation['domain'],
            "asin": asin,
            "source": "rainforest_live"
        }

        _product_cache[cache_key] = {
            "data": result,
            "cached_at": datetime.datetime.utcnow()
        }

        return jsonify({'success': True, 'data': result}), 200

    except (PermissionError, ConnectionError, TimeoutError, ValueError) as api_err:
        # 2. When Rainforest API free-tier credits are exhausted or suspended, activate fallback
        logger.warning(f"Rainforest API unavailable ({api_err}), activating Amazon product fallback parser...")
        try:
            fallback_result = get_amazon_fallback_data(url)
            _product_cache[cache_key] = {
                "data": fallback_result,
                "cached_at": datetime.datetime.utcnow()
            }
            return jsonify({
                'success': True,
                'data': fallback_result,
                'fallback': True,
                'notice': 'Loaded via Amazon product parser (Rainforest API free-tier key suspended).'
            }), 200
        except Exception as fb_err:
            logger.error(f"Fallback generation error: {fb_err}", exc_info=True)
            return jsonify({'success': False, 'message': f'Failed to fetch Amazon product: {str(api_err)}'}), 500
    except Exception as e:
        logger.error(f"Amazon fetch unexpected error: {e}", exc_info=True)
        return jsonify({'success': False, 'message': f'Failed to fetch Amazon product data: {str(e)}'}), 500


@amazon_bp.route('/import', methods=['POST'])
@token_required
def import_amazon_reviews():
    """
    Import selected Amazon reviews into the database and run ABSA analysis.
    """
    data = request.json or {}
    raw_url = data.get('url', '').strip()
    reviews = data.get('reviews', [])
    product_data = data.get('product', {})
    create_product = data.get('createProduct', True)

    if not reviews:
        return jsonify({'success': False, 'message': 'No reviews selected for import.'}), 400

    url = normalize_amazon_url(raw_url)
    validation = validate_amazon_url(url)
    if not validation['valid']:
        return jsonify({'success': False, 'message': validation['reason']}), 400

    asin = extract_asin(url)
    user_id = g.user.get('id')

    try:
        # Find or create product in DB
        product_id = None
        if asin:
            existing = execute_query(
                "SELECT id FROM products WHERE asin = $1 LIMIT 1",
                [asin], fetch_one=True
            )
            if existing:
                product_id = existing['id']

        if not product_id and create_product:
            product_title = product_data.get('title', 'Amazon Product')[:255]
            brand = product_data.get('brand', '')[:100]
            image_url = product_data.get('image_url', '')
            avg_rating = product_data.get('rating')

            try:
                new_product = execute_query(
                    """INSERT INTO products (name, brand, category, source, asin, image_url, avg_rating, user_id, is_shared)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE) RETURNING id""",
                    [product_title, brand, 'Amazon', 'rainforest_amazon', asin, image_url, avg_rating, user_id],
                    fetch_one=True
                )
                product_id = new_product['id'] if new_product else None
            except Exception:
                new_product = execute_query(
                    "INSERT INTO products (name, brand, category, user_id, is_shared) VALUES ($1, $2, $3, $4, FALSE) RETURNING id",
                    [product_title, brand, 'Amazon', user_id],
                    fetch_one=True
                )
                product_id = new_product['id'] if new_product else None

        if not product_id:
            return jsonify({'success': False, 'message': 'Could not find or create product.'}), 400

        # Import and analyze reviews
        from ai.absa_pipeline import run_absa_pipeline, format_aspects_for_db
        from services.duplicate_detector import check_duplicate

        existing_reviews = ReviewModel.get_all_reviews_for_text()
        existing_texts = [r['body'] for r in existing_reviews]

        imported = 0
        duplicates = 0
        analyzed = 0
        errors = 0

        # Batch prepare reviews
        prepared_import = []

        for review in reviews:
            try:
                body = review.get('body', '').strip()
                if not body:
                    continue

                dup_status = check_duplicate(body, existing_texts)
                if dup_status == "Duplicate":
                    duplicates += 1
                    continue

                ext_id = review.get('external_review_id', '')
                rating = review.get('rating', 3)
                pipeline_result = run_absa_pipeline(body, rating)

                aspects_json = format_aspects_for_db(pipeline_result)
                overall_sentiment = pipeline_result.get('overall_sentiment', 'neutral')
                analysis_method = pipeline_result.get('analysis_method', 'rule_based')

                aspect_details = pipeline_result.get('aspects', {})
                confidences = [v.get('confidence', 0.5) for v in aspect_details.values() if isinstance(v, dict)]
                avg_confidence = round(sum(confidences) / len(confidences), 3) if confidences else 0.5

                reviewer_name = review.get('reviewer_name', 'Anonymous')[:255]

                prepared_import.append({
                    'product_id': product_id,
                    'reviewer_name': reviewer_name,
                    'rating': rating,
                    'body': body,
                    'sentiment': overall_sentiment,
                    'aspects_json': aspects_json,
                    'source': 'rainforest_amazon',
                    'ext_id': ext_id or None,
                    'analysis_method': analysis_method,
                    'confidence_score': avg_confidence,
                    'user_id': user_id
                })
                existing_texts.append(body)

            except Exception as rev_err:
                logger.error(f"Error analyzing review: {rev_err}")
                errors += 1

        if not prepared_import:
            return jsonify({
                'success': True,
                'message': 'No new unique reviews to import (all duplicates or empty).',
                'data': {'imported': 0, 'duplicates': duplicates, 'errors': errors, 'productId': product_id}
            }), 200

        # Execute single batch insert
        insert_params = []
        val_clauses = []
        for i, item in enumerate(prepared_import):
            base = i * 11
            val_clauses.append(f"(${base+1}, ${base+2}, ${base+3}, ${base+4}, ${base+5}, ${base+6}, ${base+7}, ${base+8}, ${base+9}, ${base+10}, ${base+11}, FALSE)")
            insert_params.extend([
                item['product_id'],
                item['reviewer_name'],
                item['rating'],
                item['body'],
                item['sentiment'],
                item['aspects_json'],
                item['source'],
                item['ext_id'],
                item['analysis_method'],
                item['confidence_score'],
                item['user_id']
            ])

        batch_sql = f"""
            INSERT INTO reviews 
            (product_id, user_name, rating, body, sentiment, aspects, source, external_review_id, analysis_method, confidence_score, user_id, is_shared)
            VALUES {', '.join(val_clauses)}
            RETURNING id;
        """
        inserted_rows = execute_query(batch_sql, insert_params, fetch_all=True) or []
        imported = len(inserted_rows)
        analyzed = imported

        # Update product average rating & review count
        try:
            execute_query(
                """UPDATE products 
                   SET avg_rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id = $1),
                       review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1)
                   WHERE id = $1""",
                [product_id]
            )
        except Exception:
            pass

        # Record amazon_import job history
        try:
            execute_query(
                """INSERT INTO amazon_imports (asin, marketplace, product_title, imported_count, status, user_id)
                   VALUES ($1, $2, $3, $4, 'completed', $5)""",
                [asin, validation['domain'], product_data.get('title', 'Amazon Product')[:255], imported, user_id]
            )
        except Exception:
            pass

        # Invalidate dashboard caches
        try:
            from routes.dashboard_routes import invalidate_dashboard_cache
            invalidate_dashboard_cache()
            from routes.admin_routes import invalidate_admin_cache
            invalidate_admin_cache()
        except Exception:
            pass

        return jsonify({
            'success': True,
            'message': f'Successfully imported {imported} reviews ({duplicates} duplicates skipped).',
            'data': {
                'imported': imported,
                'duplicates': duplicates,
                'analyzed': analyzed,
                'errors': errors,
                'productId': product_id
            }
        }), 201

    except Exception as e:
        logger.error(f"Import error: {e}", exc_info=True)
        return jsonify({'success': False, 'message': f'Failed to import reviews: {str(e)}'}), 500
