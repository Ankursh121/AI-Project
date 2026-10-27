"""
Routing Service.
Coordinates execution of BFS, Dijkstra, A*, and Utility Agent routing,
and translates computed node sequences into rich, human-readable step-by-step instructions.
Also provides fair side-by-side algorithmic comparisons.
"""

from typing import Dict, List, Optional, Any

from app.algorithms.bfs import run_bfs
from app.algorithms.dijkstra import run_dijkstra
from app.algorithms.astar import run_astar
from app.algorithms.utility_agent import run_utility_agent
from app.models.schemas import (
    AlgorithmComparisonItem,
    AlgorithmComparisonResponse,
    AlgorithmType,
    NodeType,
    RouteRequest,
    RouteResponse,
    RouteStepInstruction,
)
from app.services.building_service import BuildingGraphService


class RoutingService:
    """Provides high-level routing calculations and step-by-step navigation synthesis."""

    def __init__(self, graph_service: BuildingGraphService):
        self.graph_service = graph_service

    def calculate_route(self, request: RouteRequest) -> RouteResponse:
        """Executes the requested routing algorithm and formats a detailed RouteResponse."""
        speed = request.speed
        req_accessible = request.requires_accessible_route
        weights = request.weights
        max_haz = weights.max_hazard_threshold if weights else 75.0

        # Execute chosen algorithm
        if request.algorithm == AlgorithmType.BFS:
            result = run_bfs(
                self.graph_service,
                start_node_id=request.start_node,
                requires_accessible=req_accessible,
                avoid_blocked=True,
                max_hazard=max_haz,
                speed=speed,
            )
        elif request.algorithm == AlgorithmType.DIJKSTRA:
            result = run_dijkstra(
                self.graph_service,
                start_node_id=request.start_node,
                requires_accessible=req_accessible,
                avoid_blocked=True,
                max_hazard=max_haz,
                speed=speed,
                cost_mode="safety_cost",
                weights=weights,
            )
        elif request.algorithm == AlgorithmType.ASTAR:
            result = run_astar(
                self.graph_service,
                start_node_id=request.start_node,
                requires_accessible=req_accessible,
                avoid_blocked=True,
                max_hazard=max_haz,
                speed=speed,
                cost_mode="safety_cost",
                weights=weights,
            )
        else:  # UTILITY agent
            result = run_utility_agent(
                self.graph_service,
                start_node_id=request.start_node,
                requires_accessible=req_accessible,
                avoid_blocked=True,
                max_hazard=max_haz,
                speed=speed,
                weights=weights,
            )

        # Lookup names and details
        start_node = self.graph_service.get_node(request.start_node)
        start_name = start_node.name if start_node else request.start_node

        exit_id = result.get("selected_exit")
        exit_node = self.graph_service.get_node(exit_id) if exit_id else None
        exit_name = exit_node.name if exit_node else (exit_id or "None")

        path = result.get("path", [])
        path_names: List[str] = []
        for nid in path:
            node = self.graph_service.get_node(nid)
            path_names.append(node.name if node else nid)

        # Generate step-by-step guidance instructions
        instructions = self._generate_step_instructions(path, speed=speed)

        return RouteResponse(
            algorithm=result.get("algorithm", str(request.algorithm.value)),
            found=result.get("found", False),
            start_node=request.start_node,
            start_node_name=start_name,
            selected_exit=exit_id,
            selected_exit_name=exit_name,
            path=path,
            path_names=path_names,
            total_edges=result.get("total_edges", 0),
            total_distance=result.get("total_distance", 0.0),
            estimated_travel_time=result.get("estimated_travel_time", 0.0),
            total_cost=result.get("total_cost", 0.0),
            average_hazard_level=result.get("average_hazard_level", 0.0),
            max_hazard_level=result.get("max_hazard_level", 0.0),
            nodes_expanded=result.get("nodes_expanded", 0),
            execution_time_ms=result.get("execution_time_ms", 0.0),
            instructions=instructions,
            decision_reason=result.get("decision_reason", ""),
            warnings=result.get("warnings", []),
        )

    def compare_algorithms(
        self,
        start_node_id: str,
        requires_accessible: bool = False,
        speed: float = 1.2,
    ) -> AlgorithmComparisonResponse:
        """
        Runs BFS, Dijkstra, and A* on the identical graph state and start location.
        Returns side-by-side metrics and educational analysis of their differences.
        """
        start_node = self.graph_service.get_node(start_node_id)
        start_name = start_node.name if start_node else start_node_id

        # 1. Run BFS
        bfs_res = run_bfs(
            self.graph_service,
            start_node_id=start_node_id,
            requires_accessible=requires_accessible,
            speed=speed,
        )

        # 2. Run Dijkstra (travel_time cost mode for direct fair physical comparison)
        dijk_res = run_dijkstra(
            self.graph_service,
            start_node_id=start_node_id,
            requires_accessible=requires_accessible,
            speed=speed,
            cost_mode="travel_time",
        )

        # 3. Run A* (travel_time cost mode with admissible heuristic)
        astar_res = run_astar(
            self.graph_service,
            start_node_id=start_node_id,
            requires_accessible=requires_accessible,
            speed=speed,
            cost_mode="travel_time",
        )

        comparisons: Dict[str, AlgorithmComparisonItem] = {
            "BFS": AlgorithmComparisonItem(
                algorithm="BFS",
                found=bfs_res["found"],
                selected_exit=bfs_res.get("selected_exit"),
                path=bfs_res.get("path", []),
                total_edges=bfs_res.get("total_edges", 0),
                total_distance=bfs_res.get("total_distance", 0.0),
                estimated_travel_time=bfs_res.get("estimated_travel_time", 0.0),
                total_cost=bfs_res.get("total_cost", 0.0),
                nodes_expanded=bfs_res.get("nodes_expanded", 0),
                execution_time_ms=bfs_res.get("execution_time_ms", 0.0),
                objective_description="Minimizes number of edge hops (connections), ignoring physical length and hazards.",
            ),
            "Dijkstra": AlgorithmComparisonItem(
                algorithm="Dijkstra",
                found=dijk_res["found"],
                selected_exit=dijk_res.get("selected_exit"),
                path=dijk_res.get("path", []),
                total_edges=dijk_res.get("total_edges", 0),
                total_distance=dijk_res.get("total_distance", 0.0),
                estimated_travel_time=dijk_res.get("estimated_travel_time", 0.0),
                total_cost=dijk_res.get("total_cost", 0.0),
                nodes_expanded=dijk_res.get("nodes_expanded", 0),
                execution_time_ms=dijk_res.get("execution_time_ms", 0.0),
                objective_description="Guarantees optimal cumulative travel time by systematically expanding nodes in cost order.",
            ),
            "A*": AlgorithmComparisonItem(
                algorithm="A*",
                found=astar_res["found"],
                selected_exit=astar_res.get("selected_exit"),
                path=astar_res.get("path", []),
                total_edges=astar_res.get("total_edges", 0),
                total_distance=astar_res.get("total_distance", 0.0),
                estimated_travel_time=astar_res.get("estimated_travel_time", 0.0),
                total_cost=astar_res.get("total_cost", 0.0),
                nodes_expanded=astar_res.get("nodes_expanded", 0),
                execution_time_ms=astar_res.get("execution_time_ms", 0.0),
                objective_description="Guarantees optimal cumulative travel time while pruning search using an admissible Euclidean heuristic.",
            ),
        }

        # Synthesize educational analysis
        analysis_lines = [
            f"Comparison from starting location '{start_name}':",
            f"1. BFS selected path with {comparisons['BFS'].total_edges} edge hops (Nodes expanded: {comparisons['BFS'].nodes_expanded}).",
            f"2. Dijkstra identified an optimal path with travel time {comparisons['Dijkstra'].estimated_travel_time}s (Nodes expanded: {comparisons['Dijkstra'].nodes_expanded}).",
            f"3. A* achieved the exact same optimal travel time {comparisons['A*'].estimated_travel_time}s while expanding {comparisons['A*'].nodes_expanded} nodes.",
        ]

        if comparisons["A*"].nodes_expanded <= comparisons["Dijkstra"].nodes_expanded:
            reduction = comparisons["Dijkstra"].nodes_expanded - comparisons["A*"].nodes_expanded
            analysis_lines.append(
                f"Observation: A*'s Euclidean distance heuristic allowed it to prune the search space, "
                f"expanding {reduction} fewer nodes than uninformed Dijkstra."
            )

        if comparisons["BFS"].total_edges <= comparisons["Dijkstra"].total_edges and comparisons["BFS"].total_distance > comparisons["Dijkstra"].total_distance:
            analysis_lines.append(
                "Key Distinction: BFS found fewer edge hops, but Dijkstra/A* found a shorter physical distance, "
                "demonstrating that shortest hop count is not necessarily shortest physical travel."
            )

        return AlgorithmComparisonResponse(
            start_node=start_node_id,
            start_node_name=start_name,
            requires_accessible_route=requires_accessible,
            comparisons=comparisons,
            analysis=" ".join(analysis_lines),
        )

    def _generate_step_instructions(self, path: List[str], speed: float = 1.2) -> List[RouteStepInstruction]:
        """Creates sequential navigation instructions from an ordered list of node IDs."""
        instructions: List[RouteStepInstruction] = []
        if not path:
            return instructions

        for idx, node_id in enumerate(path):
            node = self.graph_service.get_node(node_id)
            if not node:
                continue

            node_name = node.name
            floor = node.floor
            edge_dist = 0.0
            edge_time = 0.0
            warning = None

            # Calculate edge transition from previous node
            if idx > 0:
                prev_id = path[idx - 1]
                edge = self.graph_service.get_edge(prev_id, node_id)
                if edge:
                    edge_dist = edge.distance
                    edge_time = round(edge.distance / max(0.2, speed), 1)
                    if edge.hazard_level > 20:
                        warning = f"Caution: Elevated hazard level ({edge.hazard_level}/100) along this corridor."
                    elif edge.crowd_density > 0.6:
                        warning = f"Notice: Moderate crowd density ({int(edge.crowd_density * 100)}%) in this passageway."

            # Generate natural language instruction based on location type
            if idx == 0:
                text = f"Evacuate immediately from {node_name} (Floor {floor})."
            elif idx == len(path) - 1:
                if node.is_exit and node.type == NodeType.ASSEMBLY_AREA:
                    text = f"Arrive at {node_name}. Assemble and check in with safety wardens."
                elif node.is_exit:
                    text = f"Exit building through {node_name}. Proceed immediately to open assembly grounds."
                else:
                    text = f"Reach destination waypoint {node_name}."
            else:
                if node.type == NodeType.STAIRS:
                    text = f"Use {node_name} to descend to Ground Floor (Distance: {edge_dist}m, ~{edge_time}s)."
                elif node.type == NodeType.RAMP:
                    text = f"Navigate down the {node_name} to external ground level (Distance: {edge_dist}m, ~{edge_time}s)."
                elif node.type == NodeType.CORRIDOR:
                    text = f"Proceed along {node_name} (Distance: {edge_dist}m, ~{edge_time}s)."
                else:
                    text = f"Pass through {node_name} (Distance: {edge_dist}m, ~{edge_time}s)."

            instructions.append(
                RouteStepInstruction(
                    step_number=idx + 1,
                    instruction=text,
                    location_id=node_id,
                    location_name=node_name,
                    floor=floor,
                    edge_distance=edge_dist,
                    edge_time=edge_time,
                    hazard_warning=warning,
                )
            )

        return instructions
