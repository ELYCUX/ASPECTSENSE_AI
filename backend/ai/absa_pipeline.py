"""
ABSA Pipeline Orchestrator — Combines preprocessing, aspect extraction, and sentiment analysis.
This is the single unified analysis service used for manual, CSV, and Amazon-imported reviews.
"""
import logging
import json
from ai.preprocessing import preprocess_text
from ai.aspect_extraction import extract_aspects
from ai.sentiment_analysis import analyze_aspects_sentiment

logger = logging.getLogger(__name__)


def run_absa_pipeline(text: str, rating: int = None) -> dict:
    """
    Full ABSA pipeline: preprocess → extract aspects → sentiment per aspect.

    Args:
        text: Raw review text
        rating: Numeric rating (1-5), used as fallback for sentiment

    Returns:
        dict with:
        - aspects: {aspect_name: {sentiment, confidence, method, context}}
        - overall_sentiment: majority sentiment
        - analysis_method: roberta_absa | rule_based | mixed
        - preprocessed_text: cleaned text
    """
    if not text or not text.strip():
        return {
            "aspects": {
                "General": {
                    "sentiment": "neutral",
                    "confidence": 0.3,
                    "method": "fallback",
                    "context": ""
                }
            },
            "overall_sentiment": "neutral",
            "analysis_method": "fallback",
            "preprocessed_text": ""
        }

    # Step 1: Preprocess
    clean_text = preprocess_text(text)
    if not clean_text:
        clean_text = text[:1000]  # use first 1000 chars if cleaning removes everything

    # Step 2: Extract aspects
    aspects_found = extract_aspects(clean_text)

    # Step 3: Per-aspect sentiment
    aspect_sentiments = analyze_aspects_sentiment(aspects_found, clean_text, rating)

    # Step 4: Determine overall sentiment from aspect majority vote
    if aspect_sentiments:
        sentiments = [v["sentiment"] for v in aspect_sentiments.values()]
        pos = sentiments.count("positive")
        neg = sentiments.count("negative")
        neu = sentiments.count("neutral")

        if pos > neg and pos >= neu:
            overall = "positive"
        elif neg > pos and neg >= neu:
            overall = "negative"
        else:
            overall = "neutral"
    else:
        overall = "neutral"

    # Determine method used
    methods = set(v.get("method", "rule_based") for v in aspect_sentiments.values())
    if "roberta_absa" in methods and "rule_based" in methods:
        method = "mixed"
    elif "roberta_absa" in methods:
        method = "roberta_absa"
    else:
        method = "rule_based"

    return {
        "aspects": aspect_sentiments,
        "overall_sentiment": overall,
        "analysis_method": method,
        "preprocessed_text": clean_text[:500]
    }


def run_absa_pipeline_batch(reviews: list) -> list:
    """
    Process multiple reviews through the ABSA pipeline.

    Args:
        reviews: list of dicts with at least 'text' and optionally 'rating'

    Returns:
        list of pipeline results matching input order
    """
    results = []
    for review in reviews:
        text = review.get("text") or review.get("body") or ""
        rating = review.get("rating")
        try:
            result = run_absa_pipeline(text, rating)
        except Exception as e:
            logger.error(f"Pipeline failed for review: {e}")
            result = {
                "aspects": {"General": {"sentiment": "neutral", "confidence": 0.3, "method": "error", "context": ""}},
                "overall_sentiment": "neutral",
                "analysis_method": "error",
                "preprocessed_text": ""
            }
        results.append(result)
    return results


def format_aspects_for_db(pipeline_result: dict) -> str:
    """
    Convert pipeline result to the JSON format stored in the aspects DB column.
    Maintains backward-compatible format: {aspect: sentiment_string}
    Also includes extended info for new aspects.
    """
    aspects = pipeline_result.get("aspects", {})
    # Keep backward-compat format for existing code
    simple_map = {k: v["sentiment"] for k, v in aspects.items()}
    return json.dumps(simple_map)


def get_aspects_detailed(pipeline_result: dict) -> dict:
    """Returns full aspect detail including confidence scores."""
    return pipeline_result.get("aspects", {})
