"""
Integration tests for FastAPI REST API endpoints on DIT University Campus.
Validates HTTP request and response structures, schema validation, error codes,
and state changes.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_get_root(client):
    """GET / returns system metadata and academic disclaimer."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Emergency Evacuation Planning & Intelligent Route Optimization System"
    assert "disclaimer" in data
    assert data["status"] == "online"


def test_get_health(client):
    """GET /health returns operational status and graph size."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["nodes_loaded"] >= 10


def test_get_building_graph(client):
    """GET /building returns valid building graph model."""
    response = client.get("/building")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) >= 10


def test_get_scenarios(client):
    """GET /scenarios returns list of available scenarios."""
    response = client.get("/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 4


def test_post_route_valid(client):
    """POST /route calculates valid path from Vedanta Academic Block."""
    payload = {
        "start_node": "VEDANTA_ENTRANCE",
        "algorithm": "utility",
        "requires_accessible_route": False,
        "speed": 1.2,
    }
    response = client.post("/route", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["found"] is True
    assert data["start_node"] == "VEDANTA_ENTRANCE"
    assert len(data["path"]) > 1
    assert len(data["instructions"]) > 0


def test_post_route_invalid_node_returns_404(client):
    """POST /route with invalid node ID returns 404 HTTP error."""
    payload = {
        "start_node": "NON_EXISTENT_BUILDING_XYZ",
        "algorithm": "dijkstra",
    }
    response = client.post("/route", json=payload)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_post_compare_algorithms(client):
    """POST /compare-algorithms returns BFS, Dijkstra, and A* comparisons."""
    payload = {
        "start_node": "SAROJINI_ENTRANCE",
        "requires_accessible_route": False,
        "speed": 1.2,
    }
    response = client.post("/compare-algorithms", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "comparisons" in data
    assert "BFS" in data["comparisons"]
    assert "Dijkstra" in data["comparisons"]
    assert "A*" in data["comparisons"]
    assert len(data["analysis"]) > 20


def test_simulation_endpoints_lifecycle(client):
    """Step simulation, inspect state, inject hazard, and generate report."""
    # 1. Reset
    reset_resp = client.post("/reset?scenario_id=scenario_normal")
    assert reset_resp.status_code == 200

    # 2. State
    state_resp = client.get("/simulation/state")
    assert state_resp.status_code == 200
    assert state_resp.json()["current_step"] == 0

    # 3. Step
    step_resp = client.post("/simulate", json={"steps": 1, "time_delta": 3.0})
    assert step_resp.status_code == 200
    assert step_resp.json()["current_step"] == 1

    # 4. Inject Hazard
    hazard_payload = {
        "hazard_id": "test_hazard_api",
        "hazard_type": "fire",
        "location_type": "node",
        "target_id": "PATH_WEST_VEDANTA",
        "severity": 80.0,
        "is_passable": False,
    }
    haz_resp = client.post("/hazards", json=hazard_payload)
    assert haz_resp.status_code == 200

    # 5. Report
    rep_resp = client.get("/report")
    assert rep_resp.status_code == 200
    assert "total_agents" in rep_resp.json()
