from datetime import datetime, timezone

import whois

from app.config import get_settings
from app.models.schemas import DomainAgeAnalysis
from app.services.cache_service import whois_cache


def query_whois(domain: str) -> DomainAgeAnalysis:
    cached = whois_cache.get(f"whois:{domain}")
    if cached:
        return cached
    
    settings = get_settings()
    
    try:
        info = whois.whois(domain)
        
        creation_date = parse_creation_date(info.creation_date)
        age_days = calculate_age_days(creation_date)
        is_new = age_days is not None and age_days < settings.domain_age_threshold_days
        
        registrar = info.registrar if hasattr(info, "registrar") else None
        if isinstance(registrar, list):
            registrar = registrar[0] if registrar else None
        
        score = calculate_domain_age_score(age_days, settings.domain_age_threshold_days)
        
        result = DomainAgeAnalysis(
            creation_date=creation_date,
            age_days=age_days,
            is_new_domain=is_new,
            registrar=registrar,
            score=score,
        )
        
    except Exception:
        result = DomainAgeAnalysis(
            creation_date=None,
            age_days=None,
            is_new_domain=False,
            registrar=None,
            score=30,
        )
    
    whois_cache.set(f"whois:{domain}", result, settings.cache_ttl_whois)
    return result


def parse_creation_date(date_value) -> datetime | None:
    if date_value is None:
        return None
    
    if isinstance(date_value, list):
        date_value = date_value[0] if date_value else None
    
    if isinstance(date_value, datetime):
        if date_value.tzinfo is None:
            return date_value.replace(tzinfo=timezone.utc)
        return date_value
    
    return None


def calculate_age_days(creation_date: datetime | None) -> int | None:
    if creation_date is None:
        return None
    
    now = datetime.now(timezone.utc)
    delta = now - creation_date
    return delta.days


def calculate_domain_age_score(age_days: int | None, threshold: int) -> int:
    if age_days is None:
        return 30
    
    if age_days < 7:
        return 90
    
    if age_days < 30:
        return 70
    
    if age_days < 90:
        return 40
    
    if age_days < 365:
        return 20
    
    return 0
