from flask import Blueprint, request, jsonify, g
from models.product_model import ProductModel
from middleware.auth import token_required
import math

product_bp = Blueprint('products', __name__)

@product_bp.route('/', methods=['GET'])
@token_required
def get_products():
    try:
        limit = int(request.args.get('limit', 20))
        page = int(request.args.get('page', 1))
        offset = (page - 1) * limit
        search = request.args.get('search', '')

        is_admin = g.user.get('role') == 'admin'
        user_id = g.user.get('id')

        products = ProductModel.find_all(limit=limit, offset=offset, search=search, user_id=user_id, is_admin=is_admin)
        total = ProductModel.count(search=search, user_id=user_id, is_admin=is_admin)

        for p in products:
            if 'price' in p and p['price'] is not None:
                p['price'] = float(p['price'])
            if 'avg_rating' in p and p['avg_rating'] is not None:
                p['avg_rating'] = float(p['avg_rating'])
            if 'created_at' in p and p['created_at'] is not None:
                p['created_at'] = p['created_at'].isoformat()

        return jsonify({
            'success': True,
            'data': {
                'products': products,
                'pagination': {
                    'total': total,
                    'page': page,
                    'limit': limit,
                    'totalPages': math.ceil(total / limit) if total > 0 else 1
                }
            }
        }), 200
    except Exception as e:
        print('Products Error:', e)
        return jsonify({'success': False, 'message': 'Failed to fetch products.'}), 500


@product_bp.route('/', methods=['POST'])
@token_required
def create_product():
    try:
        data = request.json or {}
        name = data.get('name', '').strip()
        category = data.get('category', '').strip()
        brand = data.get('brand', '').strip()
        price = float(data.get('price', 0.0) or 0.0)
        description = data.get('description', '').strip()
        image_url = data.get('imageUrl', '').strip()

        if not name or not category:
            return jsonify({'success': False, 'message': 'Product name and category are required.'}), 400

        user_id = g.user['id']
        product = ProductModel.create(
            name=name, category=category, brand=brand,
            price=price, description=description, image_url=image_url,
            user_id=user_id
        )

        if product:
            if product.get('price') is not None: product['price'] = float(product['price'])
            if product.get('avg_rating') is not None: product['avg_rating'] = float(product['avg_rating'])
            if product.get('created_at') is not None: product['created_at'] = product['created_at'].isoformat()

        return jsonify({
            'success': True,
            'message': 'Product created successfully.',
            'data': {'product': product}
        }), 201
    except Exception as e:
        print('Create Product Error:', e)
        return jsonify({'success': False, 'message': 'Failed to create product.'}), 500


@product_bp.route('/<int:id>', methods=['GET'])
@token_required
def get_product(id):
    try:
        product = ProductModel.find_by_id(id)
        if not product:
            return jsonify({'success': False, 'message': 'Product not found.'}), 404
            
        if 'price' in product and product['price'] is not None:
            product['price'] = float(product['price'])
        if 'avg_rating' in product and product['avg_rating'] is not None:
            product['avg_rating'] = float(product['avg_rating'])
        if 'created_at' in product and product['created_at'] is not None:
            product['created_at'] = product['created_at'].isoformat()

        return jsonify({'success': True, 'data': {'product': product}}), 200
    except Exception as e:
        print('Product Details Error:', e)
        return jsonify({'success': False, 'message': 'Failed to fetch product.'}), 500


@product_bp.route('/compare', methods=['GET'])
@token_required
def compare_products():
    try:
        p1 = request.args.get('p1')
        p2 = request.args.get('p2')
        if not p1 or not p2:
             return jsonify({'success': False, 'message': 'Need two products to compare (p1, p2)'}), 400
             
        from config.db import execute_query
        from services.metrics_service import calculate_product_health_score
        
        products = execute_query('SELECT * FROM products WHERE id IN ($1, $2)', [p1, p2], fetch_all=True)
        if len(products) != 2:
             return jsonify({'success': False, 'message': 'One or both products not found'}), 404
             
        results = []
        for p in products:
             reviews = execute_query('SELECT rating, sentiment, body FROM reviews WHERE product_id = $1', [p['id']], fetch_all=True)
             pos = len([r for r in reviews if r['sentiment'] == 'positive'])
             neg = len([r for r in reviews if r['sentiment'] == 'negative'])
             health = calculate_product_health_score({
                 'avg_rating': float(p['avg_rating']),
                 'review_count': p['review_count'],
                 'positive_reviews': pos,
                 'negative_reviews': neg
             })
             
             results.append({
                 'id': p['id'],
                 'name': p['name'],
                 'brand': p['brand'],
                 'avgRating': float(p['avg_rating']),
                 'reviewCount': p['review_count'],
                 'healthScore': health['score'],
                 'positivePct': (pos / len(reviews) * 100) if reviews else 0,
                 'negativePct': (neg / len(reviews) * 100) if reviews else 0
             })
             
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        print('Compare Products Error:', e)
        return jsonify({'success': False, 'message': 'Failed to compare products.'}), 500
