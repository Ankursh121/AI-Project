"""
Manual Breadth-First Search (BFS) implementation for Emergency Evacuation.

Finds the emergency exit reachable with the minimum number of edge hops (connections).
Treats all edge weights equally (unweighted search). Does NOT optimize for physical
distance, hazard avoidance, or travel time, but serves as a fundamental benchmark.
"""

import time
from collections import deque
from typing import Dict, List, Optional, Set, Tuple, Any

from app.services.building_service import BuildingGraphService


def run_bfs(
    graph_service: BuildingGraphService,
    start_node_id: str,
    requires_accessible: bool = False,
    avoid_blocked: bool = True,
    max_hazard: float = 75.0,
    speed: float = 1.2,
) -> Dict[str, Any]:
    """
    Executes manual Breadth-First Search (BFS) starting from `start_node_id`
    to find the nearest emergency exit by edge hop count.

    Args:
        graph_service: Graph data service.
        start_node_id: Starting location node ID.
        requires_accessible: If True, only wheelchair-accessible corridors/ramps are traversed.
        avoid_blocked: If True, skips blocked nodes and edges.
        max_hazard: Maximum tolerable hazard level (nodes/edges above this are excluded).
        speed: Walking speed of group in m/s (default 1.2).

    Returns:
        Dictionary with route details, expanded nodes count, metrics, and warnings.
    """
    start_time = time.perf_counter()
    warnings: List[str] = []

    # 1. Validation of start node
    start_node = graph_service.get_node(start_node_id)
    if not start_node:
        return {
            "algorithm": "BFS",
            "found": False,
            "start_node": start_node_id,
            "selected_exit": None,
            "path": [],
            "total_edges": 0,
            "total_distance": 0.0,
            "estimated_travel_time": 0.0,
            "total_cost": 0.0,
            "nodes_expanded": 0,
            "execution_time_ms": (time.perf_counter() - start_time) * 1000.0,
            "warnings": [f"Start node '{start_node_id}' does not exist in building graph."],
            "decision_reason": "Failed: Starting location is invalid.",
        }

    # If start node itself is blocked or lethal
    if avoid_blocked and start_node.is_blocked:
        return {
            "algorithm": "BFS",
            "found": False,
            "start_node": start_node_id,
            "selected_exit": None,
            "path": [],
            "total_edges": 0,
            "total_distance": 0.0,
            "estimated_travel_time": 0.0,
            "total_cost": 0.0,
            "nodes_expanded": 0,
            "execution_time_ms": (time.perf_counter() - start_time) * 1000.0,
            "warnings": [f"Start node '{start_node_id}' is physically blocked."],
            "decision_reason": "Failed: Starting location is impassable/blocked.",
        }

    # If already at an exit
    if start_node.is_exit and (not requires_accessible or start_node.accessible):
        return {
            "algorithm": "BFS",
            "found": True,
            "start_node": start_node_id,
            "selected_exit": start_node_id,
            "path": [start_node_id],
            "total_edges": 0,
            "total_distance": 0.0,
            "estimated_travel_time": 0.0,
            "total_cost": 0.0,
            "nodes_expanded": 0,
            "execution_time_ms": (time.perf_counter() - start_time) * 1000.0,
            "warnings": [],
            "decision_reason": "Already located at a valid emergency exit.",
        }

    # 2. BFS Queue and Bookkeeping
    queue: deque = deque([start_node_id])
    visited: Set[str] = {start_node_id}
    parent: Dict[str, Optional[str]] = {start_node_id: None}
    nodes_expanded = 0
    target_exit: Optional[str] = None

    # 3. Queue exploration loop
    while queue:
        current_id = queue.popleft()
        nodes_expanded += 1
        current_node = graph_service.get_node(current_id)

        # Check if an exit is reached
        if current_node and current_node.is_exit:
            target_exit = current_id
            break

        # Explore neighbors
        neighbors = graph_service.get_neighbors(
            current_id,
            requires_accessible=requires_accessible,
            avoid_blocked=avoid_blocked,
            max_hazard=max_hazard,
        )

        for neighbor_id, edge in neighbors:
            if neighbor_id not in visited:
                visited.add(neighbor_id)
                parent[neighbor_id] = current_id
                queue.append(neighbor_id)

    # 4. Route Reconstruction
    if not target_exit:
        warnings.append("No reachable exit found meeting safety and accessibility constraints.")
        return {
            "algorithm": "BFS",
            "found": False,
            "start_node": start_node_id,
            "selected_exit": None,
            "path": [],
            "total_edges": 0,
            "total_distance": 0.0,
            "estimated_travel_time": 0.0,
            "total_cost": 0.0,
            "nodes_expanded": nodes_expanded,
            "execution_time_ms": (time.perf_counter() - start_time) * 1000.0,
            "warnings": warnings,
            "decision_reason": "No path exists to any designated exit under current graph conditions.",
        }

    # Backtrack path
    path: List[str] = []
    curr: Optional[str] = target_exit
    while curr is not None:
        path.append(curr)
        curr = parent.get(curr)
    path.reverse()

    # Calculate actual path metrics
    total_distance = 0.0
    total_travel_time = 0.0
    total_cost = 0.0

    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        edge = graph_service.get_edge(u, v)
        if edge:
            total_distance += edge.distance
            edge_time = edge.distance / max(0.2, speed)
            total_travel_time += edge_time
            total_cost += graph_service.calculate_effective_edge_cost(edge, speed=speed)

    exec_time_ms = (time.perf_counter() - start_time) * 1000.0

    return {
        "algorithm": "BFS",
        "found": True,
        "start_node": start_node_id,
        "selected_exit": target_exit,
        "path": path,
        "total_edges": len(path) - 1,
        "total_distance": round(total_distance, 2),
        "estimated_travel_time": round(total_travel_time, 2),
        "total_cost": round(total_cost, 2),
        "nodes_expanded": nodes_expanded,
        "execution_time_ms": round(exec_time_ms, 3),
        "warnings": warnings,
        "decision_reason": (
            f"BFS identified path with fewest hallway hops ({len(path) - 1} edges) to {target_exit}. "
            "Note: BFS treats all connections equally and does not minimize physical distance or avoid mild hazards."
        ),
    }
