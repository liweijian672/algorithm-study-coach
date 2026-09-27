from collections.abc import Callable

from ..db import SessionLocal
from ..models import LLMCache


def get_or_create(cache_key: str, generate: Callable[[], str]) -> str:
    db = SessionLocal()
    try:
        existing = db.query(LLMCache).filter_by(cache_key=cache_key).first()
        if existing:
            return existing.output
        output = generate()
        db.add(LLMCache(cache_key=cache_key, provider="default", model="default", output=output))
        db.commit()
        return output
    finally:
        db.close()

