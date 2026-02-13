import asyncio
from datetime import datetime, timezone
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    HealthResponse,
)
from app.services.homograph_detector import analyze_homographs
from app.services.whois_service import query_whois
from app.services.ssl_checker import check_ssl
from app.services.brand_matcher import analyze_brand_similarity
from app.services.form_analyzer import analyze_forms
from app.services.virustotal_service import analyze_virustotal
from app.services.risk_calculator import calculate_risk_score, generate_recommendations


router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    settings = get_settings()
    return HealthResponse(
        status="healthy",
        version=settings.version,
        timestamp=datetime.now(timezone.utc),
    )


@router.post("/analyze", response_model=AnalysisResponse, tags=["Analysis"])
async def analyze_url(request: AnalysisRequest):
    try:
        parsed_url = urlparse(str(request.url))
        domain = parsed_url.netloc

        if not domain:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid URL: could not extract domain",
            )

        domain = domain.lower().removeprefix("www.")

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid URL format: {str(e)}",
        )

    homograph_result, whois_result, ssl_result, brand_result, vt_result = (
        await asyncio.gather(
            asyncio.to_thread(analyze_homographs, domain),
            asyncio.to_thread(query_whois, domain),
            asyncio.to_thread(check_ssl, domain),
            asyncio.to_thread(analyze_brand_similarity, domain),
            analyze_virustotal(str(request.url)),
        )
    )

    form_result = None
    if request.html_content:
        form_result = await asyncio.to_thread(
            analyze_forms, request.html_content, domain,
        )

    risk_score, risk_level = calculate_risk_score(
        homograph=homograph_result,
        domain_age=whois_result,
        ssl=ssl_result,
        brand_similarity=brand_result,
        form_analysis=form_result,
        virustotal=vt_result,
    )

    recommendations = generate_recommendations(
        homograph=homograph_result,
        domain_age=whois_result,
        ssl=ssl_result,
        brand_similarity=brand_result,
        form_analysis=form_result,
        virustotal=vt_result,
        risk_level=risk_level,
    )

    return AnalysisResponse(
        url=str(request.url),
        domain=domain,
        risk_level=risk_level,
        risk_score=risk_score,
        homograph=homograph_result,
        domain_age=whois_result,
        ssl=ssl_result,
        brand_similarity=brand_result,
        form_analysis=form_result,
        virustotal=vt_result if vt_result.available else None,
        analyzed_at=datetime.now(timezone.utc),
        recommendations=recommendations,
    )


@router.get("/brands", tags=["Reference"])
async def list_monitored_brands():
    from app.data.known_brands import KNOWN_BRANDS

    return {
        "total_brands": sum(len(brands) for brands in KNOWN_BRANDS.values()),
        "categories": {
            category: len(brands)
            for category, brands in KNOWN_BRANDS.items()
        },
    }