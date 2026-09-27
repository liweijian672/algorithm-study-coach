def test_end_to_end_smoke(client):
    imported = client.post("/demo/import").json()["imported"]
    assert imported > 0
    diagnosis = client.get("/diagnosis").json()
    assert diagnosis["tag_mastery"]
    first_recommended = diagnosis["recommendations"][0]
    coach = client.get(f"/problems/{first_recommended}/coach")
    assert coach.status_code == 200
    assert coach.json()["solutions"][0]["language"] == "cpp"
