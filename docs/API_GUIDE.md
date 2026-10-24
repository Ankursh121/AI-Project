# REST API Specification & Integration Guide

**Project:** Emergency Evacuation Planning System  
**Base URL:** `http://localhost:8000`  
**Interactive Swagger UI:** `http://localhost:8000/docs`  
**Interactive ReDoc:** `http://localhost:8000/redoc`

---

## 1. System Endpoints

### 1.1 `GET /`
**Purpose:** Root metadata endpoint providing service status, version, and academic disclaimer.

#### Response Example (`200 OK`)
```json
{
  "service": "Emergency Evacuation Planning & Intelligent Route Optimization System",
  "version": "1.0.0",
  "status": "online",
  "docs_url": "/docs",
  "redoc_url": "/redoc",
  "endpoints": {
    "health": "/health",
    "building": "/building",
    "scenarios": "/scenarios",
    "calculate_route": "POST /route",
    "compare_algorithms": "POST /compare-algorithms",
    "simulate": "POST /simulate",
    "simulation_state": "/simulation/state",
    "inject_hazards": "POST /hazards",
    "reset": "POST /reset",
    "report": "/report"
  },
  "disclaimer": "ACADEMIC NOTICE: This is an educational AI research and simulation tool..."
}
```

---

### 1.2 `GET /health`
**Purpose:** System health check and graph load status.

#### Response Example (`200 OK`)
```json
{
  "status": "healthy",
  "service": "Emergency Evacuation Planning & Simulation System",
  "nodes_loaded": 19,
  "edges_loaded": 20,
  "active_scenario": "Scenario A: Normal Evacuation"
}
```

---

### 1.3 `GET /building`
**Purpose:** Retrieves the full building structural graph (nodes, coordinates, corridors, capacities, and initial hazards).

#### Response Example (`200 OK`)
```json
{
  "building_id": "APJ_ENGG_BLOCK",
  "name": "Dr. A.P.J. Abdul Kalam Science & Technology Block",
  "description": "Synthetic multi-floor academic engineering building graph...",
  "floors": [0, 1],
  "nodes": [
    {
      "id": "ROOM_101",
      "name": "Classroom 101 (Mechanics)",
      "type": "room",
      "floor": 0,
      "x": 5.0,
      "y": 10.0,
      "capacity": 50,
      "current_occupancy": 35,
      "is_exit": false,
      "is_blocked": false,
      "hazard_level": 0.0,
      "accessible": true
    }
  ],
  "edges": [
    {
      "source": "ROOM_101",
      "target": "CORRIDOR_G_WEST",
      "distance": 8.0,
      "base_travel_time": 6.7,
      "capacity": 40,
      "crowd_density": 0.1,
      "hazard_level": 0.0,
      "is_blocked": false,
      "accessible": true,
      "width": 2.2,
      "one_way": false
    }
  ]
}
```

---

### 1.4 `GET /scenarios`
**Purpose:** Enumerates all preconfigured demonstration scenarios (A through F).

---

## 2. Route Optimization Endpoints

### 2.1 `POST /route`
**Purpose:** Computes an optimal evacuation route for a group starting at a specified location.

#### Request Body
```json
{
  "start_node": "ROOM_101",
  "algorithm": "utility",
  "requires_accessible_route": false,
  "speed": 1.2,
  "group_size": 25,
  "weights": {
    "w_time": 0.35,
    "w_hazard": 0.40,
    "w_congestion": 0.25,
    "max_hazard_threshold": 75.0
  }
}
```

#### Response Example (`200 OK`)
```json
{
  "algorithm": "UtilityAgent",
  "found": true,
  "start_node": "ROOM_101",
  "start_node_name": "Classroom 101 (Mechanics)",
  "selected_exit": "EXIT_WEST",
  "selected_exit_name": "West Ground Emergency Exit",
  "path": [
    "ROOM_101",
    "CORRIDOR_G_WEST",
    "EXIT_WEST"
  ],
  "path_names": [
    "Classroom 101 (Mechanics)",
    "Ground Floor West Corridor",
    "West Ground Emergency Exit"
  ],
  "total_edges": 2,
  "total_distance": 18.0,
  "estimated_travel_time": 15.0,
  "total_cost": 21.4,
  "average_hazard_level": 0.0,
  "max_hazard_level": 0.0,
  "nodes_expanded": 15,
  "execution_time_ms": 1.85,
  "instructions": [
    {
      "step_number": 1,
      "instruction": "Evacuate immediately from Classroom 101 (Mechanics) (Floor 0).",
      "location_id": "ROOM_101",
      "location_name": "Classroom 101 (Mechanics)",
      "floor": 0,
      "edge_distance": 0.0,
      "edge_time": 0.0,
      "hazard_warning": null
    },
    {
      "step_number": 2,
      "instruction": "Proceed along Ground Floor West Corridor (Distance: 8.0m, ~6.7s).",
      "location_id": "CORRIDOR_G_WEST",
      "location_name": "Ground Floor West Corridor",
      "floor": 0,
      "edge_distance": 8.0,
      "edge_time": 6.7,
      "hazard_warning": null
    },
    {
      "step_number": 3,
      "instruction": "Exit building through West Ground Emergency Exit. Proceed immediately to open assembly grounds.",
      "location_id": "EXIT_WEST",
      "location_name": "West Ground Emergency Exit",
      "floor": 0,
      "edge_distance": 10.0,
      "edge_time": 8.3,
      "hazard_warning": null
    }
  ],
  "decision_reason": "Selected route via 'EXIT_WEST' is both the quickest (15.0s) and possesses acceptable hazard and congestion levels.",
  "warnings": []
}
```

