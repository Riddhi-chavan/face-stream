"""Smoke test: GET /api/roi returns 200 and valid JSON."""


def test_roi_endpoint_returns_200(client):
    """GET /api/roi should return HTTP 200."""
    response = client.get("/api/roi")
    assert response.status_code == 200


def test_roi_endpoint_returns_json_with_results_key(client):
    """Response should contain 'results' key."""
    response = client.get("/api/roi")
    data = response.get_json()
    assert "results" in data
    assert isinstance(data["results"], list)


def test_roi_endpoint_has_total(client):
    """Response should contain 'total' key."""
    response = client.get("/api/roi")
    data = response.get_json()
    assert "total" in data
    assert isinstance(data["total"], int)


def test_roi_endpoint_respects_limit(client):
    """Limit parameter should be capped at 100."""
    response = client.get("/api/roi?limit=999")
    data = response.get_json()
    assert data["limit"] <= 100


def test_roi_endpoint_invalid_params(client):
    """Invalid query params should be handled gracefully."""
    response = client.get("/api/roi?limit=abc&offset=xyz")
    assert response.status_code == 200
    data = response.get_json()
    assert "results" in data
