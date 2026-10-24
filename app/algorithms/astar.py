"""
Manual A* Search Algorithm implementation for Emergency Evacuation.

Implements informed search using the evaluation function f(n) = g(n) + h(n).
Utilizes an admissible 3D Euclidean distance heuristic to the nearest valid exit,
guaranteeing optimal cost while typically expanding fewer nodes than Dijkstra.
"""

import heapq
import time
from typing import Dict, List, Optional, Set, Tuple, Any

from app.models.schemas import AgentWeights
from app.services.building_service import BuildingGraphService


def run_astar(
    graph_service: BuildingGraphService,
    start_node_id: str,
    requires_accessible: bool = False,
    avoid_blocked: bool = True,
    max_hazard: float = 75.0,
    speed: float = 1.2,
    cost_mode: str = "safety_cost",
    weights: Optional[AgentWeights] = None,
) -> Dict[str, Any]:
    """
    Executes A* search to find the optimal least-cost route to the nearest safe exit.

    Args:
        graph_service: BuildingGraphService instance.
        start_node_id: Start location node ID.
        requires_accessible: If True, only wheelchair-accessible corridors/ramps are traversed.
        avoid_blocked: If True, skips blocked nodes and corridors.
        max_hazard: Maximum acceptable hazard cutoff.
        speed: Agent walking speed in m/s.
        cost_mode: "safety_cost", "distance", or "travel_time".
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
            "algorithm": "A*",
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
            "algorithm": "A*",
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
            "decision_reason": "Failed: Starting location is blocked.",
        }

    if start_node.is_exit and (not requires_accessible or start_node.accessible):
        return {
            "algorithm": "A*",
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

    # 2. Identify all valid candidate exits for multi-goal heuristic
    valid_exits = graph_service.get_exits(
        requires_accessible=requires_accessible,
        avoid_blocked=avoid_blocked,
        max_hazard=max_hazard,
    )
    if not valid_exits:
        warnings.append("No active emergency exits available.")
        return {
            "algorithm": "A*",
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
            "warnings": warnings,
            "decision_reason": "All building exits are blocked or unsafe.",
        }

    exit_ids = [e.id for e in valid_exits]
    w = weights or AgentWeights()
    max_speed_bound = 1.5  # Upper bound on walking speed to guarantee admissibility

    # Multi-goal heuristic: distance to the nearest valid exit
    def heuristic(node_id: str) -> float:
        min_euclid = min(graph_service.euclidean_distance(node_id, ex_id) for ex_id in exit_ids)
        if cost_mode == "distance":
            return min_euclid
        elif cost_mode == "travel_time":
            return min_euclid / max_speed_bound
        else:  # "safety_cost"
            # Since effective edge cost >= w_time * (dist / max_speed),
            # this scaled lower bound is strictly admissible
            return w.w_time * (min_euclid / max_speed_bound)

    # 3. Priority Queue Setup: entries are (f_score, counter, current_node_id)
    counter = 0
    start_h = heuristic(start_node_id)
    pq: List[Tuple[float, int, str]] = [(start_h, counter, start_node_id)]
    heapq.heapify(pq)

    g_score: Dict[str, float] = {start_node_id: 0.0}
    parent: Dict[str, Optional[str]] = {start_node_id: None}
    visited: Set[str] = set()
    nodes_expanded = 0
    target_exit: Optional[str] = None

    # 4. A* Exploration Loop
    while pq:
        f, _, current_id = heapq.heappop(pq)

        if current_id in visited:
            continue
        visited.add(current_id)
        nodes_expanded += 1

        current_node = graph_service.get_node(current_id)

        # Reached an exit
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
            else:
                edge_cost = graph_service.calculate_effective_edge_cost(
                    edge,
                    w_time=w.w_time,
                    w_hazard=w.w_hazard,
                    w_crowd=w.w_congestion,
                    speed=speed,
                )

            tentative_g = g_score[current_id] + edge_cost

            if neighbor_id not in g_score or tentative_g < g_score[neighbor_id]:
                g_score[neighbor_id] = tentative_g
                parent[neighbor_id] = current_id
                h_val = heuristic(neighbor_id)
                f_val = tentative_g + h_val
                counter += 1
                heapq.heappush(pq, (f_val, counter, neighbor_id))

    # 5. Route reconstruction
    if not target_exit:
        warnings.append("No accessible or safe emergency exit is reachable.")
        return {
            "algorithm": "A*",
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
    total_cost = g_score[target_exit]

    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        edge = graph_service.get_edge(u, v)
        if edge:
            total_distance += edge.distance
            total_travel_time += edge.distance / max(0.2, speed)

    exec_time_ms = (time.perf_counter() - start_time) * 1000.0

    return {
        "algorithm": "A*",
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
            f"A* found the optimal least-cost path to exit '{target_exit}' using an admissible Euclidean heuristic, "
            f"expanding {nodes_expanded} nodes."
        ),
    }
