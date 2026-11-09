import difflib

def normalize_for_duplicate_check(text):
    return " ".join(text.lower().strip().split())

def check_duplicate(new_text, existing_texts):
    new_norm = normalize_for_duplicate_check(new_text)
    
    for ex in existing_texts:
        ex_norm = normalize_for_duplicate_check(ex)
        
        # 1. Exact match
        if new_norm == ex_norm:
            return "Duplicate"
        
        # 2. Very similar text
        similarity = difflib.SequenceMatcher(None, new_norm, ex_norm).ratio()
        if similarity > 0.85:
            return "Possible Duplicate"
            
    return "Unique"
