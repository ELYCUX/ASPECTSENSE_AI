import re

# Aspect Dictionary
ASPECTS_DICT = {
    "Battery": ["battery", "battery life", "charging", "charge", "charger", "power", "drain"],
    "Camera": ["camera", "photo", "photos", "picture", "pictures", "video", "selfie", "lens"],
    "Display": ["display", "screen", "brightness", "resolution", "refresh rate", "color", "colours"],
    "Performance": ["performance", "speed", "fast", "slow", "lag", "lagging", "processor", "processing", "gaming"],
    "Design": ["design", "appearance", "look", "looks", "stylish", "beautiful"],
    "Build Quality": ["build", "build quality", "material", "durability", "durable", "sturdy", "fragile"],
    "Price": ["price", "cost", "expensive", "cheap", "value", "money", "worth"],
    "Delivery": ["delivery", "shipping", "arrived", "arrival", "courier", "package delivery"],
    "Packaging": ["packaging", "package", "box", "packing"],
    "Customer Support": ["support", "customer service", "service", "replacement", "refund", "response"]
}

# Sentiment Dictionary
POSITIVE_WORDS = [
    "excellent", "amazing", "good", "great", "best", "awesome", "fantastic", "perfect",
    "beautiful", "impressive", "smooth", "fast", "reliable", "durable", "worth", "satisfied",
    "happy", "love", "loved", "recommend", "recommended"
]

NEGATIVE_WORDS = [
    "bad", "poor", "terrible", "worst", "awful", "slow", "lag", "laggy", "disappointing",
    "disappointed", "broken", "issue", "problem", "problems", "drain", "drains", "expensive",
    "fragile", "hate", "hated", "unreliable", "defective"
]

NEUTRAL_WORDS = ["okay", "average", "normal", "fine", "decent", "acceptable", "moderate"]

NEGATION_WORDS = ["not", "no", "never", "nothing", "nowhere", "hardly", "scarcely", "barely", "doesn't", "isn't", "wasn't", "shouldn't", "wouldn't", "couldn't", "won't", "can't", "don't"]

def normalize_text(text):
    text = text.lower()
    text = re.sub(r'[.,!?]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def check_negation(words_list, index, window_size=3):
    start = max(0, index - window_size)
    for i in range(start, index):
        if words_list[i] in NEGATION_WORDS:
            return True
    return False

def flip_sentiment(sentiment):
    if sentiment == "positive": return "negative"
    if sentiment == "negative": return "positive"
    return "neutral"

def analyze_review(text, rating):
    norm_text = normalize_text(text)
    words = norm_text.split()
    
    aspect_findings = {}
    
    # Simple aspect detection
    for aspect_name, keywords in ASPECTS_DICT.items():
        found = False
        for kw in keywords:
            if kw in norm_text:
                found = True
                break
        
        if found:
            # Aspect found, let's find context (within 5 words distance)
            aspect_indices = [i for i, w in enumerate(words) if any(kw in w for kw in keywords)]
            assigned_sentiment = None
            rule_confidence = "Low"
            
            for index in aspect_indices:
                start = max(0, index - 5)
                end = min(len(words), index + 6)
                context_words = words[start:end]
                
                # Check for sentiment in context window
                context_sentiment = None
                sentiment_index = -1
                
                for i, cw in enumerate(context_words):
                    if cw in POSITIVE_WORDS:
                        context_sentiment = "positive"
                        sentiment_index = start + i
                        break
                    elif cw in NEGATIVE_WORDS:
                        context_sentiment = "negative"
                        sentiment_index = start + i
                        break
                    elif cw in NEUTRAL_WORDS:
                        context_sentiment = "neutral"
                        sentiment_index = start + i
                        break
                
                if context_sentiment:
                    if check_negation(words, sentiment_index):
                        context_sentiment = flip_sentiment(context_sentiment)
                    assigned_sentiment = context_sentiment
                    rule_confidence = "High"
                    break
            
            if not assigned_sentiment:
                # Target Rating Fallback
                rule_confidence = "Low"
                if rating >= 4:
                    assigned_sentiment = "positive"
                elif rating == 3:
                    assigned_sentiment = "neutral"
                else:
                    assigned_sentiment = "negative"
            
            aspect_findings[aspect_name] = {
                "sentiment": assigned_sentiment,
                "confidence": rule_confidence,
                "method": "RULE_BASED" if rule_confidence == "High" else "RATING_FALLBACK"
            }
            
    # Default behavior if no aspects are detected
    if not aspect_findings:
        if rating >= 4:
            sent = "positive"
        elif rating == 3:
            sent = "neutral"
        else:
            sent = "negative"
            
        aspect_findings["General"] = {
            "sentiment": sent,
            "confidence": "Low",
            "method": "RATING_FALLBACK"
        }
        
    return aspect_findings

def extract_aspect_sentiment_map(analysis_results):
    return {k: v["sentiment"] for k, v in analysis_results.items()}
