import React from 'react';
import { BuildingGraphModel, SimulationStateResponse } from '../../types';

interface StatusFooterProps {
  building: BuildingGraphModel;
  simulationState: SimulationStateResponse;
}

export const StatusFooter: React.FC<StatusFooterProps> = ({ building, simulationState }) => {
  const activeHazardsCount = simulationState.active_hazards.filter((h) => h.active).length;
  const blockedNodesCount = building.nodes.filter((n) => n.is_blocked || n.hazard_level >= 75).length;

  return (
    <footer className="h-7 bg-surface-main border-t border-surface-border px-3 flex items-center justify-between text-[11px] font-mono text-content-secondary select-none z-20">
      <div className="flex items-center gap-4">
        <span>
          NODES: <strong className="text-brand-ice">{building.nodes.length}</strong>
        </span>
        <span>
          CORRIDORS: <strong className="text-brand-ice">{building.edges.length}</strong>
        </span>
        <span>
          AGENTS: <strong className="text-brand-sky">{simulationState.total_agents}</strong>
        </span>
        <span>
          EVACUATED: <strong className="text-emergency-green">{simulationState.evacuated_count}</strong>
        </span>
        {blockedNodesCount > 0 && (
          <span className="text-emergency-red">
            BLOCKED: <strong>{blockedNodesCount}</strong>
          </span>
        )}
        {activeHazardsCount > 0 && (
          <span className="text-emergency-amber">
            ACTIVE HAZARDS: <strong>{activeHazardsCount}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] text-content-muted">
          SIM CLOCK: <strong className="text-brand-ice">{simulationState.elapsed_time_seconds.toFixed(1)}s</strong> (STEP {simulationState.current_step})
        </span>
        <span className="text-[10px] text-content-muted">|</span>
        <span className="text-[10px] text-content-muted">ACADEMIC SIMULATION SYSTEM</span>
      </div>
    </footer>
  );
};
