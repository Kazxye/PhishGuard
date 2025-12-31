import ssl
import socket
from datetime import datetime, timezone

from app.config import get_settings
from app.models.schemas import SSLAnalysis
from app.services.cache_service import ssl_cache


def check_ssl(domain: str) -> SSLAnalysis:
    cached = ssl_cache.get(f"ssl:{domain}")
    if cached:
        return cached
    
    settings = get_settings()
    
    try:
        context = ssl.create_default_context()
        
        with socket.create_connection((domain, 443), timeout=settings.ssl_timeout) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as secure_sock:
                cert = secure_sock.getpeercert()
        
        result = parse_certificate(cert, domain)
        
    except ssl.SSLCertVerificationError:
        result = SSLAnalysis(
            has_ssl=True,
            is_valid=False,
            is_expired=False,
            score=60,
        )
    except (socket.timeout, socket.gaierror, ConnectionRefusedError, OSError):
        result = SSLAnalysis(
            has_ssl=False,
            is_valid=False,
            is_expired=False,
            score=70,
        )
    except Exception:
        result = SSLAnalysis(
            has_ssl=False,
            is_valid=False,
            is_expired=False,
            score=50,
        )
    
    ssl_cache.set(f"ssl:{domain}", result, settings.cache_ttl_ssl)
    return result


def parse_certificate(cert: dict, domain: str) -> SSLAnalysis:
    issuer_dict = dict(x[0] for x in cert.get("issuer", []))
    issuer = issuer_dict.get("organizationName", issuer_dict.get("commonName"))
    
    subject_dict = dict(x[0] for x in cert.get("subject", []))
    subject = subject_dict.get("commonName")
    
    not_before = parse_cert_date(cert.get("notBefore"))
    not_after = parse_cert_date(cert.get("notAfter"))
    
    now = datetime.now(timezone.utc)
    
    is_expired = not_after is not None and now > not_after
    is_not_yet_valid = not_before is not None and now < not_before
    is_valid = not is_expired and not is_not_yet_valid
    
    days_until_expiry = None
    if not_after:
        days_until_expiry = (not_after - now).days
    
    score = calculate_ssl_score(is_valid, is_expired, days_until_expiry, issuer)
    
    return SSLAnalysis(
        has_ssl=True,
        issuer=issuer,
        subject=subject,
        valid_from=not_before,
        valid_until=not_after,
        is_valid=is_valid,
        is_expired=is_expired,
        days_until_expiry=days_until_expiry,
        score=score,
    )


def parse_cert_date(date_str: str | None) -> datetime | None:
    if not date_str:
        return None
    
    try:
        dt = datetime.strptime(date_str, "%b %d %H:%M:%S %Y %Z")
        return dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def calculate_ssl_score(
    is_valid: bool,
    is_expired: bool,
    days_until_expiry: int | None,
    issuer: str | None,
) -> int:
    if not is_valid:
        return 70 if is_expired else 60
    
    score = 0
    
    if days_until_expiry is not None and days_until_expiry < 30:
        score += 20
    
    free_issuers = ["let's encrypt", "zerossl", "cloudflare"]
    if issuer and any(free in issuer.lower() for free in free_issuers):
        score += 10
    
    return score
