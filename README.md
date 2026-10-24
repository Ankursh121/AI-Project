# Emergency Evacuation Planning System
### An Intelligent Multi-Agent Route Optimization and Hazard Simulation System

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)](https://fastapi.tiangolo.com)
[![Pytest Tests](https://img.shields.io/badge/pytest-33%20passed-brightgreen.svg)](https://docs.pytest.org)
[![Academic Project](https://img.shields.io/badge/B.Tech%20CSE-AI%20Project-orange.svg)](#)

An intelligent multi-agent building evacuation planning and dynamic hazard simulation system. Engineered for B.Tech Computer Science academic demonstration, viva defense, and educational algorithmic experimentation.

> **⚠️ Mandatory Academic Disclaimer:** This is an educational AI research and simulation platform. It is **NOT** certified for life-critical building safety engineering, regulatory fire code compliance, or real-world emergency dispatch. Real-world emergencies must always adhere to designated civil defense authority protocols, certified building fire safety systems, and official emergency personnel instructions.

---

## 🌟 Key Highlights & Capabilities

- **Manual Algorithmic Implementations:** Core Breadth-First Search (BFS), Dijkstra's algorithm, and A\* Search implemented from scratch without library shortcuts.
- **Intelligent Utility-Based Agent:** Multi-criteria decision engine evaluating trade-offs between travel time, smoke/fire exposure, and crowd density.
- **Dynamic Safety Model:** Demonstrates that the *shortest route is frequently not the safest or fastest route*.
- **Accessibility Constraints:** Strict enforcement of step-free routes for wheelchair mobility profiles (routing via external ramps and excluding staircases).
- **Multi-Agent Crowd Simulation:** Discrete-step pedestrian movement without teleportation, modeling corridor congestion and bottleneck formation.
- **Dynamic Hazard Progression:** Fire, smoke diffusion, flash flooding, and structural blockages that trigger real-time route invalidation and autonomous replanning.
- **REST API & Swagger UI:** Complete FastAPI backend with Pydantic validation, CORS middleware, and automatic Swagger documentation.
- **100% Test Coverage:** 33 comprehensive Pytest tests covering algorithms, graph models, simulation mechanics, and API endpoints.

---

## 📁 Repository Structure

```
d:/Ai_Project/
├── frontend/                     # Completely reserved for future frontend (empty)
│   └── .gitkeep
├── app/
│   ├── main.py                   # FastAPI application entry point
│   ├── api/routes.py             # REST API endpoint handlers
│   ├── models/schemas.py         # Pydantic schemas (nodes, edges, agents, hazards)
│   ├── algorithms/               # Manual BFS, Dijkstra, A*, and Utility Agent
│   ├── simulation/               # Multi-agent engine, crowd, hazards, environment
│   ├── services/                 # Building service, routing service, report service
│   └── data/                     # Sample building graph and 6 scenarios JSON
├── tests/                        # 33 automated tests across all components
├── docs/
│   ├── PROJECT_GUIDE.md          # Master academic manual (Sections A through N)
│   ├── ALGORITHMS.md             # Mathematical formulas, pseudocode & proofs
│   ├── API_GUIDE.md              # Complete REST endpoint specifications & examples
│   └── VIVA_QUESTIONS.md         # 30+ technical questions & answers for viva defense
├── requirements.txt              # Pinned Python package dependencies
├── .env.example                  # Safe development environment defaults
└── README.md                     # Project summary (this document)
```

*Note on `frontend/`: The frontend folder is intentionally kept completely free of implementation files. A separate frontend dashboard can communicate with the backend via the REST API.*

---

## 🚀 Quick Start Guide (Windows PowerShell)

### 1. Prerequisites
Ensure Python 3.11 or compatible is installed (verified on Python 3.14.3).

### 2. Install Dependencies
```powershell
# Using the installed Python interpreter
& "C:\Users\Lenovo\AppData\Local\Python\pythoncore-3.14-64\python.exe" -m pip install -r requirements.txt
```

### 3. Run Automated Tests (33 Passed)
```powershell
& "C:\Users\Lenovo\AppData\Local\Python\pythoncore-3.14-64\python.exe" -m pytest -v
```

### 4. Start the REST API Development Server
```powershell
& "C:\Users\Lenovo\AppData\Local\Python\pythoncore-3.14-64\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 5. Access Interactive Documentation
Open your web browser:
- **Interactive Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternative ReDoc UI:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **API Root / Health:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 📊 Summary of Implemented Algorithms

| Algorithm | Primary Objective | Optimization Target | Key Academic Characteristics |
| :--- | :--- | :--- | :--- |
| **BFS** | Fewest hallway hops | Edge count (unweighted) | Ignores physical length, hazards, and congestion. |
| **Dijkstra** | Optimal weighted path | Minimal cumulative cost | Uses binary min-heap; guarantees global least-cost exit. |
| **A\* Search** | Optimal path with pruning | $f(n) = g(n) + h(n)$ | Admissible 3D Euclidean heuristic; expands fewer nodes. |
| **Utility Agent** | Multi-criteria balance | $U = 1.0 - \text{Disutility}$ | Balances time, hazard, congestion; explains decisions in English. |

---

## 🧪 Prebuilt Demonstration Scenarios

The system includes 6 reproducible demonstration scenarios in `app/data/scenarios.json`:
- **Scenario A (Normal Evacuation):** Pristine baseline drill comparing BFS, Dijkstra, and A\*.
- **Scenario B (Fire Near Shortest Route):** Central corridor blocked by fire; agent takes perimeter detour.
- **Scenario C (Flooded Corridor):** Water accumulation creates high traversal penalty; agent evaluates detour.
- **Scenario D (Blocked Emergency Exit):** Exit door jammed; occupants dynamically re-target alternate exits.
- **Scenario E (Crowd Congestion):** Stairway bottleneck causes incoming groups to divert to alternate stairwells.
- **Scenario F (Accessibility / Wheelchairs):** Step-free routing for wheelchair users via external ramp.

---

## 📚 Detailed Documentation Links

- 📖 **[Master Project Guide (`docs/PROJECT_GUIDE.md`)](file:///d:/Ai_Project/docs/PROJECT_GUIDE.md):** Complete manual covering architecture, graph theory, step-by-step algorithms, formulas, multi-agent mechanics, and viva guidance.
- 📐 **[Algorithm Reference (`docs/ALGORITHMS.md`)](file:///d:/Ai_Project/docs/ALGORITHMS.md):** Mathematical formulas, hand-worked examples, and pseudocode.
- 🌐 **[REST API Guide (`docs/API_GUIDE.md`)](file:///d:/Ai_Project/docs/API_GUIDE.md):** Detailed endpoint specifications, request payloads, and response examples.
- 🎓 **[Viva Question Bank (`docs/VIVA_QUESTIONS.md`)](file:///d:/Ai_Project/docs/VIVA_QUESTIONS.md):** 30+ technical questions and concise answers for examiner defense.
