"""
ABSA Sentiment Analysis — Per-aspect polarity using HuggingFace transformers.
Falls back to rule-based sentiment when models are unavailable.
"""
import logging

logger = logging.getLogger(__name__)

# Rule-based sentiment lexicons (fallback)
POSITIVE_WORDS = [
    "excellent", "amazing", "good", "great", "best", "awesome", "fantastic",
    "perfect", "beautiful", "impressive", "smooth", "fast", "reliable",
    "durable", "worth", "satisfied", "happy", "love", "loved", "recommend",
    "recommended", "outstanding", "superb", "brilliant", "wonderful", "solid",
    "crisp", "sharp", "clear", "vibrant", "accurate", "efficient", "flawless"
]

NEGATIVE_WORDS = [
    "bad", "poor", "terrible", "worst", "awful", "slow", "lag", "laggy",
    "disappointing", "disappointed", "broken", "issue", "problem", "problems",
    "drain", "drains", "expensive", "fragile", "hate", "hated", "unreliable",
    "defective", "useless", "horrible", "mediocre", "average", "failed",
    "fails", "faulty", "cheap", "flimsy", "scratched", "overheating", "dead"
]

NEUTRAL_WORDS = [
    "okay", "ok", "average", "normal", "fine", "decent", "acceptable",
    "moderate", "alright", "so-so"
]

NEGATION_WORDS = [
    "not", "no", "never", "nothing", "nowhere", "hardly", "scarcely",
    "barely", "doesn't", "isn't", "wasn't", "shouldn't", "wouldn't",
    "couldn't", "won't", "can't", "don't", "neither", "nor"
]


def _rule_based_sentiment(context: str, rating: int = None) -> dict:
    """
    Rule-based sentiment detection on a context sentence.
    Returns {sentiment, confidence, method}
    """
    lower = context.lower()
    words = lower.split()

    pos_count = 0
    neg_count = 0
    negated_pos = 0
    negated_neg = 0

    for i, word in enumerate(words):
        # Check negation window (3 words before)
        window_start = max(0, i - 3)
        negated = any(w in NEGATION_WORDS for w in words[window_start:i])

        if word in POSITIVE_WORDS:
            if negated:
                negated_pos += 1
            else:
                pos_count += 1
        elif word in NEGATIVE_WORDS:
            if negated:
                negated_neg += 1
            else:
                neg_count += 1

    # Negations flip their target
    pos_count += negated_neg
    neg_count += negated_pos

    if pos_count > neg_count:
        sentiment = "positive"
        confidence = min(0.9, 0.6 + (pos_count - neg_count) * 0.1)
    elif neg_count > pos_count:
        sentiment = "negative"
        confidence = min(0.9, 0.6 + (neg_count - pos_count) * 0.1)
    else:
        # Fall back to rating
        if rating is not None:
            if rating >= 4:
                sentiment, confidence = "positive", 0.4
            elif rating == 3:
                sentiment, confidence = "neutral", 0.4
            else:
                sentiment, confidence = "negative", 0.4
        else:
            sentiment, confidence = "neutral", 0.3

    return {
        "sentiment": sentiment,
        "confidence": round(confidence, 3),
        "method": "rule_based"
    }


def _parse_absa_label(label: str) -> str:
    """
    Parse ABSA model label to standard sentiment string.
    Different models use different label schemes.
    """
    label_lower = label.lower()

    # Common patterns: POS/NEG/NEU, positive/negative/neutral, LABEL_0/1/2
    if any(x in label_lower for x in ["pos", "positive", "label_2", "good"]):
        return "positive"
    elif any(x in label_lower for x in ["neg", "negative", "label_0", "bad"]):
        return "negative"
    else:
        return "neutral"


