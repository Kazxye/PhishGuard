from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "PhishGuard API"
    version: str = "1.0.0"
    debug: bool = False

    cors_origins_str: str = "*"

    whois_timeout: int = 10
    ssl_timeout: int = 5

    domain_age_threshold_days: int = 30
    similarity_threshold: float = 0.75

    cache_ttl_whois: int = 3600
    cache_ttl_ssl: int = 300

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_str.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
