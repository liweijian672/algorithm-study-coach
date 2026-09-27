def test_create_and_get_problem(client):
    payload = {
        "platform": "niuke",
        "source_id": "NC1",
        "title": "Two Sum",
        "difficulty": "easy",
        "url": "https://www.nowcoder.com/practice/1",
        "description": None,
    }
    created = client.post("/problems", json=payload)
    assert created.status_code == 200
    data = created.json()
    assert data["id"] == 1
    fetched = client.get(f"/problems/{data['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["source_id"] == "NC1"


def test_list_problems(client):
    payload = {
        "platform": "niuke",
        "source_id": "NC_LIST",
        "title": "List Problem",
        "difficulty": "easy",
        "url": "https://example.com/list",
        "description": None,
    }
    client.post("/problems", json=payload)
    listed = client.get("/problems")
    assert listed.status_code == 200
    assert any(item["source_id"] == "NC_LIST" for item in listed.json())


def test_llm_cache_roundtrip(session):
    from app.models import LLMCache

    row = LLMCache(cache_key="k", provider="fake", model="fake", output="ok")
    session.add(row)
    session.commit()
    loaded = session.query(LLMCache).filter_by(cache_key="k").one()
    assert loaded.output == "ok"

