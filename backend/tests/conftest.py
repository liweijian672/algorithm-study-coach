import sys
import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ["DATABASE_URL"] = "sqlite:///./backend/test_coach.db"

from app.db import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402


class FakeLLMClient:
    def __init__(self, response: str):
        self.response = response
        self.calls = 0

    def complete(self, prompt: str) -> str:
        self.calls += 1
        return self.response


@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def fake_client(client):
    return FakeLLMClient('{"tags": ["array", "hash"]}')


@pytest.fixture
def fake_malformed_client(client):
    return FakeLLMClient("not-json")

