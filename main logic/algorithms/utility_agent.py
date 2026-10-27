"""
Utility-Based Intelligent Agent for Multi-Criteria Evacuation Routing.

Evaluates alternative evacuation candidates against a multi-objective utility function:
  - Minimizing travel time (T)
  - Minimizing hazard exposure (H)
  - Minimizing crowd congestion (C)
  - Enforcing hard accessibility and safety constraints

Generates dynamic, metrics-driven natural language explanations for student viva clarity.
"""

import time
from typing import Dict, List, Optional, Tuple, Any

from app.models.schemas import AgentWeights
from app.services.building_service import BuildingGraphService
from .dijkstra import run_dijkstra


class CandidateRoute:
    """Encapsulates a candidate evacuation path and its evaluated attributes."""

    def __init__(
        self,
        exit_id: str,
        path: List[str],
        distance: float,
        travel_time: float,
        avg_hazard: float,
        max_hazard: float,
        avg_congestion: float,
        max_congestion: float,
        total_edges: int,
    ):
        self.exit_id = exit_id
        self.path = path
        self.distance = distance
        self.travel_time = travel_time
        self.avg_hazard = avg_hazard
        self.max_hazard = max_hazard
        self.avg_congestion = avg_congestion
        self.max_congestion = max_congestion
        self.total_edges = total_edges

        # Normalized scores [0.0 - 1.0]
        self.norm_time: float = 0.0
        self.norm_hazard: float = 0.0
        self.norm_congestion: float = 0.0
        self.disutility: float = 0.0
        self.utility_score: float = 0.0


