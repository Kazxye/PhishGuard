import time
from dataclasses import dataclass, field
from typing import Any


@dataclass
class CacheEntry:
    value: Any
    expires_at: float


@dataclass
class CacheService:
    default_ttl: int = 3600
    _store: dict[str, CacheEntry] = field(default_factory=dict)

    def get(self, key: str) -> Any | None:
        self._cleanup_expired()

        entry = self._store.get(key)
        if entry is None:
            return None

        if time.time() > entry.expires_at:
            del self._store[key]
            return None

        return entry.value

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        expires_at = time.time() + (ttl or self.default_ttl)
        self._store[key] = CacheEntry(value=value, expires_at=expires_at)

    def delete(self, key: str) -> bool:
        if key in self._store:
            del self._store[key]
            return True
        return False

    def clear(self) -> None:
        self._store.clear()

    def _cleanup_expired(self) -> None:
        current_time = time.time()
        expired_keys = [
            key for key, entry in self._store.items()
            if current_time > entry.expires_at
        ]
        for key in expired_keys:
            del self._store[key]

    @property
    def size(self) -> int:
        return len(self._store)


cache = CacheService()
whois_cache = CacheService(default_ttl=3600)
ssl_cache = CacheService(default_ttl=300)
virustotal_cache = CacheService(default_ttl=900)