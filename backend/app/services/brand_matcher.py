import Levenshtein

from app.config import get_settings
from app.data.known_brands import BRAND_LIST
from app.models.schemas import BrandSimilarityAnalysis


def analyze_brand_similarity(domain: str) -> BrandSimilarityAnalysis:
    settings = get_settings()
    
    domain_name = extract_domain_name(domain)
    
    matches = []
    highest_similarity = 0.0
    matched_brand = None
    
    for brand in BRAND_LIST:
        similarity = calculate_similarity(domain_name, brand)
        
        if similarity >= settings.similarity_threshold:
            matches.append({
                "brand": brand,
                "similarity": round(similarity, 3),
                "is_exact": similarity == 1.0,
            })
            
            if similarity > highest_similarity:
                highest_similarity = similarity
                matched_brand = brand
    
    is_exact_match = any(m["is_exact"] for m in matches)
    is_suspicious = len(matches) > 0 and not is_exact_match
    
    matches.sort(key=lambda x: x["similarity"], reverse=True)
    
    score = calculate_brand_score(highest_similarity, is_exact_match, is_suspicious)
    
    return BrandSimilarityAnalysis(
        matches=matches[:5],
        highest_similarity=round(highest_similarity, 3),
        matched_brand=matched_brand,
        is_suspicious=is_suspicious,
        score=score,
    )


def extract_domain_name(domain: str) -> str:
    parts = domain.lower().split(".")
    
    if len(parts) >= 2:
        sld = parts[-2]
        
        if sld in ("com", "co", "org", "net", "gov") and len(parts) >= 3:
            return parts[-3]
        
        return sld
    
    return domain.lower()


def calculate_similarity(text1: str, text2: str) -> float:
    if text1 == text2:
        return 1.0
    
    ratio = Levenshtein.ratio(text1, text2)
    
    if text2 in text1 or text1 in text2:
        containment_boost = 0.1
        ratio = min(ratio + containment_boost, 1.0)
    
    common_substitutions = [
        ("0", "o"), ("1", "l"), ("1", "i"), ("3", "e"),
        ("4", "a"), ("5", "s"), ("8", "b"), ("@", "a"),
    ]
    
    modified_text1 = text1
    for sub_from, sub_to in common_substitutions:
        modified_text1 = modified_text1.replace(sub_from, sub_to)
    
    if modified_text1 != text1:
        modified_ratio = Levenshtein.ratio(modified_text1, text2)
        if modified_ratio > ratio:
            ratio = modified_ratio
    
    return ratio


def calculate_brand_score(
    highest_similarity: float,
    is_exact_match: bool,
    is_suspicious: bool,
) -> int:
    if is_exact_match:
        return 0
    
    if not is_suspicious:
        return 0
    
    if highest_similarity >= 0.95:
        return 85
    
    if highest_similarity >= 0.90:
        return 70
    
    if highest_similarity >= 0.85:
        return 55
    
    if highest_similarity >= 0.80:
        return 40
    
    return 25
