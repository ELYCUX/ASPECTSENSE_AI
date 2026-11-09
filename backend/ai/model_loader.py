"""
Model Loader — Singleton pattern for SpaCy and HuggingFace models.
Models are loaded lazily and cached in memory. Never loaded more than once per process.
"""
import os
import sys
import logging

logger = logging.getLogger(__name__)

_spacy_model = None
_absa_pipeline = None
_spacy_available = None
_transformers_available = None


def is_spacy_available() -> bool:
    global _spacy_available
    if _spacy_available is None:
        try:
            import spacy
            _spacy_available = True
        except ImportError:
            _spacy_available = False
    return _spacy_available


def is_transformers_available() -> bool:
    global _transformers_available
    if _transformers_available is None:
        try:
            import transformers
            _transformers_available = True
        except ImportError:
            _transformers_available = False
    return _transformers_available


def get_spacy_model():
    """
    Returns the SpaCy en_core_web_sm model singleton.
    Downloads model if not present.
    Returns None if SpaCy is not installed.
    """
    global _spacy_model
    if _spacy_model is not None:
        return _spacy_model

    if not is_spacy_available():
        logger.warning("SpaCy is not installed. Falling back to rule-based extraction.")
        return None

    import spacy
    try:
        _spacy_model = spacy.load("en_core_web_sm")
        logger.info("SpaCy model 'en_core_web_sm' loaded successfully.")
    except OSError:
        logger.info("SpaCy model not found locally. Downloading en_core_web_sm...")
        try:
            from spacy.cli import download
            download("en_core_web_sm")
            _spacy_model = spacy.load("en_core_web_sm")
            logger.info("SpaCy model downloaded and loaded.")
        except Exception as e:
            logger.error(f"Failed to download SpaCy model: {e}")
            _spacy_model = None

    return _spacy_model


def get_absa_pipeline():
    """
    Returns the HuggingFace ABSA sentiment pipeline singleton.
    Uses gauneg/roberta-base-absa-ate-sentiment.
    Returns None if transformers is not installed or model fails to load.
    """
    global _absa_pipeline
    if _absa_pipeline is not None:
        return _absa_pipeline

    if not is_transformers_available():
        logger.warning("Transformers not installed. Falling back to rule-based sentiment.")
        return None

    model_name = os.environ.get("ABSA_MODEL", "yangheng/deberta-v3-base-absa-v1.1")
    # Note: yangheng/deberta-v3-base-absa-v1.1 is well-tested for ABSA.
    # gauneg/roberta-base-absa-ate-sentiment is the spec but may not be reliably hosted.
    # We try the spec model first and fall back to the deberta model.

    spec_model = "gauneg/roberta-base-absa-ate-sentiment"

    import torch
    try:
        from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification

        logger.info(f"Loading ABSA model: {spec_model}")
        try:
            _absa_pipeline = pipeline(
                "text-classification",
                model=spec_model,
                tokenizer=spec_model,
                device=-1,  # CPU
                torch_dtype=torch.float32,
                top_k=None
            )
            logger.info(f"ABSA model loaded: {spec_model}")
        except Exception as e:
            logger.warning(f"Could not load {spec_model}: {e}. Trying fallback model.")
            try:
                _absa_pipeline = pipeline(
                    "text-classification",
                    model=model_name,
                    tokenizer=model_name,
                    device=-1,
                    torch_dtype=torch.float32,
                    top_k=None
                )
                logger.info(f"ABSA model loaded (fallback): {model_name}")
            except Exception as e2:
                logger.error(f"Both ABSA models failed to load: {e2}")
                _absa_pipeline = None

    except Exception as e:
        logger.error(f"Failed to initialize ABSA pipeline: {e}")
        _absa_pipeline = None

    return _absa_pipeline


def get_model_info() -> dict:
    """Returns info about which models are available."""
    return {
        "spacy_available": is_spacy_available(),
        "spacy_model_loaded": _spacy_model is not None,
        "transformers_available": is_transformers_available(),
        "absa_model_loaded": _absa_pipeline is not None,
        "analysis_method": "roberta_absa" if _absa_pipeline is not None else "rule_based"
    }
