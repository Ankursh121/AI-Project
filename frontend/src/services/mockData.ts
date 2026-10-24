import { BuildingGraphModel, ScenarioModel, SimulationStateResponse, EvacuationReportResponse } from '../types';

export const MOCK_BUILDING: BuildingGraphModel = {
  building_id: "DIT_UNIVERSITY_CAMPUS",
  name: "DIT University Campus, Dehradun",
  description: "Simplified 3D digital twin and evacuation graph for DIT University featuring Vedanta Academic Block, Chanakya Administrative Block, and Sarojini Girls' Hostel.",
  floors: [0],
  nodes: [
    { id: "VEDANTA_HALL", name: "Vedanta Academic Hall & Computing Labs", type: "room", floor: 0, x: -16.0, y: -4.0, capacity: 80, current_occupancy: 45, is_exit: false, is_blocked: false, hazard_level: 0.0, accessible: true },
    { id: "VEDANTA_ENTRANCE", name: "Vedanta Building Main Entrance Portico", type: "corridor", floor: 0, x: -16.0, y: 4.0, capacity: 70, current_occupancy: 10, is_exit: false, is_blocked: false, hazard_level: 0.0, accessible: true },
    { id: "CHANAKYA_OFFICE", name: "Chanakya Administrative & Registrar Wing", type: "office", floor: 0, x: 0.0, y: -14.0, capacity: 50, current_occupancy: 20, is_exit: false, is_blocked: false, hazard_level: 0.0, accessible: true },
    { id: "CHANAKYA_ENTRANCE", name: "Chanakya Admin Block Grand Entrance", type: "corridor", floor: 0, x: 0.0, y: -7.0, capacity: 60, current_occupancy: 5, is_exit: false, is_blocked: false, hazard_level: 0.0, accessible: true },
    { id: "SAROJINI_COURTYARD", name: "Sarojini Hostel Residential Quad", type: "room", floor: 0, x: 16.0, y: 6.0, capacity: 75, current_occupancy: 35, is_exit: false, is_blocked: false, hazard_level: 0.0, accessible: true },
    { id: "SAROJINI_ENTRANCE", name: "Sarojini Girls' Hostel Security Gate", type: "corridor", floor: 0, x: 16.0, y: -2.0, capacity: 60, current_occupancy: 8, is_exit: false, is_blocked: false, hazard_level: 0.0, accessible: true },
    { id: "PATH_WEST_VEDANTA", name: "Vedanta Academic Walkway", type: "corridor", floor: 0, x: -9.0, y: 3.0, capacity: 65, current_occupancy: 5, is_exit: false, is_blocked: false, hazard_level: 0.0, accessible: true },
    { id: "PATH_NORTH_CHANAKYA", name: "Chanakya Administrative Walkway", type: "corridor", floor: 0, x: 0.0, y: -2.0, capacity: 65, current_occupancy: 4, is_exit: false, is_blocked: false, hazard_level: 0.0, accessible: true },
    { id: "PATH_EAST_SAROJINI", name: "Sarojini Hostel Walkway", type: "corridor", floor: 0, x: 9.0, y: 0.0, capacity: 65, current_occupancy: 6, is_exit: false, is_blocked: false, hazard_level: 0.0, accessible: true },
    { id: "CENTRAL_PLAZA", name: "Central Campus Hub & Pedestrian Plaza", type: "corridor", floor: 0, x: 0.0, y: 3.0, capacity: 90, current_occupancy: 12, is_exit: false, is_blocked: false, hazard_level: 0.0, accessible: true },
    { id: "CAMPUS_PERIMETER_PATH", name: "West Perimeter Evacuation Bypass Path", type: "corridor", floor: 0, x: -10.0, y: 14.0, capacity: 55, current_occupancy: 2, is_exit: false, is_blocked: false, hazard_level: 0.0, accessible: true },
    { id: "EXIT_MAIN_GATE", name: "DIT University South Main Gate", type: "exit", floor: 0, x: 0.0, y: 18.0, capacity: 150, current_occupancy: 0, is_exit: true, is_blocked: false, hazard_level: 0.0, accessible: true },
    { id: "EXIT_NORTH_GATE", name: "North Campus Emergency Exit Gate", type: "exit", floor: 0, x: -20.0, y: -14.0, capacity: 100, current_occupancy: 0, is_exit: true, is_blocked: false, hazard_level: 0.0, accessible: true },
    { id: "EXIT_EAST_GATE", name: "East Perimeter Hostel Exit Gate", type: "exit", floor: 0, x: 22.0, y: -10.0, capacity: 100, current_occupancy: 0, is_exit: true, is_blocked: false, hazard_level: 0.0, accessible: true },
    { id: "ASSEMBLY_MAIN_GROUND", name: "Central Sports Ground Assembly Area", type: "assembly_area", floor: 0, x: -5.0, y: 11.0, capacity: 450, current_occupancy: 0, is_exit: true, is_blocked: false, hazard_level: 0.0, accessible: true },
    { id: "ASSEMBLY_SPORTS_FIELD", name: "East Athletic Complex Assembly Area", type: "assembly_area", floor: 0, x: 13.0, y: 13.0, capacity: 350, current_occupancy: 0, is_exit: true, is_blocked: false, hazard_level: 0.0, accessible: true }
  ],
  edges: [
    { source: "VEDANTA_HALL", target: "VEDANTA_ENTRANCE", distance: 8.0, base_travel_time: 6.5, capacity: 60, crowd_density: 0.1, hazard_level: 0.0, is_blocked: false, accessible: true, width: 2.4, one_way: false },
    { source: "VEDANTA_ENTRANCE", target: "PATH_WEST_VEDANTA", distance: 7.0, base_travel_time: 5.8, capacity: 65, crowd_density: 0.08, hazard_level: 0.0, is_blocked: false, accessible: true, width: 2.6, one_way: false },
    { source: "VEDANTA_ENTRANCE", target: "EXIT_NORTH_GATE", distance: 18.0, base_travel_time: 15.0, capacity: 50, crowd_density: 0.02, hazard_level: 0.0, is_blocked: false, accessible: true, width: 2.2, one_way: false },
    { source: "CHANAKYA_OFFICE", target: "CHANAKYA_ENTRANCE", distance: 7.0, base_travel_time: 5.8, capacity: 50, crowd_density: 0.08, hazard_level: 0.0, is_blocked: false, accessible: true, width: 2.2, one_way: false },
    { source: "CHANAKYA_ENTRANCE", target: "PATH_NORTH_CHANAKYA", distance: 5.0, base_travel_time: 4.2, capacity: 60, crowd_density: 0.05, hazard_level: 0.0, is_blocked: false, accessible: true, width: 2.5, one_way: false },
    { source: "CHANAKYA_ENTRANCE", target: "EXIT_NORTH_GATE", distance: 21.0, base_travel_time: 17.5, capacity: 45, crowd_density: 0.02, hazard_level: 0.0, is_blocked: false, accessible: true, width: 2.0, one_way: false },
    { source: "SAROJINI_COURTYARD", target: "SAROJINI_ENTRANCE", distance: 8.0, base_travel_time: 6.5, capacity: 60, crowd_density: 0.1, hazard_level: 0.0, is_blocked: false, accessible: true, width: 2.4, one_way: false },
    { source: "SAROJINI_ENTRANCE", target: "PATH_EAST_SAROJINI", distance: 7.0, base_travel_time: 5.8, capacity: 65, crowd_density: 0.08, hazard_level: 0.0, is_blocked: false, accessible: true, width: 2.6, one_way: false },
    { source: "SAROJINI_ENTRANCE", target: "EXIT_EAST_GATE", distance: 10.0, base_travel_time: 8.3, capacity: 55, crowd_density: 0.03, hazard_level: 0.0, is_blocked: false, accessible: true, width: 2.5, one_way: false },
    { source: "PATH_WEST_VEDANTA", target: "CENTRAL_PLAZA", distance: 9.0, base_travel_time: 7.5, capacity: 70, crowd_density: 0.12, hazard_level: 0.0, is_blocked: false, accessible: true, width: 2.8, one_way: false },
    { source: "PATH_NORTH_CHANAKYA", target: "CENTRAL_PLAZA", distance: 5.0, base_travel_time: 4.2, capacity: 70, crowd_density: 0.1, hazard_level: 0.0, is_blocked: false, accessible: true, width: 2.8, one_way: false },
    { source: "PATH_EAST_SAROJINI", target: "CENTRAL_PLAZA", distance: 9.0, base_travel_time: 7.5, capacity: 70, crowd_density: 0.12, hazard_level: 0.0, is_blocked: false, accessible: true, width: 2.8, one_way: false },
    { source: "CENTRAL_PLAZA", target: "EXIT_MAIN_GATE", distance: 15.0, base_travel_time: 12.5, capacity: 85, crowd_density: 0.08, hazard_level: 0.0, is_blocked: false, accessible: true, width: 3.2, one_way: false },
    { source: "CENTRAL_PLAZA", target: "ASSEMBLY_MAIN_GROUND", distance: 9.0, base_travel_time: 7.5, capacity: 90, crowd_density: 0.05, hazard_level: 0.0, is_blocked: false, accessible: true, width: 3.5, one_way: false },
    { source: "PATH_WEST_VEDANTA", target: "CAMPUS_PERIMETER_PATH", distance: 11.0, base_travel_time: 9.2, capacity: 50, crowd_density: 0.05, hazard_level: 0.0, is_blocked: false, accessible: true, width: 2.2, one_way: false },
    { source: "CAMPUS_PERIMETER_PATH", target: "ASSEMBLY_MAIN_GROUND", distance: 6.0, base_travel_time: 5.0, capacity: 65, crowd_density: 0.05, hazard_level: 0.0, is_blocked: false, accessible: true, width: 2.8, one_way: false },
    { source: "ASSEMBLY_MAIN_GROUND", target: "EXIT_MAIN_GATE", distance: 9.0, base_travel_time: 7.5, capacity: 95, crowd_density: 0.05, hazard_level: 0.0, is_blocked: false, accessible: true, width: 3.5, one_way: false },
    { source: "PATH_EAST_SAROJINI", target: "ASSEMBLY_SPORTS_FIELD", distance: 13.0, base_travel_time: 10.8, capacity: 65, crowd_density: 0.05, hazard_level: 0.0, is_blocked: false, accessible: true, width: 2.8, one_way: false },
    { source: "ASSEMBLY_SPORTS_FIELD", target: "EXIT_MAIN_GATE", distance: 14.0, base_travel_time: 11.5, capacity: 80, crowd_density: 0.04, hazard_level: 0.0, is_blocked: false, accessible: true, width: 3.0, one_way: false }
  ]
};

