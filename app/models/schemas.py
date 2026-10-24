"""
Pydantic data models for the Emergency Evacuation Planning System.
Defines strict schemas for building graph components, agents, hazards,
routing requests/responses, and simulation state.
"""

from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, field_validator, model_validator


class NodeType(str, Enum):
    """Types of locations within the building graph."""
    ROOM = "room"
    LAB = "lab"
    OFFICE = "office"
    CORRIDOR = "corridor"
    STAIRS = "stairs"
    RAMP = "ramp"
    EXIT = "exit"
    ASSEMBLY_AREA = "assembly_area"


class HazardType(str, Enum):
    """Categorization of emergency hazards."""
    FIRE = "fire"
    SMOKE = "smoke"
    FLOOD = "flood"
    STRUCTURAL_BLOCKAGE = "structural_blockage"
    POWER_OUTAGE = "power_outage"


class AgentStatus(str, Enum):
    """Status lifecycle of an evacuation group/agent."""
    IDLE = "idle"
    EVACUATING = "evacuating"
    EVACUATED = "evacuated"
    TRAPPED = "trapped"
    REROUTING = "rerouting"


class AlgorithmType(str, Enum):
    """Supported route optimization algorithms."""
    BFS = "bfs"
    DIJKSTRA = "dijkstra"
    ASTAR = "astar"
    UTILITY = "utility"


class MobilityType(str, Enum):
    """Mobility and behavioral group profiles."""
    STANDARD = "standard"
    WHEELCHAIR = "wheelchair"
    VULNERABLE = "vulnerable"
    RAPID = "rapid"


class NodeModel(BaseModel):
    """Represents a physical location or waypoint in the building."""
    id: str = Field(..., description="Unique alphanumeric identifier for the node")
    name: str = Field(..., description="Human-readable descriptive location name")
    type: NodeType = Field(NodeType.CORRIDOR, description="Classification of the location")
    floor: int = Field(0, description="Floor level (0=Ground, 1=1st Floor, etc.)")
    x: float = Field(0.0, description="2D coordinate X for visualization/heuristics")
    y: float = Field(0.0, description="2D coordinate Y for visualization/heuristics")
    capacity: int = Field(50, gt=0, description="Maximum safe person capacity of this node")
    current_occupancy: int = Field(0, ge=0, description="Current number of occupants present")
    is_exit: bool = Field(False, description="Flag indicating if this node is an evacuation exit")
    is_blocked: bool = Field(False, description="Flag indicating if node is physically impassable")
    hazard_level: float = Field(0.0, ge=0.0, le=100.0, description="Hazard severity scale (0.0=Safe, 100.0=Lethal)")
    accessible: bool = Field(True, description="Wheelchair and mobility accessible waypoint")


class EdgeModel(BaseModel):
    """Represents a navigable path, corridor segment, or staircase between two nodes."""
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    distance: float = Field(..., gt=0.0, description="Physical path distance in meters")
    base_travel_time: float = Field(..., gt=0.0, description="Nominal walking travel time in seconds")
    capacity: int = Field(40, gt=0, description="Corridor max person throughput capacity")
    crowd_density: float = Field(0.0, ge=0.0, description="Normalized crowd density ratio [0.0 - 1.0+]")
    hazard_level: float = Field(0.0, ge=0.0, le=100.0, description="Hazard severity along the corridor (0-100)")
    is_blocked: bool = Field(False, description="Whether the edge is impassable")
    accessible: bool = Field(True, description="True if navigable without stairs (ramps/level ground)")
    width: float = Field(2.0, gt=0.0, description="Passageway width in meters")
    one_way: bool = Field(False, description="If True, only navigable from source to target")

    @field_validator("target")
    @classmethod
    def validate_endpoints(cls, target: str, info):
        if "source" in info.data and target == info.data["source"]:
            raise ValueError(f"Self-loop edge detected: source '{info.data['source']}' equals target '{target}'")
        return target


