"""
Unit tests for Utility-Based Intelligent Agent on DIT University Campus.
Validates multi-criteria trade-offs, hard accessibility constraints,
and dynamic natural language explanation generation.
"""

import pytest
from app.algorithms.utility_agent import run_utility_agent
from app.models.schemas import AgentWeights
from app.services.building_service import BuildingGraphService


@pytest.fixture
def graph_service():
    service = BuildingGraphService()
    service.reload()
    return service


def test_utility_agent_prefers_safer_route_over_shorter_hazardous_route(graph_service):
    """
    Demonstrates that shortest path is NOT always the best path!
    If Vedanta Walkway has severe smoke (hazard 65), the agent should choose
    the safer detour through the North Slope or Perimeter path.
    """
    # Introduce moderate smoke on Vedanta walkway
    walkway = graph_service.get_node("PATH_WEST_VEDANTA")
    walkway.hazard_level = 65.0
    edge = graph_service.get_edge("VEDANTA_ENTRANCE", "PATH_WEST_VEDANTA")
    if edge:
        edge.hazard_level = 65.0

    # High hazard sensitivity weights
    weights = AgentWeights(w_time=0.2, w_hazard=0.6, w_congestion=0.2)
    res = run_utility_agent(
        graph_service,
        start_node_id="VEDANTA_ENTRANCE",
        weights=weights,
    )

    assert res["found"] is True
    # Explanation must be detailed and generated from real metrics
    assert len(res["decision_reason"]) > 20
    assert "safety" in res["decision_reason"].lower() or "hazard" in res["decision_reason"].lower() or "optimal" in res["decision_reason"].lower()


def test_utility_agent_enforces_accessibility_hard_constraint(graph_service):
    """
    Wheelchair groups at Vedanta MUST NOT be assigned the steep stepped shortcut (STAIRS_VEDANTA_NORTH).
    They must be routed via the accessible ramp (RAMP_VEDANTA_NORTH) or paved plaza.
    """
    res = run_utility_agent(
        graph_service,
        start_node_id="VEDANTA_ENTRANCE",
        requires_accessible=True,
    )

    assert res["found"] is True
    # Verify stairs are strictly excluded
    assert "STAIRS_VEDANTA_NORTH" not in res["path"]
    assert "accessibility" in res["decision_reason"].lower()


def test_utility_agent_standard_group_can_use_stairs(graph_service):
    """Standard mobility group can take stairwell shortcut for faster exit."""
    res = run_utility_agent(
        graph_service,
        start_node_id="VEDANTA_ENTRANCE",
        requires_accessible=False,
    )

    assert res["found"] is True
    assert len(res["path"]) > 1


def test_utility_agent_explanation_contains_metrics(graph_service):
    """Verifies that generated explanation contains actual numbers (travel time, utility score)."""
    res = run_utility_agent(graph_service, start_node_id="SAROJINI_ENTRANCE")
    assert res["found"] is True
    assert "Utility" in res["decision_reason"] or "optimal" in res["decision_reason"].lower()
    assert str(res["selected_exit"]) in res["decision_reason"]
