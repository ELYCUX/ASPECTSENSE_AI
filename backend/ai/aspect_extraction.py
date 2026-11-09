"""
Aspect Extraction — SpaCy PhraseMatcher + keyword dictionary approach.
Returns detected aspects with their surrounding sentence context.
"""
import re
import logging

logger = logging.getLogger(__name__)

# ============================================================
# ASPECT DICTIONARY — canonical name → synonyms/keywords
# ============================================================
ASPECT_KEYWORDS = {
    "Battery": [
        "battery", "battery life", "battery backup", "battery drain", "charging",
        "charger", "charge", "power", "drain", "mah", "standby", "fast charge",
        "quick charge", "power bank", "overheating battery"
    ],
    "Camera": [
        "camera", "photo", "photos", "picture", "pictures", "video", "selfie",
        "lens", "megapixel", "mp", "camcorder", "photography", "image quality",
        "photo quality", "camera quality", "front camera", "rear camera", "zoom",
        "portrait", "night mode"
    ],
    "Display": [
        "display", "screen", "brightness", "resolution", "refresh rate",
        "colour", "color", "amoled", "oled", "lcd", "hd", "full hd", "4k",
        "viewing angles", "sunlight legibility", "bezel", "screen quality",
        "touchscreen", "touch screen"
    ],
    "Performance": [
        "performance", "speed", "fast", "slow", "lag", "lagging", "processor",
        "processing", "gaming", "benchmark", "snapdragon", "helio", "chip",
        "cpu", "gpu", "ram", "memory", "multitasking", "smooth", "sluggish",
        "heating", "heat", "overheat", "thermal", "frame rate", "fps"
    ],
    "Design": [
        "design", "appearance", "look", "looks", "stylish", "beautiful",
        "slim", "aesthetic", "finish", "color", "colour", "glass back",
        "matte", "glossy", "curved", "compact", "lightweight", "weight",
        "thin", "sleek"
    ],
    "Build Quality": [
        "build", "build quality", "material", "durability", "durable",
        "sturdy", "fragile", "plastic", "metal", "aluminum", "aluminium",
        "glass", "scratch", "scratches", "premium feel", "cheap feel",
        "solid", "flimsy", "robust"
    ],
    "Price": [
        "price", "cost", "expensive", "cheap", "value", "money", "worth",
        "budget", "affordable", "overpriced", "value for money", "premium",
        "pricing", "deal", "bang for buck", "great value"
    ],
    "Audio": [
        "audio", "sound", "speaker", "speakers", "microphone", "mic",
        "headphone", "earphone", "volume", "bass", "treble", "stereo",
        "noise cancellation", "aec", "call quality", "loud"
    ],
    "Connectivity": [
        "wifi", "wi-fi", "bluetooth", "5g", "4g", "lte", "nfc",
        "gps", "usb", "charger port", "signal", "network", "reception",
        "connectivity", "hotspot", "tethering"
    ],
    "Storage": [
        "storage", "memory", "internal", "microsd", "sd card", "rom",
        "gb", "tb", "space", "capacity"
    ],
    "Software": [
        "software", "ui", "ux", "interface", "android", "ios", "os",
        "update", "updates", "bloatware", "ads", "lag", "bugs", "bug",
        "app", "apps", "miui", "oneui", "coloros", "os version"
    ],
    "Delivery": [
        "delivery", "shipping", "arrived", "arrival", "courier", "dispatch",
        "package delivery", "delivered", "shipment", "on time", "delay",
        "delayed", "fast delivery", "quick delivery"
    ],
    "Packaging": [
        "packaging", "package", "box", "packing", "unboxing", "accessories",
        "in the box", "included", "contents"
    ],
    "Customer Support": [
        "support", "customer service", "service", "replacement", "refund",
        "return", "response", "warranty", "service center", "after sales",
        "helpdesk", "customer care", "exchange"
    ],
    "User Experience": [
        "easy to use", "user friendly", "comfortable", "ergonomic", "intuitive",
        "interface", "navigation", "setup", "configuration", "convenient"
    ],
    "Quality": [
        "quality", "excellent quality", "poor quality", "good quality",
        "high quality", "low quality", "well made", "poorly made"
    ],
    "Durability": [
        "durability", "durable", "long lasting", "last long", "withstand",
        "resistant", "waterproof", "water resistant", "shockproof", "drop"
    ],
    "Value for Money": [
        "value for money", "worth the price", "not worth", "overpriced",
        "underpriced", "good deal", "bad deal", "cost effective"
    ]
}


def _build_spacy_matcher(nlp):
    """Build a SpaCy PhraseMatcher using the aspect dictionary."""
    try:
        from spacy.matcher import PhraseMatcher
        matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
        for aspect, keywords in ASPECT_KEYWORDS.items():
            patterns = [nlp.make_doc(kw.lower()) for kw in keywords]
            matcher.add(aspect, patterns)
        return matcher
    except Exception as e:
        logger.error(f"Failed to build SpaCy matcher: {e}")
        return None


def _rule_based_extract(text: str) -> list:
    """
    Fallback rule-based aspect extraction when SpaCy is unavailable.
    Returns list of (aspect, matched_keyword, sentence_context)
    """
    lower_text = text.lower()
    results = []
    # Simple sentence splitting
    import re as _re
    sentences = _re.split(r'(?<=[.!?])\s+', text)

    for aspect, keywords in ASPECT_KEYWORDS.items():
        for kw in keywords:
            if kw in lower_text:
                # Find the sentence that contains this keyword
                context = text
                for sent in sentences:
                    if kw in sent.lower():
                        context = sent
                        break
                results.append({
                    "aspect": aspect,
                    "matched_text": kw,
                    "context_sentence": context
                })
                break  # One match per aspect is sufficient

    return results


def extract_aspects(text: str) -> list:
    """
    Extract product aspects from review text.
    Uses SpaCy PhraseMatcher if available, falls back to rule-based.

    Returns:
        list of dicts: [{aspect, matched_text, context_sentence}]
    """
    if not text or not text.strip():
        return []

    from ai.model_loader import get_spacy_model
    nlp = get_spacy_model()

    if nlp is None:
        return _rule_based_extract(text)

    try:
        matcher = _build_spacy_matcher(nlp)
        if matcher is None:
            return _rule_based_extract(text)

        doc = nlp(text)
        matches = matcher(doc)

        # Collect unique aspects with their context sentence
        aspect_results = {}
        for match_id, start, end in matches:
            aspect = nlp.vocab.strings[match_id]
            matched_text = doc[start:end].text

            # Find the sentence containing this span
            token = doc[start]
            context_sentence = token.sent.text.strip()

            if aspect not in aspect_results:
                aspect_results[aspect] = {
                    "aspect": aspect,
                    "matched_text": matched_text,
                    "context_sentence": context_sentence
                }

        return list(aspect_results.values())

    except Exception as e:
        logger.error(f"SpaCy aspect extraction failed: {e}. Falling back to rule-based.")
        return _rule_based_extract(text)
