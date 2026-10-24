"""
Unit tests for manual Breadth-First Search (BFS) routing algorithm on DIT University Campus.
Validates hop-minimization, multi-exit selection, blockage exclusion, and unreachable handling.
"""

import pytest
from app.algorithms.bfs import run_bfs
from app.services.building_service import BuildingGraphService


@pytest.fixture
def graph_service():
    """Initializes clean DIT campus building graph service."""
    service = BuildingGraphService()
    service.reload()
    return service


def test_bfs_finds_minimum_edges(graph_service):
    """Confirm BFS chooses path with the fewest corridor hops from Chanakya Admin Entrance."""
    res = run_bfs(graph_service, start_node_id="CHANAKYA_ENTRANCE")
    assert res["found"] is True
    assert res["selected_exit"] in ["EXIT_NORTH_GATE", "EXIT_MAIN_GATE", "EXIT_EAST_GATE", "ASSEMBLY_MAIN_GROUND", "ASSEMBLY_SPORTS_FIELD"]
    # Path should start at CHANAKYA_ENTRANCE and end at an exit
    assert res["path"][0] == "CHANAKYA_ENTRANCE"
    assert res["total_edges"] == len(res["path"]) - 1
    # CHANAKYA_ENTRANCE -> EXIT_NORTH_GATE is exactly 1 direct hop
    assert res["path"] == ["CHANAKYA_ENTRANCE", "EXIT_NORTH_GATE"]
    assert res["total_edges"] == 1


def test_bfs_handles_start_at_exit(graph_service):
    """If already at an exit, BFS should return immediately with 0 edges."""
    res = run_bfs(graph_service, start_node_id="EXIT_MAIN_GATE")
    assert res["found"] is True
    assert res["selected_exit"] == "EXIT_MAIN_GATE"
    assert res["path"] == ["EXIT_MAIN_GATE"]
    assert res["total_edges"] == 0
    assert res["total_distance"] == 0.0


def test_bfs_respects_blocked_corridor(graph_service):
    """When the direct North exit is blocked, BFS must find the alternate detour."""
    exit_north = graph_service.get_node("EXIT_NORTH_GATE")
    exit_north.is_blocked = True

    res = run_bfs(graph_service, start_node_id="CHANAKYA_ENTRANCE", avoid_blocked=True)
    assert res["found"] is True
    # Must now route towards another available exit
    assert res["selected_exit"] != "EXIT_NORTH_GATE"
    assert "EXIT_NORTH_GATE" not in res["path"]
    assert res["selected_exit"] in ["EXIT_MAIN_GATE", "ASSEMBLY_MAIN_GROUND", "EXIT_EAST_GATE"]


def test_bfs_unreachable_node(graph_service):
    """If all exits are blocked, BFS should cleanly report found=False."""
    for ex_id in ["EXIT_MAIN_GATE", "EXIT_NORTH_GATE", "EXIT_EAST_GATE", "ASSEMBLY_MAIN_GROUND", "ASSEMBLY_SPORTS_FIELD"]:
        node = graph_service.get_node(ex_id)
        if node:
            node.is_blocked = True

    res = run_bfs(graph_service, start_node_id="VEDANTA_HALL", avoid_blocked=True)
    assert res["found"] is False
    assert res["path"] == []
    assert len(res["warnings"]) > 0


def test_bfs_invalid_start_node(graph_service):
    """Non-existent start node returns clean error result."""
    res = run_bfs(graph_service, start_node_id="NON_EXISTENT_ROOM_999")
    assert res["found"] is False
    assert "does not exist" in res["warnings"][0]
