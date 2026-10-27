"""
Simulation package: Multi-agent coordination, dynamic hazards, and pedestrian crowd dynamics.
"""

from .agents import EvacuationAgent
from .crowd import CrowdManager
from .engine import SimulationEngine
from .environment import SimulationEnvironment
from .hazards import HazardManager

__all__ = [
    "EvacuationAgent",
    "CrowdManager",
    "SimulationEngine",
    "SimulationEnvironment",
    "HazardManager",
]
