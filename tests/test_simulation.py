"""
Integration tests for Multi-Agent Simulation Engine and Reporting on DIT Campus.
Validates realistic step-by-step movement (no teleportation), dynamic replanning,
crowd density recalculation, and report accuracy.
"""

import pytest
from app.models.schemas import AgentStatus, HazardEvent, HazardType
from app.simulation.engine import SimulationEngine
from app.services.report_service import ReportService


@pytest.fixture
def engine():
    eng = SimulationEngine()
    eng.initialize_scenario("scenario_normal")
    return eng


def test_agent_moves_incrementally_without_teleportation(engine):
    """
    Ensure agent moves edge-by-edge rather than teleporting instantly.
    In 1 step (3 seconds), agent should still be in transit or at the first corridor.
    """
    agent = engine.agents[0]
    initial_location = agent.model.current_location

    # Advance small step
    engine.step(num_steps=1, time_delta=3.0)

    # Agent should not have magically jumped directly to the final exit
    assert agent.status == AgentStatus.EVACUATING
    assert agent.model.actual_evacuation_time == 0.0


def test_dynamic_hazard_triggers_agent_rerouting(engine):
    """
    When an upcoming exit is suddenly blocked by a hazard,
    the agent must detect the blockage and replan to an alternate available exit.
    """
    agent = engine.agents[0]
    assert agent.model.assigned_route[0] == "VEDANTA_ENTRANCE"
    initial_exit = agent.model.destination_exit

    # Block initial destination exit with structural blockage
    blockage = HazardEvent(
        hazard_id="sudden_exit_blockage",
        hazard_type=HazardType.STRUCTURAL_BLOCKAGE,
        location_type="node",
        target_id=initial_exit or "EXIT_MAIN_GATE",
        severity=100.0,
        is_passable=False,
    )
    engine.inject_hazard(blockage)

    # Route should be replanned to alternate exit
    assert agent.model.reroute_count >= 1
    assert agent.model.destination_exit != initial_exit
    assert agent.status == AgentStatus.EVACUATING
    assert len(agent.model.reroute_reasons) > 0


def test_simulation_runs_to_completion(engine):
    """Running simulation for sufficient steps allows all agents to evacuate."""
    engine.run_to_completion(max_steps=50, time_delta=5.0)
    assert engine.is_completed() is True
    # In Normal Campus scenario, all agents have clear paths to exits
    for agent in engine.agents:
        assert agent.status == AgentStatus.EVACUATED
        assert agent.model.actual_evacuation_time > 0


def test_evacuation_report_generates_accurate_metrics(engine):
    """Evacuation report must calculate stats from real agent data."""
    engine.run_to_completion(max_steps=50, time_delta=5.0)
    report_service = ReportService(engine)
    report = report_service.generate_report()

    assert report.total_agents == len(engine.agents)
    assert report.evacuated_agents == len(engine.agents)
    assert report.trapped_agents == 0
    assert report.avg_evacuation_time_seconds > 0.0
    assert len(report.exit_usage_distribution) > 0
    assert "ACADEMIC NOTICE" in report.academic_disclaimer