export const MOCK_SCENARIOS: ScenarioModel[] = [
  {
    id: "scenario_normal",
    name: "Normal Campus",
    description: "Baseline operational status. All campus pathways, gates, and assembly areas are fully clear and operational.",
    initial_hazards: [],
    initial_agents: [
      { agent_id: "group_vedanta", name: "Vedanta Computing Students", current_location: "VEDANTA_ENTRANCE", destination_exit: "EXIT_MAIN_GATE", group_size: 45, movement_speed: 1.2, requires_accessible_route: false, mobility_profile: "standard", status: "idle", assigned_route: ["VEDANTA_ENTRANCE", "PATH_WEST_VEDANTA", "CENTRAL_PLAZA", "EXIT_MAIN_GATE"], current_route_index: 0, estimated_arrival_time: 25.8, actual_evacuation_time: 0, reroute_count: 0, reroute_reasons: [] },
      { agent_id: "group_chanakya", name: "Chanakya Admin Staff", current_location: "CHANAKYA_ENTRANCE", destination_exit: "EXIT_MAIN_GATE", group_size: 20, movement_speed: 1.1, requires_accessible_route: false, mobility_profile: "standard", status: "idle", assigned_route: ["CHANAKYA_ENTRANCE", "PATH_NORTH_CHANAKYA", "CENTRAL_PLAZA", "EXIT_MAIN_GATE"], current_route_index: 0, estimated_arrival_time: 20.9, actual_evacuation_time: 0, reroute_count: 0, reroute_reasons: [] },
      { agent_id: "group_sarojini", name: "Sarojini Hostel Residents", current_location: "SAROJINI_ENTRANCE", destination_exit: "EXIT_MAIN_GATE", group_size: 35, movement_speed: 1.2, requires_accessible_route: false, mobility_profile: "standard", status: "idle", assigned_route: ["SAROJINI_ENTRANCE", "PATH_EAST_SAROJINI", "CENTRAL_PLAZA", "EXIT_MAIN_GATE"], current_route_index: 0, estimated_arrival_time: 25.8, actual_evacuation_time: 0, reroute_count: 0, reroute_reasons: [] }
    ],
    expected_outcome: "Evacuees from all three buildings reach the South Main Gate and Central Assembly Grounds with minimal travel time."
  },
  {
    id: "scenario_fire_vedanta",
    name: "Fire Near Vedanta",
    description: "A fire hazard breaks out along the Vedanta Academic Walkway with heavy smoke. The primary walkway to Central Plaza is impassable, prompting agents to reroute to the North Emergency Gate.",
    initial_hazards: [
      { hazard_id: "hazard_fire_vedanta", hazard_type: "fire", location_type: "node", target_id: "PATH_WEST_VEDANTA", severity: 85.0, spread_rate: 0.15, spread_to_neighbors: true, is_passable: false, active: true, description: "Intense electrical fire on Vedanta walkway with dense smoke dispersion." }
    ],
    initial_agents: [
      { agent_id: "group_vedanta", name: "Vedanta Computing Students", current_location: "VEDANTA_ENTRANCE", destination_exit: "EXIT_NORTH_GATE", group_size: 45, movement_speed: 1.2, requires_accessible_route: false, mobility_profile: "standard", status: "idle", assigned_route: ["VEDANTA_ENTRANCE", "EXIT_NORTH_GATE"], current_route_index: 0, estimated_arrival_time: 15.0, actual_evacuation_time: 0, reroute_count: 0, reroute_reasons: [] }
    ],
    expected_outcome: "Vedanta evacuees successfully reroute away from the hazardous walkway toward the North Emergency Gate."
  },
  {
    id: "scenario_blocked_path",
    name: "Blocked Campus Path",
    description: "Debris and construction block the Central Campus Plaza, cutting off direct access between buildings and forcing agents onto perimeter bypass walkways.",
    initial_hazards: [
      { hazard_id: "hazard_block_plaza", hazard_type: "structural_blockage", location_type: "node", target_id: "CENTRAL_PLAZA", severity: 95.0, spread_rate: 0.0, spread_to_neighbors: false, is_passable: false, active: true, description: "Fallen trees and structural barrier blocking the Central Plaza junction." }
    ],
    initial_agents: [
      { agent_id: "group_vedanta", name: "Vedanta Computing Students", current_location: "VEDANTA_ENTRANCE", destination_exit: "ASSEMBLY_MAIN_GROUND", group_size: 45, movement_speed: 1.2, requires_accessible_route: false, mobility_profile: "standard", status: "idle", assigned_route: ["VEDANTA_ENTRANCE", "PATH_WEST_VEDANTA", "CAMPUS_PERIMETER_PATH", "ASSEMBLY_MAIN_GROUND"], current_route_index: 0, estimated_arrival_time: 20.0, actual_evacuation_time: 0, reroute_count: 0, reroute_reasons: [] }
    ],
    expected_outcome: "Agents successfully navigate around the blocked central hub using the West Perimeter Bypass and East Athletic paths."
  },
  {
    id: "scenario_exit_unavailable",
    name: "Exit Unavailable",
    description: "The South Main Gate is locked or compromised. Evacuees must dynamically re-route to alternative campus exits and designated assembly grounds.",
    initial_hazards: [
      { hazard_id: "hazard_gate_closed", hazard_type: "structural_blockage", location_type: "node", target_id: "EXIT_MAIN_GATE", severity: 100.0, spread_rate: 0.0, spread_to_neighbors: false, is_passable: false, active: true, description: "Main University South Gate compromised and impassable." }
    ],
    initial_agents: [
      { agent_id: "group_chanakya", name: "Chanakya Admin Staff", current_location: "CHANAKYA_ENTRANCE", destination_exit: "ASSEMBLY_MAIN_GROUND", group_size: 25, movement_speed: 1.1, requires_accessible_route: false, mobility_profile: "standard", status: "idle", assigned_route: ["CHANAKYA_ENTRANCE", "PATH_NORTH_CHANAKYA", "CENTRAL_PLAZA", "ASSEMBLY_MAIN_GROUND"], current_route_index: 0, estimated_arrival_time: 16.7, actual_evacuation_time: 0, reroute_count: 0, reroute_reasons: [] }
    ],
    expected_outcome: "Evacuees intelligently redirect to the Central Assembly Grounds and East Perimeter Exit Gate."
  }
];