---

### 2.2 `POST /compare-algorithms`
**Purpose:** Runs BFS, Dijkstra, and A\* side by side on identical starting conditions and provides comparative metrics.

#### Request Body
```json
{
  "start_node": "ROOM_201",
  "requires_accessible_route": false,
  "speed": 1.2
}
```

#### Response Example (`200 OK`)
```json
{
  "start_node": "ROOM_201",
  "start_node_name": "Seminar Hall 201",
  "requires_accessible_route": false,
  "comparisons": {
    "BFS": {
      "algorithm": "BFS",
      "found": true,
      "selected_exit": "EXIT_WEST",
      "path": ["ROOM_201", "CORRIDOR_1_WEST", "STAIRS_WEST", "CORRIDOR_G_WEST", "EXIT_WEST"],
      "total_edges": 4,
      "total_distance": 38.0,
      "estimated_travel_time": 31.7,
      "total_cost": 42.1,
      "nodes_expanded": 14,
      "execution_time_ms": 0.42,
      "objective_description": "Minimizes number of edge hops (connections), ignoring physical length and hazards."
    },
    "Dijkstra": {
      "algorithm": "Dijkstra",
      "found": true,
      "selected_exit": "EXIT_WEST",
      "path": ["ROOM_201", "CORRIDOR_1_WEST", "STAIRS_WEST", "CORRIDOR_G_WEST", "EXIT_WEST"],
      "total_edges": 4,
      "total_distance": 38.0,
      "estimated_travel_time": 31.7,
      "total_cost": 31.7,
      "nodes_expanded": 12,
      "execution_time_ms": 0.58,
      "objective_description": "Guarantees optimal cumulative travel time by systematically expanding nodes in cost order."
    },
    "A*": {
      "algorithm": "A*",
      "found": true,
      "selected_exit": "EXIT_WEST",
      "path": ["ROOM_201", "CORRIDOR_1_WEST", "STAIRS_WEST", "CORRIDOR_G_WEST", "EXIT_WEST"],
      "total_edges": 4,
      "total_distance": 38.0,
      "estimated_travel_time": 31.7,
      "total_cost": 31.7,
      "nodes_expanded": 8,
      "execution_time_ms": 0.45,
      "objective_description": "Guarantees optimal cumulative travel time while pruning search using an admissible Euclidean heuristic."
    }
  },
  "analysis": "Comparison from starting location 'Seminar Hall 201': 1. BFS selected path with 4 edge hops (Nodes expanded: 14). 2. Dijkstra identified an optimal path with travel time 31.7s (Nodes expanded: 12). 3. A* achieved the exact same optimal travel time 31.7s while expanding 8 nodes. Observation: A*'s Euclidean distance heuristic allowed it to prune the search space, expanding 4 fewer nodes than uninformed Dijkstra."
}
```

---

## 3. Simulation & Dynamics Endpoints

### 3.1 `POST /simulate`
**Purpose:** Advances the multi-agent evacuation simulation forward by a given step count or runs to completion.

#### Request Body
```json
{
  "steps": 5,
  "run_to_completion": false,
  "max_steps": 60
}
```

---

### 3.2 `GET /simulation/state`
**Purpose:** Returns the current state of all evacuation agents, active hazards, and bottlenecks.

---

### 3.3 `POST /hazards`
**Purpose:** Injects a dynamic hazard into an active simulation, triggering instant agent rerouting.

#### Request Body
```json
{
  "hazard_id": "fire_central_block",
  "hazard_type": "fire",
  "location_type": "node",
  "target_id": "CORRIDOR_G_CENTRAL",
  "severity": 85.0,
  "spread_rate": 5.0,
  "spread_to_neighbors": true,
  "is_passable": false,
  "active": true,
  "description": "Explosive fire event in central corridor"
}
```

---

### 3.4 `POST /reset`
**Purpose:** Resets building and agents to the clean initial state of any chosen scenario.

#### Request Body
```json
{
  "scenario_id": "scenario_b_fire"
}
```

---

### 3.5 `GET /report`
**Purpose:** Generates comprehensive post-simulation diagnostic metrics, exit distribution counts, and academic disclaimer.

#### Response Example (`200 OK`)
```json
{
  "scenario_name": "Scenario A: Normal Evacuation",
  "total_simulation_steps": 14,
  "total_simulation_time_seconds": 70.0,
  "total_agents": 4,
  "total_people": 112,
  "evacuated_agents": 4,
  "evacuated_people": 112,
  "trapped_agents": 0,
  "trapped_people": 0,
  "active_agents": 0,
  "exit_usage_distribution": {
    "EXIT_WEST": 75,
    "EXIT_EAST": 37
  },
  "avg_evacuation_time_seconds": 38.5,
  "max_evacuation_time_seconds": 55.0,
  "min_evacuation_time_seconds": 22.0,
  "congested_corridors": [],
  "hazard_affected_locations": [],
  "total_reroute_events": 0,
  "academic_disclaimer": "ACADEMIC NOTICE: This is an educational AI research and simulation tool..."
}
```
