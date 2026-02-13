import base64
from urllib.parse import urlparse

import httpx

from app.config import get_settings
from app.models.schemas import VirusTotalAnalysis
from app.services.cache_service import virustotal_cache

VT_API_BASE = "https://www.virustotal.com/api/v3"


async def analyze_virustotal(url: str) -> VirusTotalAnalysis:
    settings = get_settings()

    if not settings.virustotal_enabled:
        return VirusTotalAnalysis(available=False, score=0)

    parsed = urlparse(url)
    domain = parsed.netloc.lower().removeprefix("www.")

    cached = virustotal_cache.get(f"vt:{domain}")
    if cached:
        return cached

    try:
        result = await fetch_url_report(url, settings)
    except Exception:
        result = VirusTotalAnalysis(available=False, score=0)

    virustotal_cache.set(f"vt:{domain}", result, settings.cache_ttl_virustotal)
    return result


async def fetch_url_report(url: str, settings) -> VirusTotalAnalysis:
    url_id = _encode_url_id(url)
    headers = {"x-apikey": settings.virustotal_api_key}

    async with httpx.AsyncClient(timeout=settings.virustotal_timeout) as client:
        response = await client.get(
            f"{VT_API_BASE}/urls/{url_id}",
            headers=headers,
        )

        if response.status_code == 404:
            return await _submit_and_fetch(client, url, headers, settings)

        if response.status_code == 401:
            return VirusTotalAnalysis(available=False, score=0)

        if response.status_code != 200:
            return VirusTotalAnalysis(available=False, score=0)

        return _parse_response(response.json())


async def _submit_and_fetch(
    client: httpx.AsyncClient,
    url: str,
    headers: dict,
    settings,
) -> VirusTotalAnalysis:
    submit_response = await client.post(
        f"{VT_API_BASE}/urls",
        headers=headers,
        data={"url": url},
    )

    if submit_response.status_code not in (200, 201):
        return VirusTotalAnalysis(available=False, score=0)

    submit_data = submit_response.json()
    analysis_id = submit_data.get("data", {}).get("id")

    if not analysis_id:
        return VirusTotalAnalysis(available=False, score=0)

    import asyncio

    for _ in range(3):
        await asyncio.sleep(2)

        analysis_response = await client.get(
            f"{VT_API_BASE}/analyses/{analysis_id}",
            headers=headers,
        )

        if analysis_response.status_code != 200:
            continue

        analysis_data = analysis_response.json()
        status = (
            analysis_data.get("data", {}).get("attributes", {}).get("status")
        )

        if status == "completed":
            stats = (
                analysis_data.get("data", {})
                .get("attributes", {})
                .get("stats", {})
            )
            return _build_analysis(stats, flagged_engines=[], permalink=None)

    return VirusTotalAnalysis(available=False, score=0)


def _parse_response(data: dict) -> VirusTotalAnalysis:
    attributes = data.get("data", {}).get("attributes", {})
    stats = attributes.get("last_analysis_stats", {})
    results = attributes.get("last_analysis_results", {})

    flagged = [
        engine_name
        for engine_name, result in results.items()
        if result.get("category") in ("malicious", "suspicious")
    ]

    vt_id = data.get("data", {}).get("id", "")
    permalink = f"https://www.virustotal.com/gui/url/{vt_id}" if vt_id else None

    return _build_analysis(stats, flagged_engines=flagged, permalink=permalink)


def _build_analysis(
    stats: dict,
    flagged_engines: list[str],
    permalink: str | None,
) -> VirusTotalAnalysis:
    malicious = stats.get("malicious", 0)
    suspicious = stats.get("suspicious", 0)
    harmless = stats.get("harmless", 0)
    undetected = stats.get("undetected", 0)
    timeout = stats.get("timeout", 0)

    total = malicious + suspicious + harmless + undetected + timeout
    threats = malicious + suspicious
    detection_rate = (threats / total * 100) if total > 0 else 0.0

    score = _calculate_vt_score(malicious, suspicious, total)

    return VirusTotalAnalysis(
        available=True,
        malicious=malicious,
        suspicious=suspicious,
        harmless=harmless,
        undetected=undetected,
        total_engines=total,
        detection_rate=round(detection_rate, 2),
        permalink=permalink,
        flagged_engines=sorted(flagged_engines)[:10],
        score=score,
    )


def _calculate_vt_score(malicious: int, suspicious: int, total: int) -> int:
    if total == 0:
        return 0

    if malicious >= 10:
        return 100

    if malicious >= 5:
        return 85

    if malicious >= 3:
        return 70

    if malicious >= 1:
        return 50 + (malicious * 10)

    if suspicious >= 3:
        return 40

    if suspicious >= 1:
        return 20

    return 0


def _encode_url_id(url: str) -> str:
    url_bytes = url.encode("utf-8")
    encoded = base64.urlsafe_b64encode(url_bytes).decode("ascii")
    return encoded.rstrip("=")
