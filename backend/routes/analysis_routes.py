"""
Analysis Routes — Trigger ABSA analysis and AI summary generation.
"""
import logging
from flask import Blueprint, request, jsonify
from middleware.auth import token_required
from config.db import execute_query
import json

logger = logging.getLogger(__name__)
analysis_bp = Blueprint('analysis', __name__)


@analysis_bp.route('/review/<int:review_id>', methods=['POST'])
@token_required
def analyze_review_absa(review_id):
    """Re-analyze a single review with the ABSA pipeline."""
    try:
        from ai.absa_pipeline import run_absa_pipeline, format_aspects_for_db

        review = execute_query('SELECT * FROM reviews WHERE id = $1', [review_id], fetch_one=True)
        if not review:
            return jsonify({'success': False, 'message': 'Review not found'}), 404

        body = review.get('body', '')
        rating = review.get('rating', 3)

        result = run_absa_pipeline(body, rating)
        aspects_json = format_aspects_for_db(result)
        overall = result.get('overall_sentiment', 'neutral')
        method = result.get('analysis_method', 'rule_based')

        try:
            execute_query(
                """UPDATE reviews SET sentiment = $1, aspects = $2, analysis_method = $3 WHERE id = $4""",
                [overall, aspects_json, method, review_id]
            )
        except Exception:
            execute_query(
                "UPDATE reviews SET sentiment = $1, aspects = $2 WHERE id = $3",
                [overall, aspects_json, review_id]
            )

        return jsonify({
            'success': True,
            'message': 'Review analyzed successfully',
            'data': {
                'reviewId': review_id,
                'sentiment': overall,
                'aspects': result.get('aspects', {}),
                'analysisMethod': method
            }
        }), 200

    except Exception as e:
        logger.error(f"Review analysis error: {e}", exc_info=True)
        return jsonify({'success': False, 'message': 'Analysis failed.'}), 500


@analysis_bp.route('/product/<int:product_id>', methods=['POST'])
@token_required
def analyze_product_reviews(product_id):
    """Re-analyze all reviews for a product with ABSA."""
    try:
        from ai.absa_pipeline import run_absa_pipeline, format_aspects_for_db

        reviews = execute_query(
            'SELECT id, body, rating FROM reviews WHERE product_id = $1',
            [product_id], fetch_all=True
        )

        if not reviews:
            return jsonify({'success': False, 'message': 'No reviews found for this product.'}), 404

        processed = 0
        for rev in reviews:
            try:
                result = run_absa_pipeline(rev.get('body', ''), rev.get('rating', 3))
                aspects_json = format_aspects_for_db(result)
                overall = result.get('overall_sentiment', 'neutral')
                method = result.get('analysis_method', 'rule_based')

                try:
                    execute_query(
                        "UPDATE reviews SET sentiment = $1, aspects = $2, analysis_method = $3 WHERE id = $4",
                        [overall, aspects_json, method, rev['id']]
                    )
                except Exception:
                    execute_query(
                        "UPDATE reviews SET sentiment = $1, aspects = $2 WHERE id = $3",
                        [overall, aspects_json, rev['id']]
                    )
                processed += 1
            except Exception as rev_err:
                logger.warning(f"Review {rev['id']} analysis failed: {rev_err}")

        return jsonify({
            'success': True,
            'message': f'{processed}/{len(reviews)} reviews analyzed.',
            'data': {'processed': processed, 'total': len(reviews)}
        }), 200

    except Exception as e:
        logger.error(f"Product analysis error: {e}", exc_info=True)
        return jsonify({'success': False, 'message': 'Analysis failed.'}), 500


@analysis_bp.route('/summarize/<int:product_id>', methods=['POST'])
@token_required
def generate_summary(product_id):
    """Generate or regenerate AI summary for a product."""
    try:
        from ai.summary_generator import generate_product_summary
        result = generate_product_summary(product_id)

        if 'error' in result:
            return jsonify({'success': False, 'message': result['error']}), 400

        return jsonify({'success': True, 'data': result}), 200

    except Exception as e:
        logger.error(f"Summary error: {e}", exc_info=True)
        return jsonify({'success': False, 'message': 'Summary generation failed.'}), 500


@analysis_bp.route('/summary/<int:product_id>', methods=['GET'])
@token_required
def get_summary(product_id):
    """Get stored AI summary for a product."""
    try:
        summary = execute_query(
            'SELECT * FROM ai_summaries WHERE product_id = $1',
            [product_id], fetch_one=True
        )

        if not summary:
            return jsonify({'success': False, 'message': 'No summary found. Generate one first.'}), 404

        # Parse JSONB fields
        for field in ('positive_highlights', 'negative_highlights', 'recommendations'):
            val = summary.get(field)
            if isinstance(val, str):
                try:
                    summary[field] = json.loads(val)
                except Exception:
                    summary[field] = []

        if summary.get('created_at'):
            summary['created_at'] = summary['created_at'].isoformat()

        return jsonify({'success': True, 'data': summary}), 200

    except Exception as e:
        logger.error(f"Get summary error: {e}", exc_info=True)
        return jsonify({'success': False, 'message': 'Failed to fetch summary.'}), 500


@analysis_bp.route('/model-info', methods=['GET'])
@token_required
def model_info():
    """Return info about loaded NLP models."""
    try:
        from ai.model_loader import get_model_info
        info = get_model_info()
        return jsonify({'success': True, 'data': info}), 200
    except Exception as e:
        return jsonify({'success': True, 'data': {'error': str(e), 'analysis_method': 'rule_based'}}), 200
