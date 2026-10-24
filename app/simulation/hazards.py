"""
Dynamic Hazard Simulation and Progression Model.
Simulates fire, smoke diffusion, water accumulation, and structural blockages.
Provides deterministic progression rules and triggers route invalidation events.
"""

from typing import Dict, List, Optional, Set, Tuple
from app.models.schemas import HazardEvent, HazardType
from app.services.building_service import BuildingGraphService


class HazardManager:
    """Manages active environmental hazards and their spatial progression over time."""

    def __init__(self, graph_service: BuildingGraphService):
        self.graph_service = graph_service
        self.active_hazards: Dict[str, HazardEvent] = {}
        # Records initial clean states so hazards can be cleared
        self._initial_node_states: Dict[str, Tuple[float, bool]] = {
            n.id: (n.hazard_level, n.is_blocked) for n in graph_service.nodes.values()
        }
        self._initial_edge_states: Dict[Tuple[str, str], Tuple[float, bool]] = {
            (e.source, e.target): (e.hazard_level, e.is_blocked) for e in graph_service.building_model.edges
        }

    def apply_hazard(self, hazard: HazardEvent) -> List[str]:
        """
        Applies a hazard event to the building graph.
        Returns a list of event log messages.
        """
        self.active_hazards[hazard.hazard_id] = hazard
        logs: List[str] = []

        is_impassable = (not hazard.is_passable) or (hazard.severity >= 75.0)

        if hazard.location_type == "node":
            node = self.graph_service.get_node(hazard.target_id)
            if node:
                node.hazard_level = max(node.hazard_level, hazard.severity)
                if is_impassable:
                    node.is_blocked = True
                status_str = "BLOCKED / IMPASSABLE" if is_impassable else f"Passable with penalty ({hazard.severity}/100)"
                logs.append(f"Hazard applied: {hazard.hazard_type.value.upper()} at Node '{node.name}' [{status_str}].")
            else:
                logs.append(f"Warning: Node '{hazard.target_id}' not found for hazard '{hazard.hazard_id}'.")

        elif hazard.location_type == "edge":
            # Target ID formatted as "source-target"
            endpoints = hazard.target_id.split("-")
            if len(endpoints) == 2:
                u, v = endpoints[0], endpoints[1]
                edge = self.graph_service.get_edge(u, v)
                if edge:
                    edge.hazard_level = max(edge.hazard_level, hazard.severity)
                    if is_impassable:
                        edge.is_blocked = True
                    logs.append(f"Hazard applied: {hazard.hazard_type.value.upper()} on Corridor ({u} <-> {v}).")
                else:
                    logs.append(f"Warning: Edge '{hazard.target_id}' not found for hazard '{hazard.hazard_id}'.")

        return logs

    def clear_hazard(self, hazard_id: str) -> bool:
        """Removes an active hazard and restores initial node/edge status."""
        if hazard_id not in self.active_hazards:
            return False

        hazard = self.active_hazards.pop(hazard_id)
        if hazard.location_type == "node":
            node = self.graph_service.get_node(hazard.target_id)
            if node and hazard.target_id in self._initial_node_states:
                init_haz, init_blk = self._initial_node_states[hazard.target_id]
                node.hazard_level = init_haz
                node.is_blocked = init_blk
        elif hazard.location_type == "edge":
            endpoints = hazard.target_id.split("-")
            if len(endpoints) == 2:
                u, v = endpoints[0], endpoints[1]
                edge = self.graph_service.get_edge(u, v)
                if edge and (edge.source, edge.target) in self._initial_edge_states:
                    init_haz, init_blk = self._initial_edge_states[(edge.source, edge.target)]
                    edge.hazard_level = init_haz
                    edge.is_blocked = init_blk
        return True

    def step_progression(self) -> List[str]:
        """
        Advances all active hazards deterministically by one simulation step:
        - Increases severity according to spread_rate.
        - Spreads smoke/hazards to immediately adjacent nodes if spread_to_neighbors is enabled.
        - Escalates to blocked status when severity reaches critical threshold (>= 75.0).
        """
        event_logs: List[str] = []
        newly_spread_hazards: List[HazardEvent] = []

        for h_id, hazard in list(self.active_hazards.items()):
            if not hazard.active:
                continue

            # 1. Increase current severity
            prev_severity = hazard.severity
            hazard.severity = min(100.0, hazard.severity + hazard.spread_rate)

            # Check if escalated to impassable
            if hazard.severity >= 75.0 and not hazard.is_passable:
                pass  # already impassable
            elif hazard.severity >= 75.0 and prev_severity < 75.0:
                hazard.is_passable = False
                event_logs.append(f"CRITICAL: Hazard '{h_id}' escalated to severity {hazard.severity}. Area is now IMPASSABLE.")

            # Update actual node / edge values
            if hazard.location_type == "node":
                node = self.graph_service.get_node(hazard.target_id)
                if node:
                    node.hazard_level = hazard.severity
                    if not hazard.is_passable:
                        node.is_blocked = True

                    # 2. Spread smoke to adjacent corridors/nodes if enabled
                    if hazard.spread_to_neighbors and hazard.severity >= 40.0:
                        for neighbor_id, edge in self.graph_service.adjacency.get(node.id, []):
                            # Spread secondary smoke with reduced intensity
                            smoke_id = f"smoke_spread_{node.id}_{neighbor_id}"
                            if smoke_id not in self.active_hazards:
                                secondary_hazard = HazardEvent(
                                    hazard_id=smoke_id,
                                    hazard_type=HazardType.SMOKE,
                                    location_type="node",
                                    target_id=neighbor_id,
                                    severity=round(hazard.severity * 0.45, 1),
                                    spread_rate=hazard.spread_rate * 0.5,
                                    spread_to_neighbors=False,
                                    is_passable=True,
                                    active=True,
                                    description=f"Smoke diffused from {node.name}",
                                )
                                newly_spread_hazards.append(secondary_hazard)

            elif hazard.location_type == "edge":
                endpoints = hazard.target_id.split("-")
                if len(endpoints) == 2:
                    edge = self.graph_service.get_edge(endpoints[0], endpoints[1])
                    if edge:
                        edge.hazard_level = hazard.severity
                        if not hazard.is_passable:
                            edge.is_blocked = True

        # Apply secondary spread events
        for new_h in newly_spread_hazards:
            event_logs.extend(self.apply_hazard(new_h))

        return event_logs

    def reset(self) -> None:
        """Clears all active hazards and resets graph hazard levels."""
        self.active_hazards.clear()
        for node_id, (haz, blk) in self._initial_node_states.items():
            node = self.graph_service.get_node(node_id)
            if node:
                node.hazard_level = haz
                node.is_blocked = blk

        for (u, v), (haz, blk) in self._initial_edge_states.items():
            edge = self.graph_service.get_edge(u, v)
            if edge:
                edge.hazard_level = haz
                edge.is_blocked = blk
