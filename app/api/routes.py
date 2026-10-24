"""
FastAPI Route Handlers for Emergency Evacuation Planning and Simulation.
Provides endpoints for graph query, route optimization, algorithm benchmarking,
multi-agent simulation stepping, hazard injection, and evacuation reports.
"""

from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.models.schemas import (
    AlgorithmComparisonResponse,
    BuildingGraphModel,
    EvacuationReportResponse,
    HazardEvent,
    RouteRequest,
    RouteResponse,
    ScenarioModel,
    SimulationStepRequest,
    SimulationStateResponse,
)
from app.services.building_service import BuildingGraphService
from app.services.report_service import ReportService
from app.services.routing_service import RoutingService
from app.simulation.engine import SimulationEngine

router = APIRouter()

# Global service instances (In-memory session for academic demonstration)
graph_service = BuildingGraphService()
routing_service = RoutingService(graph_service)
simulation_engine = SimulationEngine()
report_service = ReportService(simulation_engine)


class CompareRequest(BaseModel):
    """Request payload for comparing BFS, Dijkstra, and A*."""
    start_node: str = Field(..., description="ID of starting location")
    requires_accessible_route: bool = Field(False, description="Whether to require step-free paths")
    speed: float = Field(1.2, gt=0.1, description="Walking speed in m/s")


class ResetRequest(BaseModel):
    """Request payload to reset or load a scenario."""
    scenario_id: Optional[str] = Field("scenario_a_normal", description="ID of scenario to initialize")


@router.get(
    "/health",
    summary="Service Health Check",
    tags=["System"],
)
def health_check() -> Dict[str, Any]:
    """Returns operational health status and loaded graph size."""
    return {
        "status": "healthy",
        "service": "Emergency Evacuation Planning & Simulation System",
        "nodes_loaded": len(graph_service.nodes),
        "edges_loaded": len(graph_service.building_model.edges),
        "active_scenario": simulation_engine.current_scenario_name,
    }


@router.get(
    "/building",
    response_model=BuildingGraphModel,
    summary="Get Building Graph Layout",
    tags=["Building Layout"],
)
def get_building_graph() -> BuildingGraphModel:
    """Returns the full building graph including all nodes, edges, coordinates, and attributes."""
    if not graph_service.building_model:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Building layout could not be loaded.",
        )
    return graph_service.building_model


@router.get(
    "/scenarios",
    response_model=List[ScenarioModel],
    summary="List Demonstration Scenarios",
    tags=["Simulation"],
)
def list_scenarios() -> List[ScenarioModel]:
    """Returns list of prebuilt educational emergency scenarios."""
    return list(simulation_engine.scenarios.values())


@router.post(
    "/route",
    response_model=RouteResponse,
    summary="Calculate Evacuation Route",
    tags=["Routing Engine"],
)
def calculate_route(request: RouteRequest) -> RouteResponse:
    """
    Computes an optimal evacuation route from start_node to a safe exit
    using BFS, Dijkstra, A*, or Utility Agent.
    """
    node = graph_service.get_node(request.start_node)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Start location node '{request.start_node}' not found in building graph.",
        )

    response = routing_service.calculate_route(request)
    return response


@router.post(
    "/compare-algorithms",
    response_model=AlgorithmComparisonResponse,
    summary="Compare BFS, Dijkstra, and A*",
    tags=["Routing Engine"],
)
def compare_algorithms(request: CompareRequest) -> AlgorithmComparisonResponse:
    """
    Executes BFS, Dijkstra, and A* side-by-side from the same starting node
    under identical graph conditions and returns an educational comparative analysis.
    """
    node = graph_service.get_node(request.start_node)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Start location node '{request.start_node}' does not exist.",
        )

    return routing_service.compare_algorithms(
        start_node_id=request.start_node,
        requires_accessible=request.requires_accessible_route,
        speed=request.speed,
    )


@router.post(
    "/simulate",
    response_model=SimulationStateResponse,
    summary="Advance Simulation Steps",
    tags=["Simulation"],
)
def advance_simulation(request: SimulationStepRequest) -> SimulationStateResponse:
    """
    Advances multi-agent simulation forward by a given number of steps,
    or runs to completion until all agents evacuate or become trapped.
    """
    if request.run_to_completion:
        simulation_engine.run_to_completion(max_steps=request.max_steps)
    else:
        simulation_engine.step(num_steps=request.steps)

    return simulation_engine.get_state()


@router.get(
    "/simulation/state",
    response_model=SimulationStateResponse,
    summary="Get Simulation State",
    tags=["Simulation"],
)
def get_simulation_state() -> SimulationStateResponse:
    """Returns snapshot of current agents, active hazards, clock time, and recent events."""
    return simulation_engine.get_state()


@router.post(
    "/hazards",
    summary="Inject Dynamic Hazard Event",
    tags=["Simulation"],
)
def inject_hazard(hazard: HazardEvent) -> Dict[str, Any]:
    """
    Dynamically applies a fire, smoke, flood, or blockage event to a node or corridor.
    Automatically triggers real-time route invalidation and replanning for affected agents.
    """
    logs = simulation_engine.inject_hazard(hazard)
    return {
        "status": "applied",
        "hazard_id": hazard.hazard_id,
        "hazard_type": hazard.hazard_type.value,
        "logs": logs,
        "current_state": simulation_engine.get_state(),
    }


@router.post(
    "/reset",
    summary="Reset Simulation and Scenarios",
    tags=["Simulation"],
)
def reset_simulation(
    request: Optional[ResetRequest] = None,
    scenario_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Restores the environment and initializes the specified demonstration scenario."""
    target_id = (request.scenario_id if request else None) or scenario_id or "scenario_normal"
    success = simulation_engine.initialize_scenario(target_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario ID '{target_id}' not found.",
        )
    return {
        "status": "reset_successful",
        "scenario": simulation_engine.current_scenario_name,
        "state": simulation_engine.get_state(),
    }


@router.get(
    "/report",
    response_model=EvacuationReportResponse,
    summary="Generate Evacuation Report",
    tags=["Reporting"],
)
def get_evacuation_report() -> EvacuationReportResponse:
    """Generates structured analytics based on actual simulation performance metrics."""
    return report_service.generate_report()
