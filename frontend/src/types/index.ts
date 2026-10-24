/**
 * TypeScript Data Models matching FastAPI Pydantic schemas and UI states.
 */

export type NodeType = 'room' | 'lab' | 'office' | 'corridor' | 'stairs' | 'ramp' | 'exit' | 'assembly_area';
export type HazardType = 'fire' | 'smoke' | 'flood' | 'structural_blockage' | 'power_outage';
export type AgentStatus = 'idle' | 'evacuating' | 'evacuated' | 'trapped' | 'rerouting';
export type AlgorithmType = 'bfs' | 'dijkstra' | 'astar' | 'utility';
export type MobilityType = 'standard' | 'wheelchair' | 'vulnerable' | 'rapid';

export interface NodeModel {
  id: string;
  name: string;
  type: NodeType;
  floor: number;
  x: number;
  y: number;
  capacity: number;
  current_occupancy: number;
  is_exit: boolean;
  is_blocked: boolean;
  hazard_level: number;
  accessible: boolean;
}

export interface EdgeModel {
  source: string;
  target: string;
  distance: number;
  base_travel_time: number;
  capacity: number;
  crowd_density: number;
  hazard_level: number;
  is_blocked: boolean;
  accessible: boolean;
  width: number;
  one_way: boolean;
}

export interface BuildingGraphModel {
  building_id: string;
  name: string;
  description: string;
  floors: number[];
  nodes: NodeModel[];
  edges: EdgeModel[];
}

export interface HazardEvent {
  hazard_id: string;
  hazard_type: HazardType;
  location_type: 'node' | 'edge';
  target_id: string;
  severity: number;
  spread_rate: number;
  spread_to_neighbors: boolean;
  is_passable: boolean;
  active: boolean;
  description?: string;
}

export interface AgentWeights {
  w_time: number;
  w_hazard: number;
  w_congestion: number;
  max_hazard_threshold: number;
}

export interface EvacuationAgentModel {
  agent_id: string;
  name: string;
  current_location: string;
  destination_exit: string | null;
  group_size: number;
  movement_speed: number;
  requires_accessible_route: boolean;
  mobility_profile: MobilityType;
  status: AgentStatus;
  assigned_route: string[];
  current_route_index: number;
  estimated_arrival_time: number;
  actual_evacuation_time: number;
  reroute_count: number;
  reroute_reasons: string[];
}

export interface RouteStepInstruction {
  step_number: number;
  instruction: string;
  location_id: string;
  location_name: string;
  floor: number;
  edge_distance: number;
  edge_time: number;
  hazard_warning?: string | null;
}

export interface RouteRequest {
  start_node: string;
  algorithm: AlgorithmType;
  requires_accessible_route?: boolean;
  weights?: AgentWeights;
  speed?: number;
  group_size?: number;
}

export interface RouteResponse {
  algorithm: string;
  found: boolean;
  start_node: string;
  start_node_name: string;
  selected_exit: string | null;
  selected_exit_name: string | null;
  path: string[];
  path_names: string[];
  total_edges: number;
  total_distance: number;
  estimated_travel_time: number;
  total_cost: number;
  average_hazard_level: number;
  max_hazard_level: number;
  nodes_expanded: number;
  execution_time_ms: number;
  instructions: RouteStepInstruction[];
  decision_reason: string;
  warnings: string[];
}

export interface AlgorithmComparisonItem {
  algorithm: string;
  found: boolean;
  selected_exit: string | null;
  path: string[];
  total_edges: number;
  total_distance: number;
  estimated_travel_time: number;
  total_cost: number;
  nodes_expanded: number;
  execution_time_ms: number;
  objective_description: string;
}

export interface AlgorithmComparisonResponse {
  start_node: string;
  start_node_name: string;
  requires_accessible_route: boolean;
  comparisons: Record<string, AlgorithmComparisonItem>;
  analysis: string;
}

export interface SimulationStepRequest {
  steps: number;
  run_to_completion?: boolean;
  max_steps?: number;
}

export interface SimulationStateResponse {
  scenario_name: string;
  current_step: number;
  elapsed_time_seconds: number;
  is_completed: boolean;
  total_agents: number;
  evacuated_count: number;
  trapped_count: number;
  active_count: number;
  agents: EvacuationAgentModel[];
  active_hazards: HazardEvent[];
  recent_events: string[];
}

export interface CongestedEdgeInfo {
  edge: string;
  source_name: string;
  target_name: string;
  density: number;
  current_flow: number;
  capacity: number;
}

export interface EvacuationReportResponse {
  scenario_name: string;
  total_simulation_steps: number;
  total_simulation_time_seconds: number;
  total_agents: number;
  total_people: number;
  evacuated_agents: number;
  evacuated_people: number;
  trapped_agents: number;
  trapped_people: number;
  active_agents: number;
  exit_usage_distribution: Record<string, number>;
  avg_evacuation_time_seconds: number;
  max_evacuation_time_seconds: number;
  min_evacuation_time_seconds: number;
  congested_corridors: CongestedEdgeInfo[];
  hazard_affected_locations: string[];
  total_reroute_events: number;
  agent_summaries: Record<string, any>[];
  algorithm_benchmark?: Record<string, any>;
  academic_disclaimer: string;
}

export interface ScenarioModel {
  id: string;
  name: string;
  description: string;
  initial_hazards: HazardEvent[];
  initial_agents: EvacuationAgentModel[];
  expected_outcome: string;
}

export type ViewMode = 'overview' | 'building' | 'routing' | 'simulation' | 'algorithms' | 'reports';

export type CameraPreset = 'isometric' | 'top' | 'front';

export interface OverlayToggles {
  hazards: boolean;
  crowd: boolean;
  routes: boolean;
  labels: boolean;
  grid: boolean;
}
