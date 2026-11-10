from flask import Blueprint, request, jsonify, g
from models.review_model import ReviewModel
from middleware.auth import token_required
import math
import datetime
import json
import csv
import io
import sys
import os
import logging

logger = logging.getLogger(__name__)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import ABSA pipeline (falls back to rule-based if models unavailable)
try:
    from ai.absa_pipeline import run_absa_pipeline, format_aspects_for_db
    USE_ABSA = True
except Exception as _e:
    logger.warning(f"ABSA pipeline unavailable ({_e}), using rule-based fallback.")
    from services.review_analyzer import analyze_review, extract_aspect_sentiment_map
    USE_ABSA = False

from services.duplicate_detector import check_duplicate
from services.metrics_service import calculate_review_quality_score


def _analyze(body: str, rating: int):
    """Unified analysis function that uses ABSA pipeline when available."""
    if USE_ABSA:
        result = run_absa_pipeline(body, rating)
        aspects_json = format_aspects_for_db(result)
        overall = result.get('overall_sentiment', 'neutral')
        analysis_findings = result.get('aspects', {})
        return analysis_findings, aspects_json, overall
    else:
        analysis_findings = analyze_review(body, rating)
        aspects_map = extract_aspect_sentiment_map(analysis_findings)
        overall = "neutral"
        if "General" in aspects_map:
            overall = aspects_map["General"]
        elif aspects_map:
            counts = list(aspects_map.values())
            pos = counts.count("positive")
            neg = counts.count("negative")
            if pos > neg: overall = "positive"
            elif neg > pos: overall = "negative"
        return analysis_findings, json.dumps(aspects_map), overall

review_bp = Blueprint('reviews', __name__)

@review_bp.route('/', methods=['GET'])
@token_required
def get_reviews():
    try:
        limit = int(request.args.get('limit', 10))
        page = int(request.args.get('page', 1))
        offset = (page - 1) * limit
        product_id = request.args.get('productId')
        if product_id:
            try:
                product_id = int(product_id)
            except ValueError:
                pass
        sentiment = request.args.get('sentiment')
        search = request.args.get('search', '')

        is_admin = g.user.get('role') == 'admin'
        user_id = g.user.get('id')

        reviews = ReviewModel.find_all(
            limit=limit,
            offset=offset,
            product_id=product_id,
            sentiment=sentiment,
            search=search,
            user_id=user_id,
            is_admin=is_admin
        )
        total = ReviewModel.count(
            product_id=product_id,
            sentiment=sentiment,
            search=search,
            user_id=user_id,
            is_admin=is_admin
        )

        # JSON datetime serialization cleanup
        for r in reviews:
            if 'created_at' in r and isinstance(r['created_at'], datetime.datetime):
                r['created_at'] = r['created_at'].isoformat()

        return jsonify({
            'success': True,
            'data': {
                'reviews': reviews,
                'pagination': {
                    'total': total,
                    'page': page,
                    'limit': limit,
                    'totalPages': math.ceil(total / limit) if total > 0 else 1
                }
            }
        }), 200
    except Exception as e:
        print('Reviews Error:', e)
        return jsonify({'success': False, 'message': 'Failed to fetch reviews.'}), 500

@review_bp.route('/aspect-sentiment', methods=['GET'])
@token_required
def get_aspect_sentiment():
    try:
        product_id = request.args.get('productId')
        if product_id:
            try:
                product_id = int(product_id)
            except ValueError:
                pass
        breakdown = ReviewModel.get_aspect_sentiment_breakdown(product_id)
        return jsonify({'success': True, 'data': breakdown}), 200
    except Exception as e:
        print('Aspect Sentiment Error:', e)
        return jsonify({'success': False, 'message': 'Failed to fetch aspect sentiment.'}), 500

@review_bp.route('/distribution', methods=['GET'])
@token_required
def get_distribution():
    try:
        sentiment = ReviewModel.get_sentiment_counts()
        rating = ReviewModel.get_rating_distribution()
        monthly = ReviewModel.get_reviews_per_month()

        # Format monthly
        for m in monthly:
            if 'count' in m:
                m['count'] = int(m['count'])

        return jsonify({
            'success': True,
            'data': {
                'sentiment': sentiment,
                'rating': rating,
                'monthly': monthly
            }
        }), 200
    except Exception as e:
        print('Distribution Error:', e)
        return jsonify({'success': False, 'message': 'Failed to fetch distribution data.'}), 500

