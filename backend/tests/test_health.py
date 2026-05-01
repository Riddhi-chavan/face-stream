"""Smoke test: server starts and health endpoint works."""


def test_health_endpoint(client):
    """GET /health returns 200 and status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"


def test_roi_route_exists(client):
    """GET /api/roi route is registered and returns 200."""
    response = client.get("/api/roi")
    assert response.status_code == 200


def test_health_returns_json(client):
    """Health endpoint returns valid JSON content type."""
    response = client.get("/health")
    assert response.content_type == "application/json"
