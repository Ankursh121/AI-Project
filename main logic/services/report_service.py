"""
Evacuation Report Generation Service.
Aggregates post-simulation diagnostics, exit distribution, bottleneck metrics,
reroute events, and performance statistics calculated from actual simulation state.
"""

from typing import Dict, List, Any
from app.models.schemas import AgentStatus, EvacuationReportResponse
from app.simulation.engine import SimulationEngine


class ReportService:
    """Produces structured evacuation analytical reports based on actual simulation data."""

    def __init__(self, simulation_engine: SimulationEngine):
        self.simulation_engine = simulation_engine

    def generate_report(self) -> EvacuationReportResponse:
        """Calculates comprehensive post-evacuation performance metrics."""
        engine = self.simulation_engine
        agents = [a.model for a in engine.agents]

        total_agents = len(agents)
        total_people = sum(a.group_size for a in agents)

        evacuated_agents = [a for a in agents if a.status == AgentStatus.EVACUATED]
        evacuated_agent_count = len(evacuated_agents)
        evacuated_people_count = sum(a.group_size for a in evacuated_agents)

        trapped_agents = [a for a in agents if a.status == AgentStatus.TRAPPED]
        trapped_agent_count = len(trapped_agents)
        trapped_people_count = sum(a.group_size for a in trapped_agents)

        active_agents = [a for a in agents if a.status == AgentStatus.EVACUATING]
        active_agent_count = len(active_agents)

        # Exit usage statistics
        exit_usage: Dict[str, int] = {}
        for a in evacuated_agents:
            if a.destination_exit:
                exit_usage[a.destination_exit] = exit_usage.get(a.destination_exit, 0) + a.group_size

        # Time statistics
        evac_times = [a.actual_evacuation_time for a in evacuated_agents if a.actual_evacuation_time > 0]
        if evac_times:
            avg_time = round(sum(evac_times) / len(evac_times), 1)
            max_time = round(max(evac_times), 1)
            min_time = round(min(evac_times), 1)
        else:
            avg_time = 0.0
            max_time = 0.0
            min_time = 0.0

        # Corridors with congestion
        congested = engine.environment.crowd_manager.get_congested_corridors(threshold=0.50)

        # Hazard affected locations
        hazard_locs = list(
            set(h.target_id for h in engine.environment.hazard_manager.active_hazards.values())
        )

        # Reroute events
        total_reroutes = sum(a.reroute_count for a in agents)

        # Agent detailed summaries
        agent_summaries: List[Dict[str, Any]] = []
        for a in agents:
            agent_summaries.append({
                "agent_id": a.agent_id,
                "name": a.name,
                "group_size": a.group_size,
                "status": a.status.value,
                "current_location": a.current_location,
                "destination_exit": a.destination_exit,
                "actual_evacuation_time": a.actual_evacuation_time,
                "reroute_count": a.reroute_count,
                "reroute_reasons": a.reroute_reasons,
                "requires_accessible_route": a.requires_accessible_route,
            })

        return EvacuationReportResponse(
            scenario_name=engine.current_scenario_name,
            total_simulation_steps=engine.environment.current_step,
            total_simulation_time_seconds=round(engine.environment.time_elapsed_seconds, 1),
            total_agents=total_agents,
            total_people=total_people,
            evacuated_agents=evacuated_agent_count,
            evacuated_people=evacuated_people_count,
            trapped_agents=trapped_agent_count,
            trapped_people=trapped_people_count,
            active_agents=active_agent_count,
            exit_usage_distribution=exit_usage,
            avg_evacuation_time_seconds=avg_time,
            max_evacuation_time_seconds=max_time,
            min_evacuation_time_seconds=min_time,
            congested_corridors=congested,
            hazard_affected_locations=hazard_locs,
            total_reroute_events=total_reroutes,
            agent_summaries=agent_summaries,
            academic_disclaimer=(
                "ACADEMIC NOTICE: This is an educational AI research and simulation tool. "
                "It is NOT certified for life-critical building evacuation or regulatory fire safety compliance. "
                "Real-world emergencies must always adhere to designated civil defense authority protocols "
                "and officially certified building evacuation plans."
            ),
        )
