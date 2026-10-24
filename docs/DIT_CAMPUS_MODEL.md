# DIT University Campus 3D Model & Evacuation Graph Guide

This document explains the simplified 3D representation of **DIT University, Dehradun**, how the evacuation graph connects to the AI algorithms, and how students can modify or extend the campus layout.

---

## 🏛️ 1. Overview of the Three Modeled Buildings

The digital twin includes three distinct, simplified architectural models representing key landmarks of the DIT University campus:

| Building | Function | Real Campus Role | 3D Model File |
| :--- | :--- | :--- | :--- |
| **Vedanta** | Academic Block & Central Library | Houses School of Computing & Veda Central Library | [VedantaBuilding.tsx](file:///d:/Ai_Project/frontend/src/three/buildings/VedantaBuilding.tsx) |
| **Chanakya** | Administrative Block | University administrative offices, Vice-Chancellor, Registrar | [ChanakyaBuilding.tsx](file:///d:/Ai_Project/frontend/src/three/buildings/ChanakyaBuilding.tsx) |
| **Sarojini** | Residential Hall | Dedicated on-campus girls' hostel | [SarojiniHostel.tsx](file:///d:/Ai_Project/frontend/src/three/buildings/SarojiniHostel.tsx) |

---

## 📁 2. File Organization

```
Ai_Project/
├── app/
│   ├── data/
│   │   ├── sample_building.json    # Campus graph nodes, physical distances, capacities, exits
│   │   └── scenarios.json          # Predefined emergency scenarios (Fire, Blockage, Closed Exit)
│   ├── algorithms/                 # Manual BFS, Dijkstra, A*, and Utility-Based Agent
│   └── simulation/                 # Multi-agent simulation engine and hazard progression
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── CampusDashboard.tsx # Unified single-screen cockpit UI
│   │   ├── three/
│   │   │   ├── BuildingScene.tsx   # Main 3D Canvas, lighting, and camera controller
│   │   │   ├── CampusGround.tsx    # Ground slab, lawn, paved walkways, assembly zones, trees
│   │   │   ├── RoutePath3D.tsx     # Luminous 3D route spline with animated travelling pulse
│   │   │   └── buildings/
│   │   │       ├── VedantaBuilding.tsx   # Vedanta 3-storey academic block & library portico
│   │   │       ├── ChanakyaBuilding.tsx  # Chanakya 2-storey administrative block with clock crest
│   │   │       └── SarojiniHostel.tsx    # Sarojini 4-storey residential hall with balconies
│   │   ├── utils/
│   │   │   └── coordinates.ts      # Coordinate mapping (meters to 3D world space)
│   │   └── services/
│   │       └── mockData.ts         # Offline fallback data matching sample_building.json
└── docs/
    └── DIT_CAMPUS_MODEL.md         # This reference guide
```

---

## 📍 3. Controlling Building Positions and the Campus Grid

All 3D positions are defined in metric units relative to the campus center `(X=0, Z=0)`:

- **Coordinate System**:
  - `X`: West (negative) to East (positive)
  - `Y`: Elevation above ground (0 = ground level)
  - `Z`: North (negative) to South (positive)
  - Defined in [coordinates.ts](file:///d:/Ai_Project/frontend/src/utils/coordinates.ts).

### Building Positions in 3D Space:
- **Vedanta**: Position `X: -16, Z: -4` (West side).
  - Main entrance node: `VEDANTA_ENTRANCE` at `(-16, 4)`
- **Chanakya**: Position `X: 0, Z: -13` (Center-North side).
  - Main entrance node: `CHANAKYA_ENTRANCE` at `(0, -7)`
- **Sarojini Hostel**: Position `X: 16, Z: 4` (East side).
  - Main entrance node: `SAROJINI_ENTRANCE` at `(16, -2)`
- **Central Pedestrian Plaza**: `X: 0, Z: 3` (Convergence point of all campus walkways).
- **South Main University Gate**: `X: 0, Z: 18` (Primary campus exit onto Rajpur Road).
- **North Emergency Gate**: `X: -20, Z: -14` (Alternate emergency fire exit).
- **East Perimeter Gate**: `X: 22, Z: -10` (Perimeter exit near student residences).
- **Central Sports Grounds**: `X: -5, Z: 11` (Designated safe assembly area).

To change a building's position:
1. Open its file (e.g. `VedantaBuilding.tsx`).
2. Update the `posX` and `posZ` constants at the top of the component.
3. Update the corresponding entrance coordinates in `app/data/sample_building.json` and `frontend/src/services/mockData.ts`.

---

## 🕸️ 4. How the Campus Graph is Represented

The campus is modeled as an **undirected weighted graph** $G = (V, E)$:

- **Nodes ($V$)**:
  - `VEDANTA_HALL`, `VEDANTA_ENTRANCE` (Academic Block)
  - `CHANAKYA_OFFICE`, `CHANAKYA_ENTRANCE` (Administrative Block)
  - `SAROJINI_COURTYARD`, `SAROJINI_ENTRANCE` (Girls' Hostel)
  - `PATH_WEST_VEDANTA`, `PATH_NORTH_CHANAKYA`, `PATH_EAST_SAROJINI` (Walkways)
  - `CENTRAL_PLAZA` (Central Convergence Hub)
  - `CAMPUS_PERIMETER_PATH` (West Perimeter Detour)
  - `EXIT_MAIN_GATE`, `EXIT_NORTH_GATE`, `EXIT_EAST_GATE` (Exits: `is_exit: true`)
  - `ASSEMBLY_MAIN_GROUND`, `ASSEMBLY_SPORTS_FIELD` (Assembly Areas: `is_exit: true`)

- **Edges ($E$)**:
  - Real traversable physical connections with distance in meters, base travel time in seconds, capacity, width, and accessibility flags.

---

## 🤖 5. How 3D Routes Connect to AI Algorithms

1. **User Interaction**:
   - The user selects a starting building (Vedanta, Chanakya, or Sarojini) and an algorithm (A*, Dijkstra, BFS, or Utility Agent) in the cockpit panel or by clicking the 3D building directly.
2. **Algorithm Execution**:
   - The frontend calls the backend REST endpoint `POST /route` with `{"start_node": "VEDANTA_ENTRANCE", "algorithm": "astar"}`.
   - The selected algorithm evaluates edge weights (travel time, congestion, hazard penalties) and finds the optimal path from the origin building to the nearest safe, unblocked exit or assembly area.
3. **Visual Path Generation**:
   - The backend returns the list of node IDs (e.g., `["VEDANTA_ENTRANCE", "PATH_WEST_VEDANTA", "CENTRAL_PLAZA", "EXIT_MAIN_GATE"]`).
   - [RoutePath3D.tsx](file:///d:/Ai_Project/frontend/src/three/RoutePath3D.tsx) maps these node IDs to 3D vectors and creates a continuous, smooth `CatmullRomCurve3` spline.
   - A luminous tube with a traveling light pulse renders the path on the 3D campus in real time.

---

## 🧪 6. Testing Emergency Scenarios

You can test four distinct scenarios directly from the dropdown in the cockpit panel:

1. **Normal Campus**:
   - Baseline drill. All paths and gates open.
   - Shortest path: Building $\to$ Central Plaza $\to$ South Main Gate.
2. **Fire Near Vedanta**:
   - An electrical fire with smoke is injected on `PATH_WEST_VEDANTA`.
   - The primary route to Central Plaza is impassable.
   - The AI automatically reroutes Vedanta evacuees north toward `EXIT_NORTH_GATE` or along the perimeter path.
3. **Blocked Campus Path**:
   - Debris blocks `CENTRAL_PLAZA`.
   - Evacuees reroute around the blocked junction via `CAMPUS_PERIMETER_PATH` and the East Athletic paths.
4. **Exit Unavailable**:
   - South Main Gate is locked (`EXIT_MAIN_GATE.is_blocked = true`).
   - Evacuees are redirected to `ASSEMBLY_MAIN_GROUND` or `EXIT_EAST_GATE`.

---

## ➕ 7. How to Add Another Building Later

To add a fourth building (e.g., *Vivekananda Block*):

1. **Create the 3D Component**:
   - Create `frontend/src/three/buildings/VivekanandaBuilding.tsx`.
   - Model the building using standard React Three Fiber box/cylinder primitives.
2. **Mount in Scene**:
   - In [BuildingScene.tsx](file:///d:/Ai_Project/frontend/src/three/BuildingScene.tsx), import and render `<VivekanandaBuilding />` at an unused coordinate (e.g. `[16, 0, -12]`).
3. **Add Graph Nodes & Edges**:
   - In `app/data/sample_building.json` and `frontend/src/services/mockData.ts`, add:
     - Node: `VIVEKANANDA_ENTRANCE` at `(16, -6)`
     - Edge: Connecting `VIVEKANANDA_ENTRANCE` to `PATH_EAST_SAROJINI` or `CENTRAL_PLAZA`.
4. **Add to Cockpit Selector**:
   - In [CampusDashboard.tsx](file:///d:/Ai_Project/frontend/src/components/CampusDashboard.tsx), add a button for Vivekananda in the Starting Building grid.

---

## 📐 8. Architectural Approximations Disclaimer

This digital twin is designed specifically for **academic artificial intelligence research, graph algorithms, and student demonstrations**:

- **Approximated Elements**:
  - Building dimensions, window counts, and exact spatial offsets are simplified representations.
  - Minor surrounding structures (cafes, parking bays, non-modeled hostel blocks) are omitted to maintain visual clarity and smooth 60 FPS performance on student laptops.
- **Accurate Elements**:
  - Relative layout (Vedanta on West, Chanakya Admin in Center-North, Sarojini Girls' Hostel on East).
  - Graph connectivity, non-teleporting multi-agent movement, dynamic hazard diffusion, and mathematical correctness of BFS, Dijkstra, A*, and Utility-based pathfinding.
