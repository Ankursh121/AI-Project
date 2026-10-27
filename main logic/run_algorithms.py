"""
Standalone CLI Benchmark & Demonstration Runner for All Evacuation Algorithms.
Location: main logic/run_algorithms.py

Executes:
1. Breadth-First Search (BFS)
2. Dijkstra's Algorithm
3. A* Search with Admissible 3D Euclidean Heuristic
4. Multi-Objective Intelligent Utility Agent
"""

import sys
import time
from pathlib import Path

# Ensure root directory and main logic are in sys.path
CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from app.services.building_service import BuildingGraphService
from app.algorithms.bfs import run_bfs
from app.algorithms.dijkstra import run_dijkstra
from app.algorithms.astar import run_astar
from app.algorithms.utility_agent import run_utility_agent
from app.models.schemas import AgentWeights


def format_path(node_ids):
    if not node_ids:
        return "None"
    return " -> ".join(n.replace("_", " ") for n in node_ids)


def run_all_benchmarks():
    print("=" * 88)
    print("     DIT UNIVERSITY EMERGENCY EVACUATION PLANNING SYSTEM -- ALGORITHM SUITE")
    print("=" * 88)
    print(f"Directory: {CURRENT_DIR}")
    print()

    graph_service = BuildingGraphService()
    graph_service.reload()
    nodes = list(graph_service.nodes.values())
    edges = graph_service.building_model.edges if graph_service.building_model else []
    exits = graph_service.get_exits()

    print(f"Loaded Campus Topology: {len(nodes)} nodes, {len(edges)} pathway connections, {len(exits)} designated exits.")
    print(f"Designated Campus Exits: {', '.join(e.id for e in exits)}")
    print("-" * 88)

    start_locations = [
        ("VEDANTA_ENTRANCE", "Vedanta Academic Block (Computing & Veda Library)"),
        ("CHANAKYA_ENTRANCE", "Chanakya Administrative Block"),
        ("SAROJINI_ENTRANCE", "Sarojini Girls' Hostel"),
    ]

    for start_node, location_name in start_locations:
        print(f"\n>>> [EVALUATION ORIGIN] {location_name} (Node: {start_node})")
        print("-" * 88)

        # 1. BFS
        t0 = time.perf_counter()
        bfs_route = run_bfs(graph_service, start_node_id=start_node, requires_accessible=False, speed=1.2)
        bfs_ms = (time.perf_counter() - t0) * 1000

        # 2. Dijkstra
        t0 = time.perf_counter()
        dijkstra_route = run_dijkstra(graph_service, start_node_id=start_node, requires_accessible=False, speed=1.2)
        dijkstra_ms = (time.perf_counter() - t0) * 1000

        # 3. A*
        t0 = time.perf_counter()
        astar_route = run_astar(graph_service, start_node_id=start_node, requires_accessible=False, speed=1.2)
        astar_ms = (time.perf_counter() - t0) * 1000

        # 4. Utility Agent
        t0 = time.perf_counter()
        utility_weights = AgentWeights(w_time=0.35, w_hazard=0.40, w_congestion=0.25)
        utility_route = run_utility_agent(
            graph_service,
            start_node_id=start_node,
            weights=utility_weights,
            requires_accessible=False,
            speed=1.2,
        )
        utility_ms = (time.perf_counter() - t0) * 1000

        # Display Comparison Table
        print(f"{'Algorithm':<16} | {'Target Exit':<22} | {'Dist (m)':<10} | {'Time (s)':<10} | {'Explored':<10} | {'Exec Time'}")
        print("-" * 88)
        print(f"{'1. BFS':<16} | {bfs_route.get('selected_exit') or 'N/A':<22} | {bfs_route.get('total_distance', 0.0):<10.1f} | {bfs_route.get('estimated_travel_time', 0.0):<10.1f} | {bfs_route.get('nodes_explored', bfs_route.get('nodes_expanded', 0)):<10} | {bfs_ms:.3f} ms")
        print(f"{'2. Dijkstra':<16} | {dijkstra_route.get('selected_exit') or 'N/A':<22} | {dijkstra_route.get('total_distance', 0.0):<10.1f} | {dijkstra_route.get('estimated_travel_time', 0.0):<10.1f} | {dijkstra_route.get('nodes_explored', dijkstra_route.get('nodes_expanded', 0)):<10} | {dijkstra_ms:.3f} ms")
        print(f"{'3. A* (Euclid)':<16} | {astar_route.get('selected_exit') or 'N/A':<22} | {astar_route.get('total_distance', 0.0):<10.1f} | {astar_route.get('estimated_travel_time', 0.0):<10.1f} | {astar_route.get('nodes_explored', astar_route.get('nodes_expanded', 0)):<10} | {astar_ms:.3f} ms")
        print(f"{'4. Utility Agent':<16} | {utility_route.get('selected_exit') or 'N/A':<22} | {utility_route.get('total_distance', 0.0):<10.1f} | {utility_route.get('estimated_travel_time', 0.0):<10.1f} | {utility_route.get('nodes_explored', utility_route.get('nodes_expanded', 0)):<10} | {utility_ms:.3f} ms")
        
        print("\nA* Optimal Evacuation Path:")
        print(f"  {format_path(astar_route.get('path', []))}")
        print(f"  Decision Explanation: {astar_route.get('decision_reason', '')}")

    print("\n" + "=" * 88)
    print(" ALL 4 ALGORITHMS EXECUTED SUCCESSFULLY")
    print("=" * 88)


if __name__ == "__main__":
    run_all_benchmarks()
