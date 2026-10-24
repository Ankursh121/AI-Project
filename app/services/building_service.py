"""
Building and Graph Representation Service.
Handles loading, strict validation, and graph query operations for the building layout.
Supports weighted undirected and directed connections, multi-exit querying,
and accessibility filtering.
"""

import json
import math
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Any

import networkx as nx

from app.models.schemas import BuildingGraphModel, EdgeModel, NodeModel


class BuildingGraphService:
    """
    Manages the physical building layout as an adjacency-list graph structure.
    Provides fast neighbor traversal, traversability checks, and edge attribute lookups.
    """

    def __init__(self, data_path: Optional[str] = None):
        self.default_data_path = data_path or str(
            Path(__file__).resolve().parent.parent / "data" / "sample_building.json"
        )
        self.building_model: Optional[BuildingGraphModel] = None
        self.nodes: Dict[str, NodeModel] = {}
        # Adjacency list: node_id -> list of (neighbor_id, EdgeModel)
        self.adjacency: Dict[str, List[Tuple[str, EdgeModel]]] = {}
        # Edge lookup: (min(u,v), max(u,v)) -> EdgeModel for undirected, or (u, v) for directed
        self.edge_map: Dict[Tuple[str, str], EdgeModel] = {}
        self.load_building(self.default_data_path)

    def load_building(self, file_path_or_dict: Any) -> None:
        """
        Loads and validates building layout from a JSON file or dictionary.
        Raises ValueError if the graph structure violates physical or schema rules.
        """
        if isinstance(file_path_or_dict, (str, Path)):
            path = Path(file_path_or_dict)
            if not path.exists():
                raise FileNotFoundError(f"Building data file not found at: {path}")
            with open(path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
        elif isinstance(file_path_or_dict, dict):
            raw_data = file_path_or_dict
        else:
            raise TypeError("Expected file path string or dict for building data")

        # Pydantic validation handles schema, duplicate IDs, and basic endpoint validity
        self.building_model = BuildingGraphModel.model_validate(raw_data)

        # Build internal graph structures
        self.nodes = {node.id: node for node in self.building_model.nodes}
        self.adjacency = {node.id: [] for node in self.building_model.nodes}
        self.edge_map = {}

        for edge in self.building_model.edges:
            # Validate non-negative properties
            if edge.distance <= 0:
                raise ValueError(f"Edge ({edge.source} -> {edge.target}) has invalid non-positive distance: {edge.distance}")
            if edge.base_travel_time <= 0:
                raise ValueError(f"Edge ({edge.source} -> {edge.target}) has invalid non-positive travel time: {edge.base_travel_time}")
            if edge.capacity <= 0:
                raise ValueError(f"Edge ({edge.source} -> {edge.target}) has invalid non-positive capacity: {edge.capacity}")

            # Store in adjacency list
            self.adjacency[edge.source].append((edge.target, edge))
            self.edge_map[(edge.source, edge.target)] = edge

            # If undirected, add reverse connection
            if not edge.one_way:
                self.adjacency[edge.target].append((edge.source, edge))
                self.edge_map[(edge.target, edge.source)] = edge

    def reload(self) -> None:
        """Restores building graph to clean default state from disk."""
        self.load_building(self.default_data_path)

    def get_node(self, node_id: str) -> Optional[NodeModel]:
        """Returns node model by ID or None."""
        return self.nodes.get(node_id)

    def get_edge(self, u: str, v: str) -> Optional[EdgeModel]:
        """Returns edge model connecting u and v, or None."""
        return self.edge_map.get((u, v))

    def get_exits(
        self,
        requires_accessible: bool = False,
        avoid_blocked: bool = True,
        max_hazard: float = 75.0,
    ) -> List[NodeModel]:
        """
        Retrieves all valid emergency exit nodes matching accessibility and safety constraints.
        """
        valid_exits = []
        for node in self.nodes.values():
            if not node.is_exit:
                continue
            if avoid_blocked and node.is_blocked:
                continue
            if node.hazard_level >= max_hazard:
                continue
            if requires_accessible and not node.accessible:
                continue
            valid_exits.append(node)
        return valid_exits

    def get_neighbors(
        self,
        node_id: str,
        requires_accessible: bool = False,
        avoid_blocked: bool = True,
        max_hazard: float = 75.0,
    ) -> List[Tuple[str, EdgeModel]]:
        """
        Returns traversable (neighbor_id, edge) pairs from node_id.
        Filters out blocked corridors, inaccessible routes for wheelchair users,
        and lethal hazards.
        """
        if node_id not in self.adjacency:
            return []

        traversable: List[Tuple[str, EdgeModel]] = []
        for neighbor_id, edge in self.adjacency[node_id]:
            neighbor_node = self.nodes[neighbor_id]

            # Blockage check
            if avoid_blocked and (edge.is_blocked or neighbor_node.is_blocked):
                continue

            # Accessibility check (Hard constraint: wheelchairs cannot take stairs or inaccessible paths)
            if requires_accessible and (not edge.accessible or not neighbor_node.accessible):
                continue

            # Lethal hazard check (hard cutoff)
            if edge.hazard_level >= max_hazard or neighbor_node.hazard_level >= max_hazard:
                continue

            traversable.append((neighbor_id, edge))

        return traversable

    def calculate_effective_edge_cost(
        self,
        edge: EdgeModel,
        w_time: float = 0.35,
        w_hazard: float = 0.40,
        w_crowd: float = 0.25,
        speed: float = 1.2,
    ) -> float:
        """
        Calculates the dynamic edge traversal cost combining:
        1. Base travel time (adjusted by agent movement speed).
        2. Hazard exposure penalty.
        3. Crowd congestion delay penalty.

        Formula:
          cost = w_time * T_eff + w_hazard * H_pen + w_crowd * C_pen
        Guarantees non-negative cost.
        """
        # 1. Effective travel time in seconds: distance / speed
        effective_time = edge.distance / max(0.2, speed)

        # 2. Hazard penalty: non-linear escalation for moderate-to-high hazards
        # Level 0 -> 0s, Level 50 -> 25s equivalent, Level 70 -> 49s equivalent
        hazard_norm = min(100.0, max(0.0, edge.hazard_level)) / 100.0
        hazard_penalty = (hazard_norm ** 2) * 100.0

        # 3. Crowd congestion penalty:
        # Density <= 0.2: free flow (0 penalty)
        # Density > 0.2: bottleneck delay increases proportional to overcapacity
        density = max(0.0, edge.crowd_density)
        if density > 0.2:
            congestion_penalty = (density - 0.2) * 50.0 * (edge.distance / 10.0)
        else:
            congestion_penalty = 0.0

        # Weighted combination
        cost = (w_time * effective_time) + (w_hazard * hazard_penalty) + (w_crowd * congestion_penalty)
        return max(0.1, cost)

    def euclidean_distance(self, node_a_id: str, node_b_id: str) -> float:
        """
        Calculates 3D Euclidean distance between two nodes including floor elevation.
        Used as an admissible heuristic for A* search.
        Floor height assumed to be 4.0 meters.
        """
        a = self.nodes.get(node_a_id)
        b = self.nodes.get(node_b_id)
        if not a or not b:
            return 0.0

        dx = a.x - b.x
        dy = a.y - b.y
        dz = (a.floor - b.floor) * 4.0
        return math.sqrt(dx * dx + dy * dy + dz * dz)

    def to_networkx(self) -> nx.Graph:
        """
        Converts the building model to a NetworkX Graph for verification and validation.
        """
        G = nx.Graph()
        for node in self.building_model.nodes:
            G.add_node(
                node.id,
                name=node.name,
                type=node.type.value if hasattr(node.type, "value") else str(node.type),
                floor=node.floor,
                x=node.x,
                y=node.y,
                is_exit=node.is_exit,
                is_blocked=node.is_blocked,
                hazard_level=node.hazard_level,
                accessible=node.accessible,
            )
        for edge in self.building_model.edges:
            G.add_edge(
                edge.source,
                edge.target,
                distance=edge.distance,
                base_travel_time=edge.base_travel_time,
                capacity=edge.capacity,
                crowd_density=edge.crowd_density,
                hazard_level=edge.hazard_level,
                is_blocked=edge.is_blocked,
                accessible=edge.accessible,
                width=edge.width,
            )
        return G
