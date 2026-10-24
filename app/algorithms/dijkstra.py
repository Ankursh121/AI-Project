"""
Manual Dijkstra's Algorithm implementation for Emergency Evacuation.

Finds the minimum cumulative cost route to any safe emergency exit using
a priority queue (min-heap). Strictly prohibits negative weights.
Can optimize for raw distance, travel time, or composite safety cost.
"""

import heapq
import time
from typing import Dict, List, Optional, Set, Tuple, Any

from app.models.schemas import AgentWeights
from app.services.building_service import BuildingGraphService


def run_dijkstra(
    graph_service: BuildingGraphService,
    start_node_id: str,
    requires_accessible: bool = False,
    avoid_blocked: bool = True,
    max_hazard: float = 75.0,
    speed: float = 1.2,
    cost_mode: str = "safety_cost",  # "safety_cost", "distance", or "travel_time"
    weights: Optional[AgentWeights] = None,
) -> Dict[str, Any]:
    """
    Executes Dijkstra's algorithm to compute the optimal least-cost path
    from start_node_id to any reachable safe exit.

    Args:
        graph_service: BuildingGraphService instance.
        start_node_id: Start location node ID.
        requires_accessible: Whether wheelchair accessible paths are required.
        avoid_blocked: Whether blocked corridors and nodes are skipped.
        max_hazard: Maximum acceptable hazard cutoff.
        speed: Agent walking speed in m/s.
        cost_mode: "safety_cost" (weighted composite), "distance", or "travel_time".
        weights: Optional AgentWeights specifying time/hazard/congestion trade-offs.

    Returns:
        Dictionary with route details, expanded node count, costs, and timings.
    """
    start_time = time.perf_counter()
    warnings: List[str] = []

    # 1. Validation of start node
    start_node = graph_service.get_node(start_node_id)
    if not start_node:
        return {
            "algorithm": "Dijkstra",
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
            "warnings": [f"Start node '{start_node_id}' does not exist."],
            "decision_reason": "Failed: Starting location is invalid.",
        }

    if avoid_blocked and start_node.is_blocked:
        return {
            "algorithm": "Dijkstra",
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
            "warnings": [f"Start node '{start_node_id}' is blocked."],
            "decision_reason": "Failed: Starting location is physically blocked.",
        }

    # If already at an exit
    if start_node.is_exit and (not requires_accessible or start_node.accessible):
        return {
            "algorithm": "Dijkstra",
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
            "decision_reason": "Already situated at a safe emergency exit.",
        }

    # Weight settings
    w = weights or AgentWeights()

    # 2. Priority queue & distance table setup
    # Heap entries: (current_cost, counter, current_node_id)
    counter = 0
    pq: List[Tuple[float, int, str]] = [(0.0, counter, start_node_id)]
    heapq.heapify(pq)

    min_cost: Dict[str, float] = {start_node_id: 0.0}
    parent: Dict[str, Optional[str]] = {start_node_id: None}
    visited: Set[str] = set()
    nodes_expanded = 0
    target_exit: Optional[str] = None

    # 3. Dijkstra exploration loop
    while pq:
        cost, _, current_id = heapq.heappop(pq)

        if current_id in visited:
            continue
        visited.add(current_id)
        nodes_expanded += 1

        current_node = graph_service.get_node(current_id)

        # Check if we popped an exit (guaranteed minimum cost exit)
        if current_node and current_node.is_exit:
            target_exit = current_id
            break

        # Check neighbors
        neighbors = graph_service.get_neighbors(
            current_id,
            requires_accessible=requires_accessible,
            avoid_blocked=avoid_blocked,
            max_hazard=max_hazard,
        )

        for neighbor_id, edge in neighbors:
            if neighbor_id in visited:
                continue

            # Determine edge weight
            if cost_mode == "distance":
                edge_cost = edge.distance
            elif cost_mode == "travel_time":
                edge_cost = edge.distance / max(0.2, speed)
            else:  # "safety_cost"
                edge_cost = graph_service.calculate_effective_edge_cost(
                    edge,
                    w_time=w.w_time,
                    w_hazard=w.w_hazard,
                    w_crowd=w.w_congestion,
                    speed=speed,
                )

            # Defensive verification: Dijkstra cannot process negative weights
            if edge_cost < 0:
                raise ValueError(f"Dijkstra encountered negative edge cost {edge_cost} on ({current_id}->{neighbor_id})")

            new_cost = cost + edge_cost

            if neighbor_id not in min_cost or new_cost < min_cost[neighbor_id]:
                min_cost[neighbor_id] = new_cost
                parent[neighbor_id] = current_id
                counter += 1
                heapq.heappush(pq, (new_cost, counter, neighbor_id))

    # 4. Route reconstruction
    if not target_exit:
        warnings.append("No accessible or safe emergency exit is reachable.")
        return {
            "algorithm": "Dijkstra",
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
            "decision_reason": "No feasible route exists to any exit under current constraints.",
        }

    path: List[str] = []
    curr: Optional[str] = target_exit
    while curr is not None:
        path.append(curr)
        curr = parent.get(curr)
    path.reverse()

    # Calculate actual path metrics
    total_distance = 0.0
    total_travel_time = 0.0
    total_composite_cost = min_cost[target_exit]

    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        edge = graph_service.get_edge(u, v)
        if edge:
            total_distance += edge.distance
            total_travel_time += edge.distance / max(0.2, speed)

    exec_time_ms = (time.perf_counter() - start_time) * 1000.0

    return {
        "algorithm": "Dijkstra",
        "found": True,
        "start_node": start_node_id,
        "selected_exit": target_exit,
        "path": path,
        "total_edges": len(path) - 1,
        "total_distance": round(total_distance, 2),
        "estimated_travel_time": round(total_travel_time, 2),
        "total_cost": round(total_composite_cost, 2),
        "nodes_expanded": nodes_expanded,
        "execution_time_ms": round(exec_time_ms, 3),
        "warnings": warnings,
        "decision_reason": (
            f"Dijkstra identified the least-cost path to exit '{target_exit}' with total cost {round(total_composite_cost, 2)}, "
            f"expanding {nodes_expanded} nodes."
        ),
    }
