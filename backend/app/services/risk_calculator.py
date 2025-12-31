from app.models.schemas import (
    RiskLevel,
    HomographAnalysis,
    DomainAgeAnalysis,
    SSLAnalysis,
    BrandSimilarityAnalysis,
    FormAnalysis,
)


WEIGHTS = {
    "homograph": 0.25,
    "domain_age": 0.15,
    "ssl": 0.15,
    "brand_similarity": 0.30,
    "form_analysis": 0.15,
}


def calculate_risk_score(
    homograph: HomographAnalysis,
    domain_age: DomainAgeAnalysis,
    ssl: SSLAnalysis,
    brand_similarity: BrandSimilarityAnalysis,
    form_analysis: FormAnalysis | None,
) -> tuple[int, RiskLevel]:
    scores = {
        "homograph": homograph.score,
        "domain_age": domain_age.score,
        "ssl": ssl.score,
        "brand_similarity": brand_similarity.score,
        "form_analysis": form_analysis.score if form_analysis else 0,
    }
    
    if form_analysis is None:
        adjusted_weights = {k: v for k, v in WEIGHTS.items() if k != "form_analysis"}
        total_weight = sum(adjusted_weights.values())
        adjusted_weights = {k: v / total_weight for k, v in adjusted_weights.items()}
    else:
        adjusted_weights = WEIGHTS
    
    weighted_score = sum(
        scores[key] * adjusted_weights.get(key, 0)
        for key in scores
    )
    
    if homograph.has_homographs and brand_similarity.is_suspicious:
        weighted_score = min(weighted_score * 1.3, 100)
    
    if domain_age.is_new_domain and brand_similarity.is_suspicious:
        weighted_score = min(weighted_score * 1.2, 100)
    
    final_score = round(weighted_score)
    risk_level = determine_risk_level(final_score)
    
    return final_score, risk_level


def determine_risk_level(score: int) -> RiskLevel:
    if score >= 80:
        return RiskLevel.CRITICAL
    if score >= 60:
        return RiskLevel.HIGH
    if score >= 40:
        return RiskLevel.MEDIUM
    if score >= 20:
        return RiskLevel.LOW
    return RiskLevel.SAFE


def generate_recommendations(
    homograph: HomographAnalysis,
    domain_age: DomainAgeAnalysis,
    ssl: SSLAnalysis,
    brand_similarity: BrandSimilarityAnalysis,
    form_analysis: FormAnalysis | None,
    risk_level: RiskLevel,
) -> list[str]:
    recommendations = []
    
    if homograph.has_homographs:
        recommendations.append(
            f"This domain contains suspicious Unicode characters that mimic standard letters. "
            f"The actual domain is: {homograph.punycode_domain or homograph.original_domain}"
        )
    
    if domain_age.is_new_domain:
        recommendations.append(
            f"This domain was registered only {domain_age.age_days} days ago. "
            f"Exercise caution with newly created websites."
        )
    
    if not ssl.has_ssl:
        recommendations.append(
            "This website does not use HTTPS encryption. "
            "Avoid entering sensitive information."
        )
    elif not ssl.is_valid:
        recommendations.append(
            "The SSL certificate for this website is invalid or expired. "
            "Your connection may not be secure."
        )
    
    if brand_similarity.is_suspicious and brand_similarity.matched_brand:
        recommendations.append(
            f"This domain is similar to '{brand_similarity.matched_brand}' "
            f"({brand_similarity.highest_similarity:.0%} match). "
            f"This could be an impersonation attempt."
        )
    
    if form_analysis:
        if form_analysis.external_actions:
            recommendations.append(
                f"Forms on this page submit data to external domains: "
                f"{', '.join(form_analysis.external_actions)}"
            )
        
        if form_analysis.password_fields > 2:
            recommendations.append(
                "This page requests multiple passwords, which is unusual for legitimate sites."
            )
    
    if risk_level == RiskLevel.SAFE:
        recommendations.append("No significant threats detected. Always remain vigilant.")
    
    return recommendations
