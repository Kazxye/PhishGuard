from datetime import datetime
from enum import Enum

from pydantic import BaseModel, HttpUrl, Field


class RiskLevel(str, Enum):
    SAFE = "safe"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class HomographAnalysis(BaseModel):
    has_homographs: bool
    suspicious_characters: list[dict] = Field(default_factory=list)
    original_domain: str
    punycode_domain: str | None = None
    score: int = 0


class DomainAgeAnalysis(BaseModel):
    creation_date: datetime | None = None
    age_days: int | None = None
    is_new_domain: bool = False
    registrar: str | None = None
    score: int = 0


class SSLAnalysis(BaseModel):
    has_ssl: bool
    issuer: str | None = None
    subject: str | None = None
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    is_valid: bool = False
    is_expired: bool = False
    days_until_expiry: int | None = None
    score: int = 0


class BrandSimilarityAnalysis(BaseModel):
    matches: list[dict] = Field(default_factory=list)
    highest_similarity: float = 0.0
    matched_brand: str | None = None
    is_suspicious: bool = False
    score: int = 0


class FormAnalysis(BaseModel):
    total_forms: int = 0
    password_fields: int = 0
    hidden_fields: int = 0
    external_actions: list[str] = Field(default_factory=list)
    suspicious_patterns: list[str] = Field(default_factory=list)
    score: int = 0


class VirusTotalAnalysis(BaseModel):
    available: bool = False
    malicious: int = 0
    suspicious: int = 0
    harmless: int = 0
    undetected: int = 0
    total_engines: int = 0
    detection_rate: float = 0.0
    permalink: str | None = None
    flagged_engines: list[str] = Field(default_factory=list)
    score: int = 0


class AnalysisRequest(BaseModel):
    url: HttpUrl
    html_content: str | None = None

    model_config = {"json_schema_extra": {"examples": [{"url": "https://example.com"}]}}


class AnalysisResponse(BaseModel):
    url: str
    domain: str
    risk_level: RiskLevel
    risk_score: int = Field(ge=0, le=100)

    homograph: HomographAnalysis
    domain_age: DomainAgeAnalysis
    ssl: SSLAnalysis
    brand_similarity: BrandSimilarityAnalysis
    form_analysis: FormAnalysis | None = None
    virustotal: VirusTotalAnalysis | None = None

    analyzed_at: datetime
    recommendations: list[str] = Field(default_factory=list)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "url": "https://example.com",
                    "domain": "example.com",
                    "risk_level": "safe",
                    "risk_score": 15,
                    "analyzed_at": "2024-01-01T00:00:00Z",
                }
            ]
        }
    }


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime