import re
from collections import Counter

STOP_WORDS = set([
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", 
    "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", 
    "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", 
    "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", 
    "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", 
    "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", 
    "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", 
    "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", 
    "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", 
    "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", 
    "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", 
    "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"
])

def get_word_frequencies(texts_list, top_n=20):
    all_words = []
    
    for text in texts_list:
        text = text.lower()
        # Remove punctuation
        text = re.sub(r'[^\w\s]', '', text)
        words = text.split()
        
        # Filter stop words and short words
        words = [w for w in words if w not in STOP_WORDS and len(w) > 2]
        all_words.extend(words)
        
    counts = Counter(all_words)
    
    return [{"word": w, "count": c} for w, c in counts.most_common(top_n)]
