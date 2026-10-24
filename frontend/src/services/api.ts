import {
  BuildingGraphModel,
  ScenarioModel,
  RouteRequest,
  RouteResponse,
  AlgorithmComparisonResponse,
  SimulationStepRequest,
  SimulationStateResponse,
  HazardEvent,
  EvacuationReportResponse,
} from '../types';
import { MOCK_BUILDING, MOCK_SCENARIOS, MOCK_SIMULATION_STATE, MOCK_REPORT } from './mockData';

// Configurable base URL with safe fallback for both local development and production deployments
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? ''
    : 'http://127.0.0.1:8000');

class ApiService {
  private isOnline = false;
  private hasChecked = false;

  public async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
      clearTimeout(id);
      this.isOnline = res.ok;
      this.hasChecked = true;
      return this.isOnline;
    } catch {
      this.isOnline = false;
      this.hasChecked = true;
      return false;
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public async getBuilding(): Promise<BuildingGraphModel> {
    try {
      const res = await fetch(`${API_BASE}/building`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.isOnline = true;
      return data;
    } catch (err) {
      console.warn('[API] Backend unreachable for /building. Using mock building layout.', err);
      this.isOnline = false;
      return MOCK_BUILDING;
    }
  }

  public async getScenarios(): Promise<ScenarioModel[]> {
    try {
      const res = await fetch(`${API_BASE}/scenarios`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.isOnline = true;
      return data;
    } catch (err) {
      console.warn('[API] Using mock scenarios catalog.', err);
      this.isOnline = false;
      return MOCK_SCENARIOS;
    }
  }

  public async calculateRoute(request: RouteRequest): Promise<RouteResponse> {
    try {
      const res = await fetch(`${API_BASE}/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn('[API] Using fallback route generator for offline demo.', err);
      // Generate synthetic fallback route for demo resilience
      return this.generateMockRoute(request);
    }
  }

  public async compareAlgorithms(
    startNode: string,
    requiresAccessible: boolean = false,
    speed: number = 1.2
  ): Promise<AlgorithmComparisonResponse> {
    try {
      const res = await fetch(`${API_BASE}/compare-algorithms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_node: startNode,
          requires_accessible_route: requiresAccessible,
          speed,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[API] Using mock algorithm comparison.', err);
      return {
        start_node: startNode,
        start_node_name: startNode,
        requires_accessible_route: requiresAccessible,
        comparisons: {
          BFS: {
            algorithm: 'BFS',
            found: true,
            selected_exit: 'EXIT_WEST',
            path: [startNode, 'CORRIDOR_G_WEST', 'EXIT_WEST'],
            total_edges: 2,
            total_distance: 18.0,
            estimated_travel_time: 15.0,
            total_cost: 21.0,
            nodes_expanded: 6,
            execution_time_ms: 0.35,
            objective_description: 'Minimizes number of edge hops, ignoring physical distance.',
          },
          Dijkstra: {
            algorithm: 'Dijkstra',
            found: true,
            selected_exit: 'EXIT_WEST',
            path: [startNode, 'CORRIDOR_G_WEST', 'EXIT_WEST'],
            total_edges: 2,
            total_distance: 18.0,
            estimated_travel_time: 15.0,
            total_cost: 15.0,
            nodes_expanded: 5,
            execution_time_ms: 0.42,
            objective_description: 'Guarantees minimal weighted cost by expanding in cost order.',
          },
          'A*': {
            algorithm: 'A*',
            found: true,
            selected_exit: 'EXIT_WEST',
            path: [startNode, 'CORRIDOR_G_WEST', 'EXIT_WEST'],
            total_edges: 2,
            total_distance: 18.0,
            estimated_travel_time: 15.0,
            total_cost: 15.0,
            nodes_expanded: 3,
            execution_time_ms: 0.31,
            objective_description: 'Guarantees optimal travel cost while pruning search with Euclidean heuristic.',
          },
        },
        analysis: `Comparison from ${startNode}: A* expanded 3 nodes compared to Dijkstra's 5 while achieving identical optimal cost.`,
      };
    }
  }

  public async advanceSimulation(request: SimulationStepRequest): Promise<SimulationStateResponse> {
    try {
      const res = await fetch(`${API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[API] Using mock simulation step.', err);
      return MOCK_SIMULATION_STATE;
    }
  }

  public async getSimulationState(): Promise<SimulationStateResponse> {
    try {
      const res = await fetch(`${API_BASE}/simulation/state`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return MOCK_SIMULATION_STATE;
    }
  }

  public async injectHazard(hazard: HazardEvent): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/hazards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hazard),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[API] Injected hazard in mock mode.', err);
      return { status: 'mock_applied', hazard_id: hazard.hazard_id };
    }
  }

  public async resetSimulation(scenarioId?: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId || 'scenario_a_normal' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[API] Reset in mock mode.', err);
      return { status: 'mock_reset', scenario: scenarioId };
    }
  }

  public async getReport(): Promise<EvacuationReportResponse> {
    try {
      const res = await fetch(`${API_BASE}/report`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return MOCK_REPORT;
    }
  }

  private generateMockRoute(req: RouteRequest): RouteResponse {
    const isWheelchair = req.requires_accessible_route;
    const isFloor1 = req.start_node.includes('201') || req.start_node.includes('202') || req.start_node.includes('NET');
    
    let path = ['ROOM_101', 'CORRIDOR_G_WEST', 'EXIT_WEST'];
    let exit = 'EXIT_WEST';
    let dist = 18.0;
    let time = 15.0;

    if (isFloor1 && isWheelchair) {
      path = [req.start_node, 'CORRIDOR_1_EAST', 'RAMP_EAST', 'ASSEMBLY_EAST'];
      exit = 'ASSEMBLY_EAST';
      dist = 40.0;
      time = 45.0;
    } else if (isFloor1) {
      path = [req.start_node, 'CORRIDOR_1_WEST', 'STAIRS_WEST', 'CORRIDOR_G_WEST', 'EXIT_WEST'];
      exit = 'EXIT_WEST';
      dist = 38.0;
      time = 31.7;
    }

    return {
      algorithm: req.algorithm.toUpperCase(),
      found: true,
      start_node: req.start_node,
      start_node_name: req.start_node,
      selected_exit: exit,
      selected_exit_name: exit,
      path,
      path_names: path,
      total_edges: path.length - 1,
      total_distance: dist,
      estimated_travel_time: time,
      total_cost: dist,
      average_hazard_level: 0,
      max_hazard_level: 0,
      nodes_expanded: 5,
      execution_time_ms: 1.2,
      instructions: path.map((node, i) => ({
        step_number: i + 1,
        instruction: i === 0 ? `Evacuate from ${node}` : i === path.length - 1 ? `Arrive safely at ${node}` : `Proceed along ${node}`,
        location_id: node,
        location_name: node,
        floor: isFloor1 ? 1 : 0,
        edge_distance: 10.0,
        edge_time: 8.0,
      })),
      decision_reason: isWheelchair
        ? "Selected accessible ramp route to Assembly East, strictly avoiding stairwells."
        : "Selected optimal route minimizing travel time and avoiding active hazards.",
      warnings: [],
    };
  }
}

export const api = new ApiService();
