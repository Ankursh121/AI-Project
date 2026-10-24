"""
Evacuation Agent Implementation.
Simulates individual evacuation groups with realistic edge-by-edge progress,
speed adjustments based on crowd density, dynamic route validation, and automatic replanning.
Strictly prohibits instantaneous teleportation between nodes.
"""

from typing import List, Optional, Tuple
from app.algorithms.utility_agent import run_utility_agent
from app.models.schemas import AgentStatus, EvacuationAgentModel
from app.services.building_service import BuildingGraphService
from app.simulation.crowd import CrowdManager


class EvacuationAgent:
    """Controls the dynamic behavioral lifecycle of an evacuating group."""

    def __init__(self, model: EvacuationAgentModel):
        self.model = model
        self.distance_along_current_edge: float = 0.0

    @property
    def id(self) -> str:
        return self.model.agent_id

    @property
    def status(self) -> AgentStatus:
        return self.model.status

    def plan_initial_route(self, graph_service: BuildingGraphService) -> bool:
        """Computes initial route to safe exit using Utility Agent."""
        res = run_utility_agent(
            graph_service,
            start_node_id=self.model.current_location,
            requires_accessible=self.model.requires_accessible_route,
            avoid_blocked=True,
            speed=self.model.movement_speed,
        )
        if res["found"]:
            self.model.assigned_route = res["path"]
            self.model.destination_exit = res["selected_exit"]
            self.model.current_route_index = 0
            self.model.estimated_arrival_time = res["estimated_travel_time"]
            self.model.status = AgentStatus.EVACUATING
            self.distance_along_current_edge = 0.0
            return True
        else:
            self.model.status = AgentStatus.TRAPPED
            self.model.reroute_reasons.append("Initial route planning failed: No safe exit accessible.")
            return False

    def validate_current_route(self, graph_service: BuildingGraphService) -> Tuple[bool, str]:
        """
        Validates whether remaining steps along the assigned path are still safe and passable.
        Returns (is_valid, invalidation_reason).
        """
        if self.model.status not in (AgentStatus.EVACUATING, AgentStatus.REROUTING):
            return True, ""

        path = self.model.assigned_route
        curr_idx = self.model.current_route_index

        if not path or curr_idx >= len(path):
            return False, "Assigned route is empty or index out of range."

        # Check remaining edges and nodes
        for i in range(curr_idx, len(path) - 1):
            u, v = path[i], path[i + 1]
            edge = graph_service.get_edge(u, v)
            node_v = graph_service.get_node(v)

            if not edge or not node_v:
                return False, f"Waypoint connection ({u} -> {v}) no longer exists."

            # Blockage check
            if edge.is_blocked:
                return False, f"Corridor between '{u}' and '{v}' is physically blocked."
            if node_v.is_blocked:
                return False, f"Destination node '{node_v.name}' is physically blocked."

            # Lethal hazard check
            if edge.hazard_level >= 75.0:
                return False, f"Hazard level on corridor ({u}->{v}) reached dangerous level ({edge.hazard_level}/100)."
            if node_v.hazard_level >= 75.0:
                return False, f"Hazard level at '{node_v.name}' reached dangerous level ({node_v.hazard_level}/100)."

            # Accessibility check
            if self.model.requires_accessible_route and (not edge.accessible or not node_v.accessible):
                return False, f"Route segment ({u}->{v}) violates accessibility constraints."

        return True, ""

    def replan_route(self, graph_service: BuildingGraphService, reason: str) -> bool:
        """
        Dynamically calculates a new route from the current location
        when an obstacle or hazard invalidates the existing plan.
        """
        self.model.reroute_count += 1
        log_msg = f"Reroute #{self.model.reroute_count} at '{self.model.current_location}': {reason}"
        self.model.reroute_reasons.append(log_msg)

        res = run_utility_agent(
            graph_service,
            start_node_id=self.model.current_location,
            requires_accessible=self.model.requires_accessible_route,
            avoid_blocked=True,
            speed=self.model.movement_speed,
        )

        if res["found"]:
            self.model.assigned_route = res["path"]
            self.model.destination_exit = res["selected_exit"]
            self.model.current_route_index = 0
            self.distance_along_current_edge = 0.0
            self.model.status = AgentStatus.EVACUATING
            return True
        else:
            self.model.status = AgentStatus.TRAPPED
            self.model.assigned_route = []
            self.model.destination_exit = None
            self.model.reroute_reasons.append("Replanning failed: No alternate safe exit is reachable.")
            return False

    def advance_movement(
        self,
        time_delta: float,
        graph_service: BuildingGraphService,
        crowd_manager: CrowdManager,
        elapsed_sim_time: float,
    ) -> Optional[str]:
        """
        Moves the agent forward along its current route segment by (speed * time_delta).
        No teleportation is permitted. Edge traversal requires elapsed physical time.
        Returns event message if state changes (e.g. evacuated).
        """
        if self.model.status != AgentStatus.EVACUATING:
            return None

        path = self.model.assigned_route
        curr_idx = self.model.current_route_index

        # If already at destination exit
        curr_node = graph_service.get_node(self.model.current_location)
        if curr_node and curr_node.is_exit:
            self.model.status = AgentStatus.EVACUATED
            self.model.actual_evacuation_time = round(elapsed_sim_time, 1)
            return f"Agent '{self.model.name}' successfully reached safe exit '{curr_node.name}' at T={elapsed_sim_time}s."

        if not path or curr_idx >= len(path) - 1:
            # End of route
            if curr_node and curr_node.is_exit:
                self.model.status = AgentStatus.EVACUATED
                self.model.actual_evacuation_time = round(elapsed_sim_time, 1)
                return f"Agent '{self.model.name}' evacuated at '{curr_node.name}'."
            else:
                self.model.status = AgentStatus.TRAPPED
                return f"Agent '{self.model.name}' reached route terminus at non-exit location '{self.model.current_location}'."

        u = path[curr_idx]
        v = path[curr_idx + 1]
        edge = graph_service.get_edge(u, v)

        if not edge:
            self.model.status = AgentStatus.TRAPPED
            return f"Agent '{self.model.name}' stranded: missing edge ({u} -> {v})."

        # Calculate speed adjusted for corridor crowd congestion
        effective_speed = crowd_manager.calculate_effective_speed(self.model.movement_speed, u, v)
        travel_step_dist = effective_speed * time_delta

        self.distance_along_current_edge += travel_step_dist

        # Check if reached target node v
        if self.distance_along_current_edge >= edge.distance:
            # Transition to node v
            self.model.current_location = v
            self.model.current_route_index += 1
            self.distance_along_current_edge = 0.0

            target_node = graph_service.get_node(v)
            if target_node and target_node.is_exit:
                self.model.status = AgentStatus.EVACUATED
                self.model.actual_evacuation_time = round(elapsed_sim_time, 1)
                return f"Agent '{self.model.name}' reached safe exit '{target_node.name}' at T={elapsed_sim_time}s!"

        return None
