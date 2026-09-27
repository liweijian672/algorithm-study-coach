def test_duplicate_event_key_is_idempotent(client):
    problem = client.post("/problems", json={
        "platform": "niuke", "source_id": "NC2", "title": "Reverse",
        "difficulty": "easy", "url": "https://example.com/2",
        "description": None,
    }).json()
    record = {
        "problem_id": problem["id"], "status": "accepted", "language": "cpp",
        "code": "int main(){}", "time_cost_ms": None, "memory_cost_kb": None,
        "submitted_at": "2026-09-27T10:00:00", "event_key": "niuke:NC2:1",
    }
    first = client.post("/records", json=record)
    second = client.post("/records", json=record)
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["id"] == second.json()["id"]
