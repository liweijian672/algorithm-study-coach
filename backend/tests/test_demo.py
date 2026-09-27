def test_demo_import_populates_dashboard(client):
    response = client.post("/demo/import")
    assert response.status_code == 200
    assert response.json()["imported"] > 0
    diagnosis = client.get("/diagnosis")
    assert diagnosis.status_code == 200
    assert len(diagnosis.json()["tag_mastery"]) > 0
