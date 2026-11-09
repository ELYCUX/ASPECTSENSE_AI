def calculate_review_quality_score(review_text, rating, aspects_detected, duplicate_status):
    score = 100
    details = []
    
    # Very short review penalty
    word_count = len(review_text.split())
    if word_count < 5:
        score -= 30
        details.append(f"Review is very short (-30 pts)")
    elif word_count < 15:
        score -= 10
        details.append(f"Review is somewhat short (-10 pts)")
    else:
        details.append(f"Good length review ({word_count} words)")
        
    # Rating presence (rating is required by DB, but just in case)
    if not rating:
        score -= 20
        details.append("Missing product rating (-20 pts)")
        
    # Aspect mention bonus/penalty
    # If no aspects detected (meaning General fallback used)
    if not aspects_detected or "General" in aspects_detected:
        score -= 15
        details.append("No specific device aspects mentioned (-15 pts)")
    else:
        details.append(f"Mentions {len(aspects_detected)} specific product aspects")
        
    # Duplicate penalty
    if duplicate_status == "Duplicate":
        score = 0
        details.append("Exact duplicate of an existing review (0 pts)")
    elif duplicate_status == "Possible Duplicate":
        score -= 30
        details.append("Very similar to an existing review (-30 pts)")
    else:
        details.append("Content appears unique")
        
    # Cap score
    score = max(0, min(100, score))
    
    classification = "Poor"
    if score >= 90: classification = "Excellent"
    elif score >= 75: classification = "Good"
    elif score >= 50: classification = "Average"
    
    return {
        "score": score,
        "classification": classification,
        "factors": {
            "word_count": word_count,
            "has_aspects": not ("General" in aspects_detected if aspects_detected else True),
            "duplicate_status": duplicate_status
        },
        "details": details
    }


def calculate_product_health_score(metrics):
    """
    metrics should be a dict with:
    - avg_rating (float, 0-5)
    - review_count (int)
    - positive_reviews (int)
    - negative_reviews (int)
    """
    avg_rating = metrics.get('avg_rating', 0)
    review_count = metrics.get('review_count', 0)
    
    positive_reviews = metrics.get('positive_reviews', 0)
    negative_reviews = metrics.get('negative_reviews', 0)
    total_analyzed = positive_reviews + negative_reviews
    
    if review_count == 0:
        return {"score": 0, "status": "Critical", "message": "No reviews available"}
        
    # Base score out of 50 based on rating
    score = (avg_rating / 5.0) * 50
    
    # Review count factor (max 20 points, peaks at 100 reviews)
    count_score = min(20, (review_count / 100.0) * 20)
    score += count_score
    
    # Sentiment balance (max 30 points)
    if total_analyzed > 0:
        positive_ratio = positive_reviews / float(total_analyzed)
        score += positive_ratio * 30
    else:
        # Default to neutral contribution if no sentiment analyzed
        score += 15
        
    score = max(0, min(100, int(score)))
    
    if score >= 80: status = "Healthy"
    elif score >= 60: status = "Warning"
    else: status = "Critical"
    
    return {
        "score": score,
        "status": status,
        "factors": {
            "avg_rating": avg_rating,
            "review_count": review_count,
            "positive_ratio": positive_reviews / float(total_analyzed) if total_analyzed > 0 else 0
        }
    }

def calculate_business_priority(avg_rating, review_frequency_per_month, negative_reviews_count):
    if negative_reviews_count > 50 and avg_rating < 3.0:
        return "Critical"
    elif negative_reviews_count > 20 and avg_rating < 3.5:
        return "High Priority"
    elif negative_reviews_count > 10 and avg_rating < 4.0:
        return "Medium"
    else:
        return "Low"
