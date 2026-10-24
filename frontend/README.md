# Emergency Evacuation Planning System — Frontend & 3D Digital Twin

Interactive 3D building digital twin, multi-agent evacuation simulation cockpit, and algorithmic laboratory for the **Emergency Evacuation Planning System**.

Built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, **Three.js**, **React Three Fiber (R3F)**, **Drei**, and **Lucide React**.

---

## 🌟 Key Features

1. **3D Interactive Digital Twin:**
   - Full 3D architectural twin of the Dr. A.P.J. Abdul Kalam Block based on actual graph coordinates.
   - Floor isolation (View All, Floor 0 only, Floor 1 only).
   - Camera presets (Isometric, Top-Down Floor Plan, Front elevation).
   - Smooth OrbitControls with damping and ground clamping.
   - Interactive room, laboratory, staircase, ramp, and exit mesh selection.
2. **Dynamic Hazard Visualization:**
   - Real-time animated fire cones with pulsing emissive heat fields.
   - Translucent smoke volume diffusion.
   - Localized water flooding plane.
   - Barricaded blocked corridor and jammed exit indicators.
3. **Animated Path & Evacuation Routes:**
   - Smooth 3D Catmull-Rom spline curves tracing the computed graph path.
   - Traveling luminous blue pulse animating along safe routes in real time.
   - Blocked routes highlighted in emergency red with visual interruption.
4. **Multi-Agent Simulation Cockpit:**
   - Stylized pedestrian group markers advancing edge-by-edge without teleporting.
   - Real-time crowd density flow indicators.
   - Dynamic replanning: inject hazards mid-simulation and watch agents immediately reroute to alternate safe exits.
5. **Algorithm Comparison Laboratory:**
   - Side-by-side empirical benchmarking of BFS, Dijkstra, and A* Search.
   - Compares edge hops, physical distance, travel time, and node expansions.
   - Utility Agent weight tuning laboratory ($w_{\text{time}}$, $w_{\text{hazard}}$, $w_{\text{congestion}}$).
6. **Diagnostic Reports:**
   - Exit utilization distribution bars.
   - Average and maximum evacuation times.
   - One-click CSV and JSON report exports.
7. **Offline Demo Resilience (Mock Mode):**
   - Automatically detects if the FastAPI backend is running at `:8000`.
   - If the backend is running, live API integration is active with a green indicator.
   - If the backend is offline, an amber "DEMO MODE" badge activates with high-fidelity local mock data, allowing full demonstration anywhere.

---

## 🛠️ Technology Stack

- **Framework:** React 18 & TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS (Custom Slate & Ice Blue Palette)
- **3D Graphics:** Three.js, `@react-three/fiber`, `@react-three/drei`
- **Icons:** `lucide-react`
- **Charts:** `recharts`
- **Animation:** `framer-motion`

---

## 🚀 How to Run the Frontend

### 1. Install Dependencies
```powershell
cd D:\Ai_Project\frontend
npm install
```

### 2. Start the Development Server
```powershell
npm run dev
```
Open your browser at: **[http://localhost:3000](http://localhost:3000)**

### 3. Production Build
```powershell
npm run build
```
Build output will be bundled cleanly into `frontend/dist/`.

---

## ⚙️ Backend Configuration

The frontend connects to the FastAPI backend using the environment variable:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

To configure, copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | View |
| :--- | :--- |
| **F1** or **1** | Operations Overview |
| **F2** or **2** | Building 3D Explorer |
| **F3** or **3** | Route Planner |
| **F4** or **4** | Live Simulation |
| **F5** or **5** | Algorithms Lab |
| **F6** or **6** | Evacuation Report |

---

## 📋 Folder Structure

```
frontend/
├── src/
│   ├── components/       # Header, navigation rail, footer, common badges
│   ├── features/
│   │   ├── overview/     # Mission control overview & timeline
│   │   ├── building/     # 3D building explorer & node inspector
│   │   ├── routing/      # Route planner & turn-by-turn guidance
│   │   ├── simulation/   # Simulation controls & hazard injector
│   │   ├── algorithms/   # BFS vs Dijkstra vs A* lab
│   │   └── reports/      # Exit charts & CSV/JSON export
│   ├── three/            # Three.js Canvas, 3D floors, routes, hazards, agents
│   ├── hooks/            # useSimulation central state hook
│   ├── services/         # API client & fallback mock data
│   ├── types/            # TypeScript interfaces
│   ├── utils/            # Coordinate mappers & telemetry formatters
│   ├── styles/           # Tailwind CSS
│   ├── App.tsx           # Main application shell
│   └── main.tsx          # React DOM entry
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── README.md
```