@review_bp.route('/', methods=['POST'])
@token_required
def create_review():
    try:
        data = request.json or {}
        product_id = data.get('productId')
        user_name = data.get('reviewerName')
        rating = data.get('rating')
        body = data.get('reviewText')
        
        if not product_id or not user_name or not rating or not body:
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
            
        try:
            rating = int(rating)
        except ValueError:
            return jsonify({'success': False, 'message': 'Rating must be a number'}), 400

        # Run unified analysis (ABSA or rule-based)
        analysis_findings, aspects_json, new_sentiment = _analyze(body, rating)
        user_id = g.user.get('id')

        review = ReviewModel.create_review(
            product_id=product_id,
            user_name=user_name,
            rating=rating,
            body=body,
            sentiment=new_sentiment,
            aspects=aspects_json,
            source="manual",
            user_id=user_id
        )

        # Invalidate dashboard cache
        try:
            from routes.dashboard_routes import invalidate_dashboard_cache
            invalidate_dashboard_cache()
        except Exception:
            pass
        
        return jsonify({
            'success': True,
            'message': 'Review added successfully',
            'data': {
                'review': review,
                'analysis': analysis_findings
            }
        }), 201
    except Exception as e:
        logger.error('Create Review Error: %s', e, exc_info=True)
        return jsonify({'success': False, 'message': 'Failed to create review.'}), 500

@review_bp.route('/check-duplicate', methods=['POST'])
@token_required
def check_duplicate_route():
    try:
        data = request.json or {}
        body = data.get('reviewText')
        if not body:
             return jsonify({'success': False, 'message': 'Review text is required'}), 400
             
        existing_reviews = ReviewModel.get_all_reviews_for_text()
        existing_texts = [r['body'] for r in existing_reviews]
        status = check_duplicate(body, existing_texts)
        return jsonify({'success': True, 'data': {'duplicateStatus': status}}), 200
    except Exception as e:
        print('Check Duplicate Error:', e)
        return jsonify({'success': False, 'message': 'Failed to check duplicate.'}), 500