export const MOCK_SIMULATION_STATE: SimulationStateResponse = {
  scenario_name: "Normal Campus",
  current_step: 0,
  elapsed_time_seconds: 0.0,
  is_completed: false,
  total_agents: 3,
  evacuated_count: 0,
  trapped_count: 0,
  active_count: 3,
  agents: MOCK_SCENARIOS[0].initial_agents,
  active_hazards: [],
  recent_events: ["Campus digital twin loaded. Monitoring Vedanta, Chanakya, and Sarojini evacuation paths."]
};

export const MOCK_REPORT: EvacuationReportResponse = {
  scenario_name: "Normal Campus",
  total_simulation_steps: 12,
  total_simulation_time_seconds: 60.0,
  total_agents: 3,
  total_people: 100,
  evacuated_agents: 3,
  evacuated_people: 100,
  trapped_agents: 0,
  trapped_people: 0,
  active_agents: 0,
  exit_usage_distribution: {
    "EXIT_MAIN_GATE": 65,
    "ASSEMBLY_MAIN_GROUND": 35
  },
  avg_evacuation_time_seconds: 24.5,
  max_evacuation_time_seconds: 32.0,
  min_evacuation_time_seconds: 16.0,
  congested_corridors: [],
  hazard_affected_locations: [],
  total_reroute_events: 0,
  agent_summaries: [],
  academic_disclaimer: "ACADEMIC NOTICE: This is an educational AI research and simulation tool developed for DIT University academic demonstration."
};
