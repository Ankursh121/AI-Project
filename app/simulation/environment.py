"""
Simulation Environment.
Encapsulates building physical geometry, hazard manager, crowd manager,
and simulation clock into a unified world state.
"""

from typing import List, Optional
from app.models.schemas import HazardEvent
from app.services.building_service import BuildingGraphService
from app.simulation.crowd import CrowdManager
from app.simulation.hazards import HazardManager


class SimulationEnvironment:
    """Represents the world context in which agents navigate and emergencies unfold."""

    def __init__(self, graph_service: Optional[BuildingGraphService] = None):
        self.graph_service = graph_service or BuildingGraphService()
        self.hazard_manager = HazardManager(self.graph_service)
        self.crowd_manager = CrowdManager(self.graph_service)
        self.time_elapsed_seconds: float = 0.0
        self.current_step: int = 0

    def apply_hazard(self, hazard: HazardEvent) -> List[str]:
        """Applies an environmental hazard to the world."""
        return self.hazard_manager.apply_hazard(hazard)

    def advance_time(self, time_delta: float = 5.0) -> List[str]:
        """Advances clock and steps hazard progression."""
        self.current_step += 1
        self.time_elapsed_seconds += time_delta
        return self.hazard_manager.step_progression()

    def reset(self) -> None:
        """Restores the environment to its initial pristine condition."""
        self.time_elapsed_seconds = 0.0
        self.current_step = 0
        self.hazard_manager.reset()
        self.crowd_manager.reset()
        self.graph_service.reload()