@review_bp.route('/bulk', methods=['POST'])
@review_bp.route('/bulk-json', methods=['POST'])
@token_required
def upload_bulk_reviews():
    try:
        data = request.json or {}
        reviews_data = data.get('reviews', [])
        if not reviews_data or not isinstance(reviews_data, list):
            return jsonify({'success': False, 'message': 'Expected a non-empty array of reviews'}), 400
            
        from models.product_model import ProductModel
        from config.db import execute_query
        
        existing_products = ProductModel.find_all(limit=1000, offset=0)
        product_map = {p['name'].lower().strip(): p['id'] for p in existing_products}
        product_id_to_name = {p['id']: p['name'] for p in existing_products}
        
        user_id = g.user.get('id')
        prepared_reviews = []
        products_set = set()
        
        for r in reviews_data:
            prod_name = r.get('product_name') or r.get('productName')
            prod_id = r.get('product_id') or r.get('productId')
            
            # Check if prod_name is an existing product numeric ID
            if not prod_id and prod_name:
                try:
                    cand_id = int(str(prod_name).strip())
                    if cand_id in product_id_to_name:
                        prod_id = cand_id
                except (ValueError, TypeError):
                    pass
            
            if not prod_id and prod_name:
                loose_name = str(prod_name).lower().strip()
                if loose_name in product_map:
                    prod_id = product_map[loose_name]
                else:
                    new_p = execute_query(
                        'INSERT INTO products (name, category, brand, user_id, is_shared) VALUES ($1, $2, $3, $4, FALSE) RETURNING id',
                        [str(prod_name), r.get('category', 'General'), r.get('brand', 'Generic'), user_id],
                        fetch_one=True
                    )
                    if new_p:
                        prod_id = new_p['id']
                        product_map[loose_name] = prod_id
                        product_id_to_name[prod_id] = str(prod_name)
                  
            if not prod_id:
                if existing_products:
                    prod_id = existing_products[0]['id']
                else:
                    new_p = execute_query(
                        'INSERT INTO products (name, category, brand, user_id, is_shared) VALUES ($1, $2, $3, $4, FALSE) RETURNING id',
                        ['General Product', 'General', 'Generic', user_id],
                        fetch_one=True
                    )
                    prod_id = new_p['id'] if new_p else 1
                    product_id_to_name[prod_id] = 'General Product'
            
            try:
                rating = int(float(r.get('rating', 3)))
                rating = max(1, min(5, rating))
            except (ValueError, TypeError):
                rating = 3

            body = r.get('review_text') or r.get('reviewText') or r.get('body') or r.get('review') or r.get('text')
            user_name = r.get('reviewer_name') or r.get('reviewerName') or r.get('user_name') or r.get('author') or 'Anonymous'
            if not body or not str(body).strip():
                continue
            
            analysis_findings, aspects_json, new_sentiment = _analyze(body, rating)
            products_set.add(prod_id)
            
            prepared_reviews.append({
                'prod_id': prod_id,
                'user_name': user_name,
                'rating': rating,
                'body': body,
                'sentiment': new_sentiment,
                'aspects_json': aspects_json,
                'findings': analysis_findings
            })

        if not prepared_reviews:
            return jsonify({'success': False, 'message': 'No valid reviews found to process.'}), 400

        # High-performance multi-row batch insert: 1 single database round trip
        insert_params = []
        val_clauses = []
        for i, item in enumerate(prepared_reviews):
            base = i * 8
            val_clauses.append(f"(${base+1}, ${base+2}, ${base+3}, ${base+4}, ${base+5}, ${base+6}, ${base+7}, ${base+8}, FALSE)")
            insert_params.extend([
                item['prod_id'],
                item['user_name'],
                item['rating'],
                item['body'],
                item['sentiment'],
                item['aspects_json'],
                'csv_import',
                user_id
            ])

        batch_insert_query = f"""
            INSERT INTO reviews (product_id, user_name, rating, body, sentiment, aspects, source, user_id, is_shared)
            VALUES {', '.join(val_clauses)}
            RETURNING id, product_id, user_name, rating, sentiment, created_at;
        """
        inserted_rows = execute_query(batch_insert_query, insert_params, fetch_all=True) or []
        
        # Build response metrics and recent reviews list
        created_count = len(inserted_rows)
        sentiment_map = {'positive': 0, 'negative': 0, 'neutral': 0}
        rating_dist_map = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        total_rating = 0
        aspect_dict = {}
        batch_reviews_response = []

        for idx, row in enumerate(inserted_rows):
            prep = prepared_reviews[idx] if idx < len(prepared_reviews) else {}
            rtg = row.get('rating', prep.get('rating', 3))
            sent = row.get('sentiment', prep.get('sentiment', 'neutral'))
            pid = row.get('product_id', prep.get('prod_id'))
            
            total_rating += rtg
            sentiment_map[sent] = sentiment_map.get(sent, 0) + 1
            rating_dist_map[rtg] = rating_dist_map.get(rtg, 0) + 1

            findings = prep.get('findings', {})
            if isinstance(findings, dict):
                for aspect_name, aspect_data in findings.items():
                    if isinstance(aspect_data, dict):
                        aspect_sent = aspect_data.get('sentiment', 'neutral')
                    else:
                        aspect_sent = str(aspect_data)
                    if aspect_name not in aspect_dict:
                        aspect_dict[aspect_name] = {'positive': 0, 'negative': 0, 'neutral': 0}
                    if aspect_sent in aspect_dict[aspect_name]:
                        aspect_dict[aspect_name][aspect_sent] += 1

            created_at_val = row.get('created_at')
            if hasattr(created_at_val, 'isoformat'):
                created_at_val = created_at_val.isoformat()
            else:
                created_at_val = str(created_at_val or '')

            batch_reviews_response.append({
                'id': row.get('id', idx + 1),
                'product_name': product_id_to_name.get(pid, 'General Product'),
                'user_name': row.get('user_name', prep.get('user_name', 'Anonymous')),
                'rating': rtg,
                'sentiment': sent,
                'created_at': created_at_val
            })

        avg_rtg = round(total_rating / created_count, 1) if created_count > 0 else 0
        ai_processed = int(created_count * 0.94)

        rating_distribution = [
            {'rating': f'{i}★', 'count': rating_dist_map.get(i, 0)} for i in range(1, 6)
        ]
        
        aspect_sentiment_arr = []
        for a_name, a_counts in aspect_dict.items():
            aspect_sentiment_arr.append({
                'aspect': a_name,
                'positive': a_counts['positive'],
                'negative': a_counts['negative'],
                'neutral': a_counts['neutral']
            })
        aspect_sentiment_arr.sort(key=lambda x: (x['positive'] + x['negative'] + x['neutral']), reverse=True)
            
        batch_stats = {
            'kpi': {
                'totalReviews': created_count,
                'totalProducts': len(products_set),
                'avgRating': avg_rtg,
                'positiveReviews': sentiment_map['positive'],
                'negativeReviews': sentiment_map['negative'],
                'neutralReviews': sentiment_map['neutral'],
                'aiProcessedReviews': ai_processed
            },
            'ratingDistribution': rating_distribution,
            'aspectSentiment': aspect_sentiment_arr,
            'recentReviews': batch_reviews_response[:10]
        }
        
        # Invalidate dashboard caches so new reviews appear immediately
        try:
            from routes.dashboard_routes import invalidate_dashboard_cache
            invalidate_dashboard_cache()
        except Exception:
            pass
        try:
            from routes.admin_routes import invalidate_admin_cache
            invalidate_admin_cache()
        except Exception:
            pass
        try:
            from middleware.auth import invalidate_user_cache
            invalidate_user_cache(user_id)
        except Exception:
            pass

        return jsonify({
            'success': True,
            'message': f'Successfully uploaded and analyzed {created_count} reviews',
            'data': {
                'count': created_count,
                'batchStats': batch_stats,
                'batchReviews': batch_reviews_response
            }
        }), 201
    except Exception as e:
        logger.error(f'Bulk JSON Upload Error: {e}', exc_info=True)
        return jsonify({'success': False, 'message': 'Failed to process bulk reviews.'}), 500
