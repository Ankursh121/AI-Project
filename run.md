# Run Guide — DIT University Emergency Evacuation System

This guide provides **direct, copy-pasteable commands** to run the **DIT University 3D Evacuation Digital Twin** (featuring Vedanta Academic Block, Chanakya Administrative Block, and Sarojini Girls' Hostel).

For full architectural details, coordinates, and customization guides, see [DIT_CAMPUS_MODEL.md](file:///d:/Ai_Project/docs/DIT_CAMPUS_MODEL.md).

---

## 📌 Direct Access URLs

| Component | URL | Description |
| :--- | :--- | :--- |
| **3D Campus Cockpit** | [http://127.0.0.1:3000](http://127.0.0.1:3000) | Interactive 3D DIT Campus Digital Twin & Route Planner |
| **Backend REST API** | [http://127.0.0.1:8000](http://127.0.0.1:8000) | Root API health status & endpoints |
| **Interactive Swagger Docs** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Test all algorithms & endpoints in browser |
| **ReDoc API Documentation** | [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc) | Clean technical API documentation |

---

## 🚀 Option 1: Quick 1-Click Launch (Batch Files)

You can run these scripts directly from PowerShell, CMD, or double-click them in Windows Explorer:

- **Start Backend:**
  ```cmd
  .\start-backend.bat
  ```
- **Start Frontend:**
  ```cmd
  .\start-frontend.bat
  ```
- **Run Automated Tests:**
  ```cmd
  .\run-tests.bat
  ```

---

## 🖥️ Option 2: Run Directly in Terminal

### Terminal 1: Run the Backend (FastAPI on Port 8000)

Open your terminal in `D:\Ai_Project` and copy-paste:

```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend is now live at [http://127.0.0.1:8000](http://127.0.0.1:8000) and Swagger docs at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).*

---

### Terminal 2: Run the Frontend (React Three.js on Port 3000)

Open a **second** terminal window and copy-paste:

```powershell
cd frontend
npm run dev
```
*Frontend is now live at [http://127.0.0.1:3000](http://127.0.0.1:3000).*

---

### Terminal 3: Run the Test Suite (33 Pytest Tests)

To verify all algorithms, safety constraints, dynamic hazards, and API endpoints:

```powershell
.\venv\Scripts\python.exe -m pytest -v
```
*Expected Result:* `33 passed in ~1.2s` (100% passing test suite).

---

## 💡 Option 3: Activate Virtual Environment

If you prefer using standard `python`, `uvicorn`, and `pytest` without typing `.\venv\Scripts\`:

```powershell
# 1. Activate the environment
.\venv\Scripts\Activate.ps1

# 2. Now you can run standard commands:
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pytest -v
```

*(Note: If PowerShell displays an `Execution_Policies` restriction on script activation, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` or simply use Option 2 above).*

---

## ⌨️ Frontend Keyboard Shortcuts

When using the 3D application in your browser, press any of these keys:

| Key | View | Description |
| :--- | :--- | :--- |
| **`1`** or **`F1`** | **Operations Overview** | Cockpit dashboard, key stats, live 3D preview |
| **`2`** or **`F2`** | **Building 3D Explorer** | Digital twin inspector, floor isolation, room search |
| **`3`** or **`F3`** | **Route Planner** | Interactive route calculation & turn-by-turn guidance |
| **`4`** or **`F4`** | **Live Simulation** | Multi-agent step simulation & dynamic hazard injector |
| **`5`** or **`F5`** | **Algorithms Lab** | Side-by-side comparison of BFS vs Dijkstra vs A* |
| **`6`** or **`F6`** | **Evacuation Report** | Post-simulation analytics, exit charts, CSV/JSON export |

---

## 🔧 Port Troubleshooting

If a port is already occupied by a previous process:

### Free Port 8000 (Backend):
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
```

### Free Port 3000 (Frontend):
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```
