"""
FastAPI Main Application Entry Point.
AI-Based Emergency Evacuation Planning and Intelligent Route Optimization System.
"""

import os
from typing import Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router

# Title and Description for OpenAPI / Swagger
app_title = "Emergency Evacuation Planning & Intelligent Route Optimization System"
app_description = """
### Academic AI Simulation System for Building Evacuation

An intelligent multi-agent route optimization and dynamic hazard simulation system.
Developed for BTech Computer Science academic demonstration and viva defense.

#### Core Features:
- **Manual Routing Algorithms:** Unweighted BFS, Dijkstra's algorithm, and A* Search with admissible 3D Euclidean heuristics.
- **Intelligent Utility-Based Agent:** Multi-objective trade-off balancing travel time, hazard exposure, and pedestrian congestion.
- **Accessibility Constraints:** Hard exclusion of stairs for wheelchair mobility profiles.
- **Multi-Agent Simulation:** Discrete-step simulation without teleportation, tracking dynamic crowd density and bottleneck formation.
- **Dynamic Hazard Progression:** Fire, smoke diffusion, flooding, and structural blockages triggering real-time agent replanning.
- **Comprehensive Reporting:** Automated post-evacuation diagnostics and exit usage analytics.

> **Academic Disclaimer:** This is an educational AI research and simulation tool.
> It is NOT certified for life-critical building evacuation or regulatory fire safety compliance.
> Real-world emergencies must always adhere to designated civil defense authority protocols
> and officially certified building evacuation plans.
"""

app = FastAPI(
    title=app_title,
    description=app_description,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration for future separate frontend
cors_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
)
allowed_origins = [orig.strip() for orig in cors_env.split(",") if orig.strip()]
if "*" not in allowed_origins:
    allowed_origins.append("*")  # Permissive for development convenience

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pathlib import Path
from fastapi import Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Locate frontend production build bundle (checks root public directory first, then frontend/dist)
ROOT_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = ROOT_DIR / "public"
DIST_DIR = ROOT_DIR / "frontend" / "dist"
STATIC_DIR = PUBLIC_DIR if (PUBLIC_DIR / "index.html").exists() else DIST_DIR
ASSETS_DIR = STATIC_DIR / "assets"

# Register API routes (both root and /api prefixed for client compatibility)
app.include_router(api_router)
app.include_router(api_router, prefix="/api")

# Mount /assets if built frontend directory exists
if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")


def api_metadata() -> Dict[str, Any]:
    """Returns service metadata, documentation links, and academic disclaimer."""
    return {
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
            "report": "/report",
        },
        "disclaimer": (
            "ACADEMIC NOTICE: This is an educational AI research and simulation tool. "
            "It is NOT certified for life-critical building evacuation. Real emergencies "
            "must follow official building safety plans and civil defense directives."
        ),
    }


@app.get("/logoo.jpg", include_in_schema=False)
def serve_logo():
    logo_file = STATIC_DIR / "logoo.jpg"
    if logo_file.exists():
        return FileResponse(str(logo_file), media_type="image/jpeg")
    return {"error": "Logo not found"}


@app.get("/api-info", tags=["System"])
def api_info() -> Dict[str, Any]:
    """Provides service metadata and available emergency evacuation endpoints."""
    return api_metadata()


@app.get("/", tags=["System"])
def root(request: Request):
    """
    Root endpoint: serves the 3D Digital Twin frontend to web browsers,
    or returns API metadata to test and programmatic clients.
    """
    accept = request.headers.get("accept", "")
    index_file = STATIC_DIR / "index.html"
    if "text/html" in accept and index_file.exists():
        return FileResponse(str(index_file))
    return api_metadata()


@app.get("/index.html", include_in_schema=False)
def serve_index_direct():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return api_metadata()


@app.get("/{full_path:path}", include_in_schema=False)
def catch_all_spa(full_path: str):
    file_path = STATIC_DIR / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(str(file_path))
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"detail": "Not Found"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("APP_PORT", 8000))
    host = os.getenv("APP_HOST", "127.0.0.1")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
