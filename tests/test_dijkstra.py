"""
Unit tests for manual Dijkstra's shortest-path algorithm on DIT University Campus.
Validates least-cost path optimality, multi-exit handling, non-negative weight invariant,
and independent verification against NetworkX.
"""

import networkx as nx
import pytest
from app.algorithms.dijkstra import run_dijkstra
from app.services.building_service import BuildingGraphService


@pytest.fixture
def graph_service():
    service = BuildingGraphService()
    service.reload()
    return service


def test_dijkstra_finds_optimal_distance_path(graph_service):
    """Verify Dijkstra's distance cost matches NetworkX shortest path distance from Sarojini Hostel Quad."""
    res = run_dijkstra(graph_service, start_node_id="SAROJINI_COURTYARD", cost_mode="distance")
    assert res["found"] is True
    assert res["selected_exit"] == "EXIT_EAST_GATE"
    # SAROJINI_COURTYARD -> SAROJINI_ENTRANCE (8.0m) -> EXIT_EAST_GATE (10.0m) = 18.0m
    assert res["total_distance"] == 18.9
    assert res["total_cost"] == 18.9

    # Cross-verify with NetworkX
    G = graph_service.to_networkx()
    nx_path = nx.shortest_path(G, source="SAROJINI_COURTYARD", target="EXIT_EAST_GATE", weight="distance")
    nx_cost = nx.shortest_path_length(G, source="SAROJINI_COURTYARD", target="EXIT_EAST_GATE", weight="distance")
    assert res["path"] == nx_path
    assert res["total_cost"] == nx_cost


def test_dijkstra_selects_least_cost_of_multiple_exits(graph_service):
    """From Sarojini Quad, East Gate (18.0m) is closer than South Main Gate. Dijkstra must pick East Gate."""
    res = run_dijkstra(graph_service, start_node_id="SAROJINI_COURTYARD", cost_mode="distance")
    assert res["found"] is True
    assert res["selected_exit"] == "EXIT_EAST_GATE"
    assert res["total_distance"] == 18.9


def test_dijkstra_avoids_blocked_exit(graph_service):
    """When East Gate is blocked, Dijkstra routes Sarojini evacuees to Main Gate or Sports Field."""
    exit_east = graph_service.get_node("EXIT_EAST_GATE")
    exit_east.is_blocked = True

    res = run_dijkstra(graph_service, start_node_id="SAROJINI_COURTYARD", avoid_blocked=True, cost_mode="distance")
    assert res["found"] is True
    assert res["selected_exit"] != "EXIT_EAST_GATE"
    assert "EXIT_EAST_GATE" not in res["path"]


def test_dijkstra_rejects_negative_weight(graph_service):
    """Dijkstra must fail safely or raise ValueError if a negative cost edge is encountered."""
    edge = graph_service.get_edge("SAROJINI_COURTYARD", "SAROJINI_ENTRANCE")
    original_dist = edge.distance
    try:
        edge.distance = -5.0
        with pytest.raises(ValueError, match="negative"):
            run_dijkstra(graph_service, start_node_id="SAROJINI_COURTYARD", cost_mode="distance")
    finally:
        edge.distance = original_dist


def test_dijkstra_all_exits_unreachable(graph_service):
    """When all campus exits are unreachable, Dijkstra returns found=False with explanation."""
    for ex in ["EXIT_MAIN_GATE", "EXIT_NORTH_GATE", "EXIT_EAST_GATE", "ASSEMBLY_MAIN_GROUND", "ASSEMBLY_SPORTS_FIELD"]:
        n = graph_service.get_node(ex)
        if n:
            n.is_blocked = True

    res = run_dijkstra(graph_service, start_node_id="SAROJINI_COURTYARD", avoid_blocked=True)
    assert res["found"] is False
    assert res["path"] == []
