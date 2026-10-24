"""
Unit tests for manual A* Search routing algorithm on DIT University Campus.
Validates optimal cost match with Dijkstra, search pruning (expanded nodes),
and admissible multi-goal heuristic property.
"""

import pytest
from app.algorithms.astar import run_astar
from app.algorithms.dijkstra import run_dijkstra
from app.services.building_service import BuildingGraphService


@pytest.fixture
def graph_service():
    service = BuildingGraphService()
    service.reload()
    return service


def test_astar_matches_dijkstra_optimal_cost(graph_service):
    """
    Since Euclidean distance is an admissible heuristic (never overestimates),
    A* MUST produce the exact same optimal travel cost as Dijkstra.
    """
    start_nodes = [
        "VEDANTA_HALL",
        "VEDANTA_ENTRANCE",
        "CHANAKYA_OFFICE",
        "CHANAKYA_ENTRANCE",
        "SAROJINI_COURTYARD",
        "SAROJINI_ENTRANCE",
    ]

    for start_id in start_nodes:
        dijk_res = run_dijkstra(graph_service, start_node_id=start_id, cost_mode="travel_time")
        astar_res = run_astar(graph_service, start_node_id=start_id, cost_mode="travel_time")

        assert dijk_res["found"] is True
        assert astar_res["found"] is True
        # Both must find the exact same minimal cost
        assert pytest.approx(astar_res["total_cost"], rel=1e-3) == dijk_res["total_cost"]
        assert pytest.approx(astar_res["total_distance"], rel=1e-3) == dijk_res["total_distance"]


def test_astar_expands_fewer_or_equal_nodes(graph_service):
    """
    Informed A* search should prune unnecessary search paths and expand <= Dijkstra nodes.
    """
    dijk_res = run_dijkstra(graph_service, start_node_id="VEDANTA_HALL", cost_mode="travel_time")
    astar_res = run_astar(graph_service, start_node_id="VEDANTA_HALL", cost_mode="travel_time")

    assert astar_res["nodes_expanded"] <= dijk_res["nodes_expanded"]


def test_astar_admissible_heuristic_property(graph_service):
    """
    Verifies that the multi-goal Euclidean heuristic (distance to nearest valid exit)
    never exceeds the actual graph shortest path distance (admissibility condition).
    """
    valid_exits = graph_service.get_exits()
    for node_id, node in graph_service.nodes.items():
        if node.is_exit:
            continue
        # Multi-goal admissible heuristic: straight-line distance to closest exit
        h_euclid = min(graph_service.euclidean_distance(node_id, ex.id) for ex in valid_exits)

        # Actual graph distance
        res = run_dijkstra(graph_service, start_node_id=node_id, cost_mode="distance")
        if res["found"]:
            # Admissible condition: h(n) <= true remaining shortest distance
            assert h_euclid <= (res["total_distance"] + 0.01)


def test_astar_blocked_corridors(graph_service):
    """A* finds detour when direct exit is blocked."""
    exit_north = graph_service.get_node("EXIT_NORTH_GATE")
    exit_north.is_blocked = True

    res = run_astar(graph_service, start_node_id="VEDANTA_ENTRANCE", avoid_blocked=True)
    assert res["found"] is True
    assert res["selected_exit"] != "EXIT_NORTH_GATE"
    assert "EXIT_NORTH_GATE" not in res["path"]
