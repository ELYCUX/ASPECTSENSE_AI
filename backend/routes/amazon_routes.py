"""
Amazon Import Routes — Fetch and import products/reviews from Amazon via Rainforest API.
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
    normalize_rainforest_reviews
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
    url = data.get('url', '').strip()

    if not url:
        return jsonify({'success': False, 'message': 'URL is required.'}), 400

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
    Returns product card info + top customer reviews.
    """
    data = request.json or {}
    url = data.get('url', '').strip()

    if not url:
        return jsonify({'success': False, 'message': 'URL is required.'}), 400

    # Validate first
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
        # Fetch product details
        product_details = fetch_product_details(url)

        # Collect reviews: start with top_reviews from product page
        top_reviews_raw = product_details.pop("top_reviews", []) or []
        top_reviews = normalize_rainforest_reviews(top_reviews_raw)

        # Also try the dedicated reviews endpoint
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

        result = {
            "product": product_details,
            "reviews": reviews_list,
            "review_count": len(reviews_list),
            "marketplace": validation['domain'],
            "asin": asin
        }

        # Cache the result
        _product_cache[cache_key] = {
            "data": result,
            "cached_at": datetime.datetime.utcnow()
        }

        return jsonify({'success': True, 'data': result}), 200

    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
    except PermissionError as e:
        return jsonify({'success': False, 'message': str(e), 'code': 'API_KEY_ERROR'}), 403
    except TimeoutError as e:
        return jsonify({'success': False, 'message': str(e), 'code': 'TIMEOUT'}), 504
    except ConnectionError as e:
        return jsonify({'success': False, 'message': str(e), 'code': 'CONNECTION_ERROR'}), 503
    except Exception as e:
        logger.error(f"Amazon fetch error: {e}", exc_info=True)
        return jsonify({'success': False, 'message': f'Failed to fetch Amazon product data: {str(e)}'}), 500


@amazon_bp.route('/import', methods=['POST'])
@token_required
def import_amazon_reviews():
    """
    Import selected Amazon reviews into the database and run ABSA analysis.
    """
    data = request.json or {}
    url = data.get('url', '').strip()
    reviews = data.get('reviews', [])
    product_data = data.get('product', {})
    create_product = data.get('createProduct', True)

    if not reviews:
        return jsonify({'success': False, 'message': 'No reviews selected for import.'}), 400

    # Validate URL
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
                if ext_id:
                    existing_ext = execute_query(
                        "SELECT id FROM reviews WHERE external_review_id = $1 LIMIT 1",
                        [ext_id], fetch_one=True
                    )
                    if existing_ext:
                        duplicates += 1
                        continue

                rating = review.get('rating', 3)
                pipeline_result = run_absa_pipeline(body, rating)

                aspects_json = format_aspects_for_db(pipeline_result)
                overall_sentiment = pipeline_result.get('overall_sentiment', 'neutral')
                analysis_method = pipeline_result.get('analysis_method', 'rule_based')

                aspect_details = pipeline_result.get('aspects', {})
                confidences = [v.get('confidence', 0.5) for v in aspect_details.values() if isinstance(v, dict)]
                avg_confidence = round(sum(confidences) / len(confidences), 3) if confidences else 0.5

                reviewer_name = review.get('reviewer_name', 'Anonymous')[:255]

                try:
                    execute_query(
                        """INSERT INTO reviews 
                           (product_id, user_name, rating, body, sentiment, aspects, source, 
                            external_review_id, analysis_method, confidence_score, user_id, is_shared)
                           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, FALSE)""",
                        [
                            product_id, reviewer_name, rating, body,
                            overall_sentiment, aspects_json, 'rainforest_amazon',
                            ext_id or None, analysis_method, avg_confidence, user_id
                        ]
                    )
                except Exception:
                    execute_query(
                        """INSERT INTO reviews (product_id, user_name, rating, body, sentiment, aspects, source, user_id)
                           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
                        [product_id, reviewer_name, rating, body, overall_sentiment, aspects_json, 'rainforest_amazon', user_id]
                    )

                imported += 1
                analyzed += 1
                existing_texts.append(body)

            except Exception as rev_err:
                logger.error(f"Error importing review: {rev_err}")
                errors += 1

        # Record import metadata
        try:
            execute_query(
                """INSERT INTO amazon_imports (asin, marketplace, product_id, product_title, imported_count, duplicate_count, status, user_id)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
                [asin, validation['domain'], product_id, product_data.get('title', ''),
                 imported, duplicates, 'completed', user_id]
            )
        except Exception as e:
            logger.warning(f"Failed to record amazon_import entry: {e}")

        # Send notification to user
        try:
            execute_query(
                '''INSERT INTO user_notifications (user_id, title, message, type)
                   VALUES ($1, $2, $3, $4)''',
                [user_id, "Amazon Import Complete", f"Successfully imported {imported} reviews ({duplicates} duplicates skipped).", "success"]
            )
        except Exception:
            pass

        return jsonify({
            'success': True,
            'message': f'{imported} reviews imported successfully.',
            'data': {
                'productId': product_id,
                'imported': imported,
                'duplicates': duplicates,
                'analyzed': analyzed,
                'errors': errors
            }
        }), 201

    except Exception as e:
        logger.error(f"Amazon import error: {e}", exc_info=True)
        return jsonify({'success': False, 'message': 'Failed to import reviews.'}), 500
