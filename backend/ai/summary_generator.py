"""
AI Summary Generator — LangChain-based (or extractive fallback) product review summaries.
Uses OpenAI/Google if keys provided; falls back to data-driven extractive summary.
"""
import os
import logging
from config.db import execute_query

logger = logging.getLogger(__name__)


def _get_llm():
    """
    Return a LangChain LLM based on environment config.
    Returns None if no LLM is configured.
    """
    provider = os.environ.get("SUMMARY_PROVIDER", "").lower()
    model = os.environ.get("SUMMARY_MODEL", "")

    if provider == "openai" and os.environ.get("OPENAI_API_KEY"):
        try:
            from langchain_openai import ChatOpenAI
            model_name = model or "gpt-3.5-turbo"
            return ChatOpenAI(model=model_name, temperature=0.3, max_tokens=800)
        except ImportError:
            logger.warning("langchain-openai not installed.")
            return None

    elif provider == "google" and os.environ.get("GOOGLE_API_KEY"):
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            model_name = model or "gemini-1.5-flash"
            return ChatGoogleGenerativeAI(model=model_name, temperature=0.3)
        except ImportError:
            logger.warning("langchain-google-genai not installed.")
            return None

    return None


def _extractive_summary(product_name: str, aspects_data: dict, sentiment_counts: dict, review_count: int) -> dict:
    """
    Build a data-driven extractive summary without LLM.
    Uses actual aspect sentiment data to construct sentences.
    """
    pos_aspects = [
        a for a, d in aspects_data.items()
        if d.get("positive", 0) > d.get("negative", 0)
    ]
    neg_aspects = [
        a for a, d in aspects_data.items()
        if d.get("negative", 0) > d.get("positive", 0)
    ]
    neutral_aspects = [
        a for a, d in aspects_data.items()
        if a not in pos_aspects and a not in neg_aspects
    ]

    # Sort by count descending
    pos_aspects = sorted(pos_aspects, key=lambda a: aspects_data[a].get("positive", 0), reverse=True)
    neg_aspects = sorted(neg_aspects, key=lambda a: aspects_data[a].get("negative", 0), reverse=True)

    total = sentiment_counts.get("positive", 0) + sentiment_counts.get("negative", 0) + sentiment_counts.get("neutral", 0)
    if total == 0:
        total = 1
    pos_pct = round((sentiment_counts.get("positive", 0) / total) * 100)

    # Overall summary
    if pos_pct >= 70:
        tone = "highly positive"
    elif pos_pct >= 50:
        tone = "generally positive"
    elif pos_pct >= 30:
        tone = "mixed"
    else:
        tone = "predominantly negative"

    pos_str = ", ".join(pos_aspects[:3]) if pos_aspects else "general product experience"
    neg_str = ", ".join(neg_aspects[:3]) if neg_aspects else None

    summary = f"Customer feedback for {product_name} is {tone} with {pos_pct}% positive reviews across {review_count} responses."

    if pos_aspects:
        summary += f" Customers consistently appreciate the {pos_str}."

    if neg_aspects:
        summary += f" However, concerns are frequently raised about the {', '.join(neg_aspects[:2])}."

    positive_highlights = []
    for a in pos_aspects[:5]:
        d = aspects_data[a]
        positive_highlights.append(
            f"{a}: {d.get('positive', 0)} positive mentions vs {d.get('negative', 0)} negative"
        )

    negative_highlights = []
    for a in neg_aspects[:5]:
        d = aspects_data[a]
        negative_highlights.append(
            f"{a}: {d.get('negative', 0)} negative mentions vs {d.get('positive', 0)} positive"
        )

    recommendations = []
    for a in neg_aspects[:3]:
        recommendations.append(f"Address customer concerns about {a} to improve overall satisfaction.")

    if not recommendations:
        recommendations.append("Maintain current product quality and customer service standards.")

    return {
        "overall_summary": summary,
        "positive_highlights": positive_highlights,
        "negative_highlights": negative_highlights,
        "neutral_feedback": [f"{a}: Neutral reception" for a in neutral_aspects[:3]],
        "most_discussed_aspects": sorted(aspects_data.keys(), key=lambda a: sum(aspects_data[a].values()), reverse=True)[:5],
        "recommendations": recommendations,
        "model_used": "extractive_summary",
        "is_llm_generated": False
    }