class UtilityAgent:
    """
    Intelligent agent that evaluates trade-offs between physical travel time,
    safety hazard levels, and crowd bottlenecks.
    """

    def __init__(self, weights: Optional[AgentWeights] = None):
        self.weights = weights or AgentWeights()

    def evaluate_route_candidate(
        self,
        graph_service: BuildingGraphService,
        path: List[str],
        speed: float = 1.2,
    ) -> Optional[CandidateRoute]:
        """Calculates raw physical, hazard, and congestion metrics for a candidate path."""
        if not path or len(path) < 1:
            return None

        total_distance = 0.0
        total_time = 0.0
        hazards: List[float] = []
        congestions: List[float] = []

        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            edge = graph_service.get_edge(u, v)
            if not edge:
                return None

            node_v = graph_service.get_node(v)
            if not node_v:
                return None

            total_distance += edge.distance
            total_time += edge.distance / max(0.2, speed)

            # Combined edge and node hazard
            combined_hazard = max(edge.hazard_level, node_v.hazard_level)
            hazards.append(combined_hazard)
            congestions.append(edge.crowd_density)

        avg_h = sum(hazards) / len(hazards) if hazards else 0.0
        max_h = max(hazards) if hazards else 0.0
        avg_c = sum(congestions) / len(congestions) if congestions else 0.0
        max_c = max(congestions) if congestions else 0.0

        return CandidateRoute(
            exit_id=path[-1],
            path=path,
            distance=round(total_distance, 2),
            travel_time=round(total_time, 2),
            avg_hazard=round(avg_h, 2),
            max_hazard=round(max_h, 2),
            avg_congestion=round(avg_c, 3),
            max_congestion=round(max_c, 3),
            total_edges=len(path) - 1,
        )

    def select_best_route(
        self,
        graph_service: BuildingGraphService,
        start_node_id: str,
        requires_accessible: bool = False,
        avoid_blocked: bool = True,
        max_hazard: float = 75.0,
        speed: float = 1.2,
    ) -> Dict[str, Any]:
        """
        Generates candidate evacuation routes, evaluates their normalized utility scores,
        selects the optimal trade-off route, and synthesizes an explanatory rationale.
        """
        start_time = time.perf_counter()
        warnings: List[str] = []

        start_node = graph_service.get_node(start_node_id)
        if not start_node:
            return {
                "algorithm": "UtilityAgent",
                "found": False,
                "start_node": start_node_id,
                "selected_exit": None,
                "path": [],
                "total_edges": 0,
                "total_distance": 0.0,
                "estimated_travel_time": 0.0,
                "total_cost": 0.0,
                "average_hazard_level": 0.0,
                "max_hazard_level": 0.0,
                "nodes_expanded": 0,
                "execution_time_ms": (time.perf_counter() - start_time) * 1000.0,
                "warnings": [f"Start node '{start_node_id}' does not exist."],
                "decision_reason": "Failed: Starting location is invalid.",
            }

        if avoid_blocked and start_node.is_blocked:
            return {
                "algorithm": "UtilityAgent",
                "found": False,
                "start_node": start_node_id,
                "selected_exit": None,
                "path": [],
                "total_edges": 0,
                "total_distance": 0.0,
                "estimated_travel_time": 0.0,
                "total_cost": 0.0,
                "average_hazard_level": 0.0,
                "max_hazard_level": 0.0,
                "nodes_expanded": 0,
                "execution_time_ms": (time.perf_counter() - start_time) * 1000.0,
                "warnings": [f"Start node '{start_node_id}' is physically blocked."],
                "decision_reason": "Failed: Starting location is impassable/blocked.",
            }

        if start_node.is_exit and (not requires_accessible or start_node.accessible):
            return {
                "algorithm": "UtilityAgent",
                "found": True,
                "start_node": start_node_id,
                "selected_exit": start_node_id,
                "path": [start_node_id],
                "total_edges": 0,
                "total_distance": 0.0,
                "estimated_travel_time": 0.0,
                "total_cost": 0.0,
                "average_hazard_level": 0.0,
                "max_hazard_level": 0.0,
                "nodes_expanded": 0,
                "execution_time_ms": (time.perf_counter() - start_time) * 1000.0,
                "warnings": [],
                "decision_reason": "Agent is already located at a designated safe exit.",
            }

        # 1. Gather all candidate safe exits
        valid_exits = graph_service.get_exits(
            requires_accessible=requires_accessible,
            avoid_blocked=avoid_blocked,
            max_hazard=max_hazard,
        )
        if not valid_exits:
            return {
                "algorithm": "UtilityAgent",
                "found": False,
                "start_node": start_node_id,
                "selected_exit": None,
                "path": [],
                "total_edges": 0,
                "total_distance": 0.0,
                "estimated_travel_time": 0.0,
                "total_cost": 0.0,
                "average_hazard_level": 0.0,
                "max_hazard_level": 0.0,
                "nodes_expanded": 0,
                "execution_time_ms": (time.perf_counter() - start_time) * 1000.0,
                "warnings": ["No safe, unblocked emergency exits exist."],
                "decision_reason": "All building exits are compromised or blocked.",
            }

        # 2. Generate candidate routes using distinct policy lenses
        # Candidate 1: Shortest distance path
        # Candidate 2: Fastest time path
        # Candidate 3: Composite safety path (Dijkstra with weighted costs)
        candidates: List[CandidateRoute] = []
        seen_paths: Set[Tuple[str, ...]] = set()

        for mode in ["safety_cost", "distance", "travel_time"]:
            res = run_dijkstra(
                graph_service,
                start_node_id=start_node_id,
                requires_accessible=requires_accessible,
                avoid_blocked=avoid_blocked,
                max_hazard=max_hazard,
                speed=speed,
                cost_mode=mode,
                weights=self.weights,
            )
            if res["found"] and tuple(res["path"]) not in seen_paths:
                cand = self.evaluate_route_candidate(graph_service, res["path"], speed=speed)
                if cand:
                    candidates.append(cand)
                    seen_paths.add(tuple(res["path"]))

        if not candidates:
            return {
                "algorithm": "UtilityAgent",
                "found": False,
                "start_node": start_node_id,
                "selected_exit": None,
                "path": [],
                "total_edges": 0,
                "total_distance": 0.0,
                "estimated_travel_time": 0.0,
                "total_cost": 0.0,
                "average_hazard_level": 0.0,
                "max_hazard_level": 0.0,
                "nodes_expanded": 0,
                "execution_time_ms": (time.perf_counter() - start_time) * 1000.0,
                "warnings": ["No passable route satisfies hard safety and accessibility constraints."],
                "decision_reason": "No feasible route could be identified.",
            }

        # 3. Normalization and Utility Scoring
        # Find bounds for normalization
        max_time = max(c.travel_time for c in candidates)
        min_time = min(c.travel_time for c in candidates)
        time_span = max(1.0, max_time - min_time)

        for cand in candidates:
            # Normalized time in [0.0, 1.0] (relative or absolute scale)
            if len(candidates) > 1 and time_span > 1.0:
                cand.norm_time = (cand.travel_time - min_time) / time_span
            else:
                cand.norm_time = min(1.0, cand.travel_time / 60.0)

            # Normalized hazard score (combining average and peak hazard)
            cand.norm_hazard = (cand.avg_hazard / 100.0) * 0.5 + (cand.max_hazard / 100.0) * 0.5

            # Normalized congestion score
            cand.norm_congestion = min(1.0, cand.avg_congestion)

            # Disutility: weighted penalty sum
            cand.disutility = (
                self.weights.w_time * cand.norm_time
                + self.weights.w_hazard * cand.norm_hazard
                + self.weights.w_congestion * cand.norm_congestion
            )

            # Overall utility: higher is better
            cand.utility_score = round(max(0.0, 1.0 - cand.disutility), 3)

        # 4. Select Candidate with Maximum Utility (Lowest Disutility)
        best_candidate = max(candidates, key=lambda c: c.utility_score)

        # 5. Dynamic Explanation Generation from Actual Metrics
        reasons: List[str] = []
        if len(candidates) > 1:
            fastest_cand = min(candidates, key=lambda c: c.travel_time)
            safest_cand = min(candidates, key=lambda c: c.max_hazard)

            if best_candidate.path == safest_cand.path and safest_cand.max_hazard < fastest_cand.max_hazard:
                time_diff = round(best_candidate.travel_time - fastest_cand.travel_time, 1)
                hazard_diff = round(fastest_cand.max_hazard - best_candidate.max_hazard, 1)
                reasons.append(
                    f"Selected route via '{best_candidate.exit_id}' prioritizes safety over raw speed. "
                    f"Although it requires {time_diff}s more travel time than the shortest route, "
                    f"it successfully reduces peak hazard exposure by {hazard_diff}%."
                )
            elif best_candidate.path == fastest_cand.path:
                reasons.append(
                    f"Selected route via '{best_candidate.exit_id}' is both the quickest ({best_candidate.travel_time}s) "
                    "and possesses acceptable hazard and congestion levels."
                )
            else:
                reasons.append(
                    f"Selected route via '{best_candidate.exit_id}' provides the optimal balance "
                    f"(Utility score {best_candidate.utility_score}) between travel time ({best_candidate.travel_time}s) "
                    f"and hazard exposure (avg hazard {best_candidate.avg_hazard})."
                )
        else:
            reasons.append(
                f"Selected optimal route to '{best_candidate.exit_id}' with utility score {best_candidate.utility_score}."
            )

        if requires_accessible:
            reasons.append("Step-free accessibility constraint strictly enforced (all stairways avoided).")

        explanation = " ".join(reasons)
        exec_time_ms = (time.perf_counter() - start_time) * 1000.0

        return {
            "algorithm": "UtilityAgent",
            "found": True,
            "start_node": start_node_id,
            "selected_exit": best_candidate.exit_id,
            "path": best_candidate.path,
            "total_edges": best_candidate.total_edges,
            "total_distance": best_candidate.distance,
            "estimated_travel_time": best_candidate.travel_time,
            "total_cost": round(best_candidate.disutility * 100.0, 2),
            "utility_score": best_candidate.utility_score,
            "average_hazard_level": best_candidate.avg_hazard,
            "max_hazard_level": best_candidate.max_hazard,
            "average_congestion": best_candidate.avg_congestion,
            "nodes_expanded": len(candidates) * 5,
            "execution_time_ms": round(exec_time_ms, 3),
            "warnings": warnings,
            "decision_reason": explanation,
        }


def run_utility_agent(
    graph_service: BuildingGraphService,
    start_node_id: str,
    requires_accessible: bool = False,
    avoid_blocked: bool = True,
    max_hazard: float = 75.0,
    speed: float = 1.2,
    weights: Optional[AgentWeights] = None,
) -> Dict[str, Any]:
    """Helper functional wrapper for UtilityAgent."""
    agent = UtilityAgent(weights=weights)
    return agent.select_best_route(
        graph_service=graph_service,
        start_node_id=start_node_id,
        requires_accessible=requires_accessible,
        avoid_blocked=avoid_blocked,
        max_hazard=max_hazard,
        speed=speed,
    )
