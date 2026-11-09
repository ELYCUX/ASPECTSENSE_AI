"""
Text Preprocessing — Clean and normalize review text before NLP analysis.
"""
import re
import html
import logging

logger = logging.getLogger(__name__)


def clean_html(text: str) -> str:
    """Remove HTML tags and decode HTML entities."""
    text = html.unescape(text)
    text = re.sub(r'<[^>]+>', ' ', text)
    return text


def clean_urls(text: str) -> str:
    """Remove URLs from text."""
    return re.sub(r'https?://\S+|www\.\S+', '', text)


def normalize_whitespace(text: str) -> str:
    """Collapse multiple spaces and strip."""
    return re.sub(r'\s+', ' ', text).strip()


def handle_emojis(text: str) -> str:
    """
    Replace common sentiment-carrying emojis with text markers.
    Remove truly decorative emojis to avoid confusing the tokenizer.
    """
    emoji_map = {
        '👍': ' great ',
        '👎': ' bad ',
        '❤️': ' love ',
        '💔': ' disappointed ',
        '😊': ' happy ',
        '😢': ' sad ',
        '😡': ' angry ',
        '⭐': ' star ',
        '✅': ' good ',
        '❌': ' bad ',
    }
    for emoji, replacement in emoji_map.items():
        text = text.replace(emoji, replacement)

    # Remove remaining emoji characters using Unicode range
    text = re.sub(r'[\U00010000-\U0010ffff]', ' ', text, flags=re.UNICODE)
    text = re.sub(r'[\U0001F600-\U0001F64F]', ' ', text, flags=re.UNICODE)
    text = re.sub(r'[\U0001F300-\U0001F5FF]', ' ', text, flags=re.UNICODE)
    return text


def is_english(text: str) -> bool:
    """
    Basic English language check.
    Returns True if text appears to be primarily ASCII/English.
    Non-English reviews are still processed but noted.
    """
    if not text:
        return False
    ascii_chars = sum(1 for c in text if ord(c) < 128)
    ratio = ascii_chars / len(text)
    return ratio > 0.75


def preprocess_text(text: str) -> str:
    """
    Full preprocessing pipeline:
    1. HTML cleaning
    2. URL removal
    3. Emoji handling
    4. Whitespace normalization
    """
    if not text or not text.strip():
        return ""

    text = clean_html(text)
    text = clean_urls(text)
    text = handle_emojis(text)
    text = normalize_whitespace(text)
    return text


def segment_sentences(text: str) -> list:
    """
    Segment text into sentences using SpaCy if available,
    otherwise fall back to simple sentence splitting.
    """
    from ai.model_loader import get_spacy_model
    nlp = get_spacy_model()

    if nlp is not None:
        doc = nlp(text)
        return [sent.text.strip() for sent in doc.sents if sent.text.strip()]
    else:
        # Simple fallback
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if s.strip()]