def _llm_summary(llm, product_name: str, aspects_data: dict, sentiment_counts: dict, review_count: int, sample_reviews: list = None) -> dict:
    """Generate summary using LangChain LLM."""
    try:
        from langchain.prompts import ChatPromptTemplate

        # Build aspect summary string
        aspect_str = ""
        for asp, counts in aspects_data.items():
            total = counts.get("positive", 0) + counts.get("negative", 0) + counts.get("neutral", 0)
            if total > 0:
                pos_pct = round((counts.get("positive", 0) / total) * 100)
                aspect_str += f"- {asp}: {pos_pct}% positive ({total} mentions)\n"

        sample_text = ""
        if sample_reviews:
            sample_text = "\n\nSample reviews:\n"
            for r in sample_reviews[:5]:
                sample_text += f'- "{r}"\n'

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", "You are a product analyst summarizing customer reviews for an e-commerce analytics platform. Be factual, concise, and grounded in the data provided. Never invent information."),
            ("human", """Analyze the following customer review data for product: {product_name}

Total Reviews: {total_reviews}
Positive: {positive} | Negative: {negative} | Neutral: {neutral}

Aspect-wise sentiment:
{aspects}
{samples}

Generate a structured analysis with these exact sections:
1. OVERALL SUMMARY (2-3 sentences)
2. POSITIVE HIGHLIGHTS (3-5 bullet points)
3. NEGATIVE HIGHLIGHTS (3-5 bullet points)
4. RECOMMENDATIONS (2-3 actionable suggestions)

Be specific and data-driven. Do not invent customer complaints.""")
        ])

        prompt = prompt_template.format_messages(
            product_name=product_name,
            total_reviews=review_count,
            positive=sentiment_counts.get("positive", 0),
            negative=sentiment_counts.get("negative", 0),
            neutral=sentiment_counts.get("neutral", 0),
            aspects=aspect_str,
            samples=sample_text
        )

        response = llm.invoke(prompt)
        content = response.content if hasattr(response, 'content') else str(response)

        # Parse sections from response
        sections = {"overall_summary": "", "positive_highlights": [], "negative_highlights": [], "recommendations": []}

        current_section = None
        for line in content.split('\n'):
            line = line.strip()
            if not line:
                continue
            if "OVERALL SUMMARY" in line.upper():
                current_section = "overall_summary"
            elif "POSITIVE HIGHLIGHTS" in line.upper():
                current_section = "positive_highlights"
            elif "NEGATIVE HIGHLIGHTS" in line.upper():
                current_section = "negative_highlights"
            elif "RECOMMEND" in line.upper():
                current_section = "recommendations"
            elif current_section == "overall_summary" and line and not line.startswith('#'):
                sections["overall_summary"] += line + " "
            elif current_section in ("positive_highlights", "negative_highlights", "recommendations"):
                if line.startswith(('-', '•', '*', '1', '2', '3', '4', '5')):
                    clean = line.lstrip('-•*0123456789. ').strip()
                    if clean:
                        sections[current_section].append(clean)

        if not sections["overall_summary"]:
            sections["overall_summary"] = content[:500]

        return {
            "overall_summary": sections["overall_summary"].strip(),
            "positive_highlights": sections["positive_highlights"],
            "negative_highlights": sections["negative_highlights"],
            "neutral_feedback": [],
            "most_discussed_aspects": sorted(aspects_data.keys(), key=lambda a: sum(aspects_data[a].values()), reverse=True)[:5],
            "recommendations": sections["recommendations"],
            "model_used": str(llm.__class__.__name__),
            "is_llm_generated": True
        }

    except Exception as e:
        logger.error(f"LLM summary failed: {e}")
        return None


def generate_product_summary(product_id: int) -> dict:
    """
    Generate an AI summary for a product using its review data.
    Stores result in ai_summaries table.

    Args:
        product_id: Product ID

    Returns:
        dict with summary sections
    """
    try:
        # Fetch product info
        product = execute_query("SELECT * FROM products WHERE id = $1", [product_id], fetch_one=True)
        if not product:
            return {"error": "Product not found"}

        product_name = product.get("name", f"Product #{product_id}")

        # Fetch aspect data from reviews
        rows = execute_query(
            "SELECT aspects, sentiment FROM reviews WHERE product_id = $1 AND aspects IS NOT NULL",
            [product_id], fetch_all=True
        )

        import json as _json
        aspects_data = {}
        sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}

        for row in rows:
            sent = row.get("sentiment", "neutral")
            if sent in sentiment_counts:
                sentiment_counts[sent] += 1

            raw = row.get("aspects")
            if raw:
                if isinstance(raw, str):
                    try:
                        aspects = _json.loads(raw)
                    except Exception:
                        continue
                else:
                    aspects = raw

                for asp, s in aspects.items():
                    if asp not in aspects_data:
                        aspects_data[asp] = {"positive": 0, "negative": 0, "neutral": 0}
                    if s in aspects_data[asp]:
                        aspects_data[asp][s] += 1

        review_count = len(rows)

        # Fetch sample review texts
        sample_rows = execute_query(
            "SELECT body FROM reviews WHERE product_id = $1 ORDER BY created_at DESC LIMIT 6",
            [product_id], fetch_all=True
        )
        sample_texts = [r["body"] for r in sample_rows if r.get("body")]

        # Try LLM first, fall back to extractive
        llm = _get_llm()
        if llm:
            result = _llm_summary(llm, product_name, aspects_data, sentiment_counts, review_count, sample_texts)
            if result is None:
                result = _extractive_summary(product_name, aspects_data, sentiment_counts, review_count)
        else:
            result = _extractive_summary(product_name, aspects_data, sentiment_counts, review_count)

        # Store in ai_summaries table
        import json as _json2
        try:
            execute_query(
                """INSERT INTO ai_summaries (product_id, summary_text, positive_highlights, negative_highlights, recommendations, model_used)
                   VALUES ($1, $2, $3, $4, $5, $6)
                   ON CONFLICT (product_id) DO UPDATE SET
                     summary_text = EXCLUDED.summary_text,
                     positive_highlights = EXCLUDED.positive_highlights,
                     negative_highlights = EXCLUDED.negative_highlights,
                     recommendations = EXCLUDED.recommendations,
                     model_used = EXCLUDED.model_used,
                     created_at = NOW()""",
                [
                    product_id,
                    result.get("overall_summary", ""),
                    _json2.dumps(result.get("positive_highlights", [])),
                    _json2.dumps(result.get("negative_highlights", [])),
                    _json2.dumps(result.get("recommendations", [])),
                    result.get("model_used", "extractive")
                ]
            )
        except Exception as db_err:
            logger.warning(f"Could not store summary (table may not exist yet): {db_err}")

        return result

    except Exception as e:
        logger.error(f"Summary generation failed for product {product_id}: {e}")
        return {"error": str(e)}