def predict_sentiment_absa(context_sentence: str, aspect: str = None) -> dict:
    """
    Predict sentiment for a given aspect context sentence using ABSA model.
    Falls back to rule-based if model unavailable.

    Args:
        context_sentence: The sentence(s) mentioning the aspect
        aspect: The aspect name (used for input formatting)

    Returns:
        dict with sentiment, confidence, model_used, method
    """
    from ai.model_loader import get_absa_pipeline, is_transformers_available

    pipeline = get_absa_pipeline()

    if pipeline is not None:
        try:
            import torch
            with torch.inference_mode():
                # Some ABSA models expect "[ASPECT] : [TEXT]" format
                if aspect:
                    model_input = f"{aspect} : {context_sentence}"
                else:
                    model_input = context_sentence

                # Truncate to avoid exceeding model limits
                max_chars = 512
                if len(model_input) > max_chars:
                    model_input = model_input[:max_chars]

                results = pipeline(model_input)

            # results is a list of [{label, score}]  
            if isinstance(results, list):
                # With top_k=None we get all labels sorted by score
                if results and isinstance(results[0], list):
                    results = results[0]
                
                if results:
                    best = max(results, key=lambda x: x["score"])
                    sentiment = _parse_absa_label(best["label"])
                    return {
                        "sentiment": sentiment,
                        "confidence": round(float(best["score"]), 3),
                        "method": "roberta_absa",
                        "model_used": "gauneg/roberta-base-absa-ate-sentiment"
                    }
        except Exception as e:
            logger.warning(f"ABSA model inference failed: {e}. Using rule-based fallback.")

    # Rule-based fallback
    return _rule_based_sentiment(context_sentence)


def analyze_aspects_sentiment(aspect_list: list, full_text: str, rating: int = None) -> dict:
    """
    Run sentiment analysis on extracted aspects.

    Args:
        aspect_list: List of dicts from extract_aspects()
        full_text: Full review text for fallback context
        rating: Numeric rating (1-5) for fallback

    Returns:
        dict of {aspect_name: {sentiment, confidence, method, context}}
    """
    if not aspect_list:
        # No aspects found - create a General entry based on full text
        result = _rule_based_sentiment(full_text, rating)
        return {
            "General": {
                **result,
                "context": full_text[:200]
            }
        }

    results = {}
    for item in aspect_list:
        aspect = item["aspect"]
        context = item.get("context_sentence", full_text)

        prediction = predict_sentiment_absa(context, aspect)
        results[aspect] = {
            "sentiment": prediction["sentiment"],
            "confidence": prediction["confidence"],
            "method": prediction.get("method", "rule_based"),
            "context": context[:200],
            "matched_text": item.get("matched_text", "")
        }

    return results


def batch_analyze_sentiment(items: list) -> list:
    """
    Batch analyze sentiment for multiple (aspect, context) pairs.
    More efficient than calling predict_sentiment_absa() individually.

    Args:
        items: list of {aspect, context_sentence}

    Returns:
        list of {aspect, sentiment, confidence, method}
    """
    from ai.model_loader import get_absa_pipeline
    pipeline = get_absa_pipeline()

    if pipeline is None:
        return [
            {**item, **_rule_based_sentiment(item.get("context_sentence", ""))}
            for item in items
        ]

    try:
        import torch
        inputs = []
        for item in items:
            aspect = item.get("aspect", "")
            context = item.get("context_sentence", "")
            inp = f"{aspect} : {context}"[:512] if aspect else context[:512]
            inputs.append(inp)

        with torch.inference_mode():
            all_results = pipeline(inputs, batch_size=8)

        output = []
        for i, results in enumerate(all_results):
            if isinstance(results, list):
                best = max(results, key=lambda x: x["score"])
            else:
                best = results
            output.append({
                **items[i],
                "sentiment": _parse_absa_label(best["label"]),
                "confidence": round(float(best["score"]), 3),
                "method": "roberta_absa"
            })
        return output

    except Exception as e:
        logger.warning(f"Batch ABSA failed: {e}. Using rule-based.")
        return [
            {**item, **_rule_based_sentiment(item.get("context_sentence", ""))}
            for item in items
        ]