class BuildingGraphModel(BaseModel):
    """Complete building structure comprising nodes and connecting edges."""
    building_id: str
    name: str
    description: str
    floors: List[int] = Field(default_factory=lambda: [0, 1])
    nodes: List[NodeModel]
    edges: List[EdgeModel]

    @model_validator(mode="after")
    def validate_graph_integrity(self) -> "BuildingGraphModel":
        node_ids = set()
        for node in self.nodes:
            if node.id in node_ids:
                raise ValueError(f"Duplicate node ID detected: '{node.id}'")
            node_ids.add(node.id)

        # Ensure all edge endpoints reference existing nodes
        for idx, edge in enumerate(self.edges):
            if edge.source not in node_ids:
                raise ValueError(f"Edge {idx} references undefined source node '{edge.source}'")
            if edge.target not in node_ids:
                raise ValueError(f"Edge {idx} references undefined target node '{edge.target}'")

        # Ensure at least one exit exists in the graph
        exits = [n for n in self.nodes if n.is_exit]
        if not exits:
            raise ValueError("Building graph must contain at least one designated exit (is_exit=True)")

        return self


class HazardEvent(BaseModel):
    """Dynamic emergency event affecting nodes or edges."""
    hazard_id: str = Field(..., description="Unique ID for this hazard incident")
    hazard_type: HazardType = Field(..., description="Type of hazard (fire, smoke, flood, etc.)")
    location_type: str = Field("node", description="'node' or 'edge'")
    target_id: str = Field(..., description="Node ID or 'source-target' edge identifier")
    severity: float = Field(50.0, ge=0.0, le=100.0, description="Severity score 0 to 100")
    spread_rate: float = Field(5.0, ge=0.0, description="Severity spread increase per simulation step")
    spread_to_neighbors: bool = Field(True, description="Whether smoke/hazard spreads to adjacent nodes")
    is_passable: bool = Field(True, description="Whether persons can still traverse through with penalty")
    active: bool = Field(True, description="Whether hazard is actively present")
    description: Optional[str] = Field(None, description="Event description for incident logs")


class AgentWeights(BaseModel):
    """User-configurable safety and decision trade-off weights for utility agent."""
    w_time: float = Field(0.35, ge=0.0, le=1.0, description="Weight given to minimizing travel time")
    w_hazard: float = Field(0.40, ge=0.0, le=1.0, description="Weight given to avoiding hazards/smoke")
    w_congestion: float = Field(0.25, ge=0.0, le=1.0, description="Weight given to avoiding crowd congestion")
    max_hazard_threshold: float = Field(75.0, ge=0.0, le=100.0, description="Hazard level above which route is impassable")

    @model_validator(mode="after")
    def normalize_weights(self) -> "AgentWeights":
        total = self.w_time + self.w_hazard + self.w_congestion
        if total > 0 and abs(total - 1.0) > 1e-4:
            # Normalize to sum to 1.0 for consistent scoring
            self.w_time = round(self.w_time / total, 4)
            self.w_hazard = round(self.w_hazard / total, 4)
            self.w_congestion = round(self.w_congestion / total, 4)
        return self


class EvacuationAgentModel(BaseModel):
    """Represents an individual or group of occupants evacuating together."""
    agent_id: str
    name: str
    current_location: str
    destination_exit: Optional[str] = None
    group_size: int = Field(1, ge=1, description="Number of persons in this group")
    movement_speed: float = Field(1.2, gt=0.1, description="Walking speed in meters/second")
    requires_accessible_route: bool = Field(False, description="Requires step-free / ramp route")
    mobility_profile: MobilityType = Field(MobilityType.STANDARD)
    status: AgentStatus = Field(AgentStatus.IDLE)
    assigned_route: List[str] = Field(default_factory=list, description="Ordered list of node IDs")
    current_route_index: int = Field(0, ge=0, description="Index of current node along assigned_route")
    estimated_arrival_time: float = Field(0.0, ge=0.0)
    actual_evacuation_time: float = Field(0.0, ge=0.0)
    reroute_count: int = Field(0, ge=0)
    reroute_reasons: List[str] = Field(default_factory=list)


class RouteStepInstruction(BaseModel):
    """Human-readable navigation guidance step."""
    step_number: int
    instruction: str
    location_id: str
    location_name: str
    floor: int
    edge_distance: float = 0.0
    edge_time: float = 0.0
    hazard_warning: Optional[str] = None


