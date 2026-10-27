# 🧠 Main Logic — Emergency Evacuation Algorithms & Simulation Engine

This folder contains all core **Backend Logic, Routing Algorithms, Multi-Agent Simulation Engine, and Data Models** for the **DIT University Emergency Evacuation System**.

---

## 📁 Directory Architecture

```
main logic/
├── algorithms/                  # Core graph search and AI pathfinding algorithms
│   ├── astar.py                 # A* Search with 3D admissible Euclidean distance heuristic
│   ├── dijkstra.py              # Dijkstra's algorithm (uniform-cost shortest weighted path)
│   ├── bfs.py                   # Breadth-First Search (unweighted minimum hop-count traversal)
│   ├── utility_agent.py         # Multi-objective utility agent (time, congestion, hazard trade-offs)
│   └── __init__.py
├── simulation/                  # Discrete-step multi-agent evacuation simulation
│   ├── engine.py                # Core simulation step engine, tick management, and state tracker
│   ├── agents.py                # Evacuation agent behavior, speed modulation, and dynamic replanning
│   ├── crowd.py                 # Edge capacity limits, pedestrian flow, and crowd bottleneck calculations
│   ├── hazards.py               # Dynamic fire propagation, smoke diffusion, and hazard thresholds
│   ├── environment.py           # Spatial simulation environment integrating hazards and crowd state
│   └── __init__.py
├── services/                    # High-level domain services
│   ├── building_service.py      # Campus topology graph manager, neighbor lookup, and edge cost formula
│   ├── routing_service.py       # Algorithm dispatcher, multi-origin routing, and warning generation
│   ├── report_service.py        # Post-evacuation audit summary, safety KPIs, and throughput metrics
│   └── __init__.py
├── models/                      # Pydantic schemas and data contracts
│   ├── schemas.py               # Node, Edge, Route, Hazard, Agent, and Scenario data models
│   └── __init__.py
├── api/                         # FastAPI REST routing layer
│   ├── routes.py                # Endpoints for routes, algorithm comparison, simulation, and hazards
│   └── __init__.py
├── data/                        # Campus spatial topology and scenario configuration
│   └── sample_building.json     # 3D nodal graph of DIT University Foothills Campus
├── main.py                      # FastAPI application server entry point
├── run_algorithms.py            # Standalone CLI runner to benchmark all 4 algorithms directly
└── README.md                    # This documentation file
```

---

## 🚀 Running the Algorithms Directly (CLI Benchmark)

You can run and test all four evacuation algorithms directly from the terminal with a single command:

```powershell
python "main logic\run_algorithms.py"
```

### Sample Benchmark Output:
```
========================================================================================
     DIT UNIVERSITY EMERGENCY EVACUATION PLANNING SYSTEM -- ALGORITHM SUITE
========================================================================================
Loaded Campus Topology: 18 nodes, 22 pathway connections, 5 designated exits.
Designated Campus Exits: EXIT_MAIN_GATE, EXIT_NORTH_GATE, EXIT_EAST_GATE, ASSEMBLY_MAIN_GROUND, ASSEMBLY_SPORTS_FIELD

>>> [EVALUATION ORIGIN] Vedanta Academic Block (Computing & Veda Library) (Node: VEDANTA_ENTRANCE)
Algorithm        | Target Exit            | Dist (m)   | Time (s)   | Explored   | Exec Time
----------------------------------------------------------------------------------------
1. BFS           | EXIT_NORTH_GATE        | 19.4       | 16.2       | 8          | 0.045 ms
2. Dijkstra      | EXIT_NORTH_GATE        | 19.4       | 16.2       | 8          | 0.055 ms
3. A* (Euclid)   | EXIT_NORTH_GATE        | 19.4       | 16.2       | 5          | 0.056 ms
4. Utility Agent | EXIT_NORTH_GATE        | 19.4       | 16.2       | 5          | 0.093 ms

A* Optimal Evacuation Path:
  VEDANTA ENTRANCE -> STAIRS VEDANTA NORTH -> EXIT NORTH GATE
  Decision Explanation: A* found the optimal least-cost path to exit 'EXIT_NORTH_GATE' using an admissible Euclidean heuristic, expanding 5 nodes.
```

---

## 🔬 Algorithmic Overview & Mathematical Formulations

### 1. A* Search Algorithm (`algorithms/astar.py`)
- **Evaluation Function**: $f(n) = g(n) + h(n)$
  - $g(n)$: Accumulated travel cost from the starting origin to node $n$.
  - $h(n)$: Admissible 3D Euclidean lower-bound heuristic to the nearest designated exit:
    $$h(n) = \min_{e \in Exits} \frac{\sqrt{(x_n - x_e)^2 + (y_n - y_e)^2 + (z_n - z_e)^2}}{v_{\max}}$$
- **Property**: Because straight-line Euclidean distance is physically the shortest possible distance between two points, $h(n) \le h^*(n)$ (never overestimates). This guarantees that A* always finds the mathematically optimal path while significantly pruning search space compared to Dijkstra.

### 2. Dijkstra's Algorithm (`algorithms/dijkstra.py`)
- **Uniform Cost Search**: Expands frontiers in order of accumulated cost $g(n)$ using a min-heap priority queue.
- **Guarantee**: Produces the absolute minimum travel cost path across all accessible network edges.

### 3. Breadth-First Search (`algorithms/bfs.py`)
- **Unweighted Hop Minimization**: Explores graph level-by-level using a FIFO queue.
- **Academic Comparison**: Treats all edges identically (hop count = 1). In cases where physical distance varies significantly across hallways, BFS showcases why weighted algorithms (Dijkstra / A*) are essential for realistic evacuation planning.

### 4. Intelligent Utility-Based Agent (`algorithms/utility_agent.py`)
- **Multi-Objective Trade-off**: Evaluates candidate paths balancing three competing criteria:
  $$U(p) = 1.0 - \left( w_{\text{time}} \cdot \tilde{T}(p) + w_{\text{hazard}} \cdot \tilde{H}(p) + w_{\text{crowd}} \cdot \tilde{C}(p) \right)$$
  - $\tilde{T}(p)$: Min-Max normalized evacuation travel time.
  - $\tilde{H}(p)$: Normalized hazard exposure penalty (fire, smoke density).
  - $\tilde{C}(p)$: Normalized pedestrian congestion and bottleneck delay.
- **Dynamic Decision Rationale**: Automatically synthesizes human-readable explanations explaining why a longer detour was chosen to avoid danger or severe crowd jams.
