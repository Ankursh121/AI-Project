"""
Crowd Congestion and Density Management Model.
Tracks corridor occupancy loads, computes normalized density ratios,
and applies realistic flow-rate speed degradation to evacuating groups.
"""

from typing import Dict, List, Optional, Tuple
from app.models.schemas import CongestedEdgeInfo, EvacuationAgentModel, AgentStatus
from app.services.building_service import BuildingGraphService


class CrowdManager:
    """Manages dynamic pedestrian density and bottleneck identification."""

    def __init__(self, graph_service: BuildingGraphService):
        self.graph_service = graph_service
        # (u, v) -> current person count
        self.edge_occupancy: Dict[Tuple[str, str], int] = {}
        # node_id -> current person count
        self.node_occupancy: Dict[str, int] = {}

    def update_crowd_distribution(self, agents: List[EvacuationAgentModel]) -> None:
        """
        Recalculates occupancy counts across all corridors and nodes based on
        current agent positions and group sizes.
        """
        self.edge_occupancy.clear()
        self.node_occupancy.clear()

        for agent in agents:
            if agent.status not in (AgentStatus.EVACUATING, AgentStatus.IDLE, AgentStatus.REROUTING):
                continue

            path = agent.assigned_route
            idx = agent.current_route_index

            # If agent is in transit between path[idx] and path[idx+1]
            if path and idx < len(path) - 1:
                u, v = path[idx], path[idx + 1]
                pair = (u, v)
                self.edge_occupancy[pair] = self.edge_occupancy.get(pair, 0) + agent.group_size
                # Also record bidirectional occupancy
                pair_rev = (v, u)
                self.edge_occupancy[pair_rev] = self.edge_occupancy.get(pair_rev, 0) + agent.group_size
            elif path and idx < len(path):
                curr = path[idx]
                self.node_occupancy[curr] = self.node_occupancy.get(curr, 0) + agent.group_size
            else:
                curr = agent.current_location
                self.node_occupancy[curr] = self.node_occupancy.get(curr, 0) + agent.group_size

        # Update edge models in the graph service with normalized density
        for edge in self.graph_service.building_model.edges:
            pair = (edge.source, edge.target)
            flow = self.edge_occupancy.get(pair, 0)
            edge.crowd_density = round(flow / max(1, edge.capacity), 2)

    def calculate_effective_speed(self, base_speed: float, u: str, v: str) -> float:
        """
        Calculates speed reduction caused by hallway crowd density.
        Based on standard pedestrian flow relationship:
          effective_speed = base_speed * max(0.25, 1.0 - 0.7 * min(1.0, density))
        """
        edge = self.graph_service.get_edge(u, v)
        if not edge:
            return base_speed

        density = edge.crowd_density
        speed_factor = max(0.25, 1.0 - (0.7 * min(1.0, density)))
        return round(base_speed * speed_factor, 2)

    def get_congested_corridors(self, threshold: float = 0.60) -> List[CongestedEdgeInfo]:
        """Returns all corridor segments exceeding the specified congestion threshold."""
        congested: List[CongestedEdgeInfo] = []
        seen = set()

        for edge in self.graph_service.building_model.edges:
            pair_key = tuple(sorted([edge.source, edge.target]))
            if pair_key in seen:
                continue
            seen.add(pair_key)

            if edge.crowd_density >= threshold:
                src_node = self.graph_service.get_node(edge.source)
                tgt_node = self.graph_service.get_node(edge.target)
                flow = self.edge_occupancy.get((edge.source, edge.target), 0)

                congested.append(
                    CongestedEdgeInfo(
                        edge=f"{edge.source} <-> {edge.target}",
                        source_name=src_node.name if src_node else edge.source,
                        target_name=tgt_node.name if tgt_node else edge.target,
                        density=edge.crowd_density,
                        current_flow=flow,
                        capacity=edge.capacity,
                    )
                )

        # Sort descending by congestion density
        congested.sort(key=lambda x: x.density, reverse=True)
        return congested

    def reset(self) -> None:
        """Resets all crowd counts and edge densities to zero."""
        self.edge_occupancy.clear()
        self.node_occupancy.clear()
        for edge in self.graph_service.building_model.edges:
            edge.crowd_density = 0.0
