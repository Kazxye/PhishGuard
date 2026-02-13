from app.models.schemas import (
    RiskLevel,
    HomographAnalysis,
    DomainAgeAnalysis,
    SSLAnalysis,
    BrandSimilarityAnalysis,
    FormAnalysis,
    VirusTotalAnalysis,
)


WEIGHTS = {
    "homograph": 0.20,
    "domain_age": 0.10,
    "ssl": 0.10,
    "brand_similarity": 0.25,
    "form_analysis": 0.10,
    "virustotal": 0.25,
}


def calculate_risk_score(
    homograph: HomographAnalysis,
    domain_age: DomainAgeAnalysis,
    ssl: SSLAnalysis,
    brand_similarity: BrandSimilarityAnalysis,
    form_analysis: FormAnalysis | None,
    virustotal: VirusTotalAnalysis | None = None,
) -> tuple[int, RiskLevel]:
    scores = {
        "homograph": homograph.score,
        "domain_age": domain_age.score,
        "ssl": ssl.score,
        "brand_similarity": brand_similarity.score,
        "form_analysis": form_analysis.score if form_analysis else 0,
        "virustotal": virustotal.score if virustotal and virustotal.available else 0,
    }

    excluded = set()
    if form_analysis is None:
        excluded.add("form_analysis")
    if virustotal is None or not virustotal.available:
        excluded.add("virustotal")

    if excluded:
        active_weights = {k: v for k, v in WEIGHTS.items() if k not in excluded}
        total = sum(active_weights.values())
        adjusted_weights = {k: v / total for k, v in active_weights.items()}
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

    vt_available = virustotal and virustotal.available
    if vt_available and virustotal.malicious >= 1 and brand_similarity.is_suspicious:
        weighted_score = min(weighted_score * 1.4, 100)

    if vt_available and virustotal.malicious >= 5:
        weighted_score = max(weighted_score, 80)

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
    virustotal: VirusTotalAnalysis | None = None,
) -> list[str]:
    recommendations = []

    vt_available = virustotal and virustotal.available
    if vt_available and virustotal.malicious > 0:
        recommendations.append(
            f"VirusTotal: {virustotal.malicious} engine(s) flagged this URL as malicious "
            f"({virustotal.detection_rate:.1f}% detection rate). "
            f"Exercise extreme caution."
        )

    if vt_available and virustotal.suspicious > 0 and virustotal.malicious == 0:
        recommendations.append(
            f"VirusTotal: {virustotal.suspicious} engine(s) flagged this URL as suspicious. "
            f"Proceed with caution."
        )

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
        if vt_available and virustotal.malicious == 0 and virustotal.suspicious == 0:
            recommendations.append(
                f"No threats detected. VirusTotal confirmed safe across "
                f"{virustotal.total_engines} security engines."
            )
        else:
            recommendations.append("No significant threats detected. Always remain vigilant.")

    return recommendations