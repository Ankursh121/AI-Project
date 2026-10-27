"""
Multi-Agent Simulation Engine.
Orchestrates discrete-time simulation steps, coordinates hazard diffusion,
crowd density recalculation, dynamic route invalidation, and agent replanning.
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Any

from app.models.schemas import (
    AgentStatus,
    EvacuationAgentModel,
    HazardEvent,
    ScenarioModel,
    SimulationStateResponse,
)
from app.simulation.agents import EvacuationAgent
from app.simulation.environment import SimulationEnvironment


class SimulationEngine:
    """Core simulation coordinator managing agents, scenarios, and step cycles."""

    def __init__(self, scenarios_file_path: Optional[str] = None):
        self.scenarios_path = scenarios_file_path or str(
            Path(__file__).resolve().parent.parent / "data" / "scenarios.json"
        )
        self.environment = SimulationEnvironment()
        self.agents: List[EvacuationAgent] = []
        self.scenarios: Dict[str, ScenarioModel] = {}
        self.current_scenario_id: str = "scenario_normal"
        self.current_scenario_name: str = "Normal Campus"
        self.event_log: List[str] = []
        self.load_scenarios()
        if self.scenarios and self.current_scenario_id not in self.scenarios:
            self.current_scenario_id = list(self.scenarios.keys())[0]
        self.initialize_scenario(self.current_scenario_id)

    def load_scenarios(self) -> None:
        """Loads prebuilt demonstration scenarios from JSON catalog."""
        path = Path(self.scenarios_path)
        if not path.exists():
            return
        with open(path, "r", encoding="utf-8") as f:
            raw_scenarios = json.load(f)
        for s in raw_scenarios:
            model = ScenarioModel.model_validate(s)
            self.scenarios[model.id] = model

    def initialize_scenario(self, scenario_id: str) -> bool:
        """
        Initializes the simulation with the given scenario:
        Resets building and environment, injects initial hazards,
        and plans baseline routes for all agents.
        """
        if scenario_id not in self.scenarios:
            if self.scenarios:
                scenario_id = list(self.scenarios.keys())[0]
            else:
                return False

        scenario = self.scenarios[scenario_id]
        self.current_scenario_id = scenario_id
        self.current_scenario_name = scenario.name
        self.event_log.clear()

        # 1. Reset environment
        self.environment.reset()
        self.event_log.append(f"Initialized '{scenario.name}'.")

        # 2. Apply initial hazards
        for haz in scenario.initial_hazards:
            logs = self.environment.apply_hazard(haz)
            self.event_log.extend(logs)

        # 3. Instantiate agents and compute initial routes
        self.agents.clear()
        for agent_data in scenario.initial_agents:
            # Clone model to avoid mutating original scenario template
            agent_model = agent_data.model_copy(deep=True)
            agent = EvacuationAgent(agent_model)
            self.agents.append(agent)

        # 4. Plan initial routes
        for agent in self.agents:
            success = agent.plan_initial_route(self.environment.graph_service)
            if success:
                self.event_log.append(
                    f"Agent '{agent.model.name}' initially routed to exit '{agent.model.destination_exit}' "
                    f"via {len(agent.model.assigned_route)} waypoints."
                )
            else:
                self.event_log.append(f"Agent '{agent.model.name}' could not find initial route (sheltering).")

        # 5. Initialize crowd distribution
        self.environment.crowd_manager.update_crowd_distribution([a.model for a in self.agents])
        return True

    def inject_hazard(self, hazard: HazardEvent) -> List[str]:
        """
        Dynamically injects a hazard during an active simulation,
        immediately validating affected agent routes.
        """
        logs = self.environment.apply_hazard(hazard)
        self.event_log.extend(logs)

        # Immediately check agent routes and trigger replanning if affected
        for agent in self.agents:
            if agent.status == AgentStatus.EVACUATING:
                is_valid, reason = agent.validate_current_route(self.environment.graph_service)
                if not is_valid:
                    self.event_log.append(f"DYNAMIC REPLAN: Route for '{agent.model.name}' invalidated: {reason}")
                    agent.replan_route(self.environment.graph_service, reason)
                    self.event_log.append(
                        f"Agent '{agent.model.name}' rerouted to exit '{agent.model.destination_exit}'."
                    )

        # Update crowd distribution
        self.environment.crowd_manager.update_crowd_distribution([a.model for a in self.agents])
        return logs

    def step(self, num_steps: int = 1, time_delta: float = 5.0) -> List[str]:
        """
        Advances the simulation by num_steps cycles:
        1. Advances hazard progression.
        2. Recalculates crowd distribution.
        3. Validates agent paths against new hazards/blockages.
        4. Replans invalidated routes.
        5. Moves agents forward along current edges.
        """
        step_events: List[str] = []

        for _ in range(num_steps):
            if self.is_completed():
                step_events.append("Simulation complete: All agents have evacuated or are trapped.")
                break

            # 1. Advance hazards
            hazard_events = self.environment.advance_time(time_delta=time_delta)
            step_events.extend(hazard_events)

            # 2. Update crowd distributions
            self.environment.crowd_manager.update_crowd_distribution([a.model for a in self.agents])

            # 3. Validate routes and advance agents
            for agent in self.agents:
                if agent.status == AgentStatus.EVACUATING:
                    # Validate route against any newly developed hazards or blockages
                    is_valid, invalid_reason = agent.validate_current_route(self.environment.graph_service)
                    if not is_valid:
                        step_events.append(
                            f"Obstacle Encountered: Agent '{agent.model.name}' route compromised: {invalid_reason}"
                        )
                        agent.replan_route(self.environment.graph_service, invalid_reason)
                        step_events.append(
                            f"Agent '{agent.model.name}' re-routed to '{agent.model.destination_exit}'."
                        )

                    # Move agent forward
                    move_msg = agent.advance_movement(
                        time_delta=time_delta,
                        graph_service=self.environment.graph_service,
                        crowd_manager=self.environment.crowd_manager,
                        elapsed_sim_time=self.environment.time_elapsed_seconds,
                    )
                    if move_msg:
                        step_events.append(move_msg)

            # Post-movement crowd update
            self.environment.crowd_manager.update_crowd_distribution([a.model for a in self.agents])

        self.event_log.extend(step_events)
        return step_events

    def run_to_completion(self, max_steps: int = 60, time_delta: float = 5.0) -> List[str]:
        """Advances simulation until all agents have concluded their journey or cutoff reached."""
        logs: List[str] = []
        for _ in range(max_steps):
            if self.is_completed():
                break
            step_logs = self.step(num_steps=1, time_delta=time_delta)
            logs.extend(step_logs)
        return logs

    def is_completed(self) -> bool:
        """Returns True if no agents are actively in transit."""
        if not self.agents:
            return True
        return all(a.status in (AgentStatus.EVACUATED, AgentStatus.TRAPPED) for a in self.agents)

    def get_state(self) -> SimulationStateResponse:
        """Returns current high-level status of the simulation."""
        evac_count = sum(1 for a in self.agents if a.status == AgentStatus.EVACUATED)
        trap_count = sum(1 for a in self.agents if a.status == AgentStatus.TRAPPED)
        active_count = sum(1 for a in self.agents if a.status == AgentStatus.EVACUATING)

        return SimulationStateResponse(
            scenario_name=self.current_scenario_name,
            current_step=self.environment.current_step,
            elapsed_time_seconds=round(self.environment.time_elapsed_seconds, 1),
            is_completed=self.is_completed(),
            total_agents=len(self.agents),
            evacuated_count=evac_count,
            trapped_count=trap_count,
            active_count=active_count,
            agents=[a.model for a in self.agents],
            active_hazards=list(self.environment.hazard_manager.active_hazards.values()),
            recent_events=self.event_log[-10:],
        )