class RouteRequest(BaseModel):
    """Request payload for route calculation."""
    start_node: str = Field(..., description="ID of starting location")
    algorithm: AlgorithmType = Field(AlgorithmType.UTILITY, description="Algorithm to use (bfs, dijkstra, astar, utility)")
    requires_accessible_route: bool = Field(False, description="Enforce step-free accessible path")
    weights: Optional[AgentWeights] = Field(None, description="Custom scoring weights (for utility agent)")
    speed: float = Field(1.2, gt=0.1, description="Walking speed in m/s")
    group_size: int = Field(1, ge=1, description="Size of evacuating group")


class RouteResponse(BaseModel):
    """Detailed response containing computed route, metrics, and navigation instructions."""
    algorithm: str
    found: bool
    start_node: str
    start_node_name: str
    selected_exit: Optional[str] = None
    selected_exit_name: Optional[str] = None
    path: List[str] = Field(default_factory=list)
    path_names: List[str] = Field(default_factory=list)
    total_edges: int = 0
    total_distance: float = 0.0
    estimated_travel_time: float = 0.0
    total_cost: float = 0.0
    average_hazard_level: float = 0.0
    max_hazard_level: float = 0.0
    nodes_expanded: int = 0
    execution_time_ms: float = 0.0
    instructions: List[RouteStepInstruction] = Field(default_factory=list)
    decision_reason: str = ""
    warnings: List[str] = Field(default_factory=list)


class AlgorithmComparisonItem(BaseModel):
    """Individual algorithm result summary for side-by-side comparison."""
    algorithm: str
    found: bool
    selected_exit: Optional[str] = None
    path: List[str] = Field(default_factory=list)
    total_edges: int = 0
    total_distance: float = 0.0
    estimated_travel_time: float = 0.0
    total_cost: float = 0.0
    nodes_expanded: int = 0
    execution_time_ms: float = 0.0
    objective_description: str


class AlgorithmComparisonResponse(BaseModel):
    """Comparative benchmarking results for BFS, Dijkstra, and A*."""
    start_node: str
    start_node_name: str
    requires_accessible_route: bool
    comparisons: Dict[str, AlgorithmComparisonItem]
    analysis: str


class SimulationStepRequest(BaseModel):
    """Request to step the multi-agent evacuation simulation."""
    steps: int = Field(1, ge=1, le=100, description="Number of simulation steps to advance")
    run_to_completion: bool = Field(False, description="If True, runs until all agents evacuate or are trapped")
    max_steps: int = Field(60, ge=1, le=300, description="Safety cutoff for complete runs")


class SimulationStateResponse(BaseModel):
    """Current snapshot of the simulation world."""
    scenario_name: str
    current_step: int
    elapsed_time_seconds: float
    is_completed: bool
    total_agents: int
    evacuated_count: int
    trapped_count: int
    active_count: int
    agents: List[EvacuationAgentModel]
    active_hazards: List[HazardEvent]
    recent_events: List[str] = Field(default_factory=list)


class CongestedEdgeInfo(BaseModel):
    """Information on corridor congestion bottlenecks."""
    edge: str
    source_name: str
    target_name: str
    density: float
    current_flow: int
    capacity: int


class EvacuationReportResponse(BaseModel):
    """Comprehensive post-simulation diagnostic and performance report."""
    scenario_name: str
    total_simulation_steps: int
    total_simulation_time_seconds: float
    total_agents: int
    total_people: int
    evacuated_agents: int
    evacuated_people: int
    trapped_agents: int
    trapped_people: int
    active_agents: int
    exit_usage_distribution: Dict[str, int]
    avg_evacuation_time_seconds: float
    max_evacuation_time_seconds: float
    min_evacuation_time_seconds: float
    congested_corridors: List[CongestedEdgeInfo]
    hazard_affected_locations: List[str]
    total_reroute_events: int
    agent_summaries: List[Dict[str, Any]]
    algorithm_benchmark: Optional[Dict[str, Any]] = None
    academic_disclaimer: str = (
        "ACADEMIC NOTICE: This is an educational AI research and simulation tool. "
        "It is NOT certified for life-critical building evacuation or regulatory fire safety compliance. "
        "Real-world emergencies must always adhere to designated civil defense authority protocols "
        "and officially certified building evacuation plans."
    )


class ScenarioModel(BaseModel):
    """Structured scenario definition for reproducible evaluation."""
    id: str
    name: str
    description: str
    initial_hazards: List[HazardEvent] = Field(default_factory=list)
    initial_agents: List[EvacuationAgentModel] = Field(default_factory=list)
    expected_outcome: str
