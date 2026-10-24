import React from 'react';
import {
  Users,
  ShieldCheck,
  Flame,
  ArrowRight,
  Clock,
  Compass,
} from 'lucide-react';
import {
  BuildingGraphModel,
  SimulationStateResponse,
  RouteResponse,
  ScenarioModel,
  OverlayToggles,
  CameraPreset,
} from '../../types';
import { BuildingScene } from '../../three/BuildingScene';
import { SceneControls } from '../../three/SceneControls';

interface OperationsOverviewProps {
  building: BuildingGraphModel;
  scenarios: ScenarioModel[];
  currentScenarioId: string;
  simulationState: SimulationStateResponse;
  activeRoute: RouteResponse | null;
  selectedNodeId: string | null;
  selectedEdgeKey: string | null;
  isolatedFloor: number | null;
  cameraPreset: CameraPreset;
  overlays: OverlayToggles;
  onSelectNode: (id: string) => void;
  onSelectScenario: (id: string) => void;
  onSetCameraPreset: (p: CameraPreset) => void;
  onSetIsolatedFloor: (f: number | null) => void;
  onToggleOverlay: (k: keyof OverlayToggles) => void;
  onNavigateToView: (view: any) => void;
}

export const OperationsOverview: React.FC<OperationsOverviewProps> = ({
  building,
  scenarios,
  currentScenarioId,
  simulationState,
  activeRoute,
  selectedNodeId,
  selectedEdgeKey,
  isolatedFloor,
  cameraPreset,
  overlays,
  onSelectNode,
  onSelectScenario,
  onSetCameraPreset,
  onSetIsolatedFloor,
  onToggleOverlay,
  onNavigateToView,
}) => {
  const activeHazardsCount = simulationState.active_hazards.filter((h) => h.active).length;
  const currentScenario = scenarios.find((s) => s.id === currentScenarioId);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-main">
      {/* Top Telemetry Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 p-3 bg-surface-secondary/70 border-b border-surface-border">
        {/* Metric 1 */}
        <div className="bg-surface-elevated/70 border border-surface-border rounded p-2.5 flex flex-col">
          <span className="text-[10px] font-mono text-content-secondary uppercase">Scenario Mode</span>
          <span className="text-xs font-semibold text-brand-ice truncate mt-0.5">
            {currentScenario?.name.split(':')[1] || currentScenario?.name || 'Standard Drill'}
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface-elevated/70 border border-surface-border rounded p-2.5 flex flex-col">
          <span className="text-[10px] font-mono text-content-secondary uppercase flex items-center gap-1">
            <Users className="w-3 h-3 text-brand-sky" /> Total Groups
          </span>
          <span className="text-sm font-bold text-content-primary mt-0.5">
            {simulationState.total_agents} <span className="text-[10px] text-content-muted font-normal">occupant groups</span>
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-surface-elevated/70 border border-surface-border rounded p-2.5 flex flex-col">
          <span className="text-[10px] font-mono text-content-secondary uppercase flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emergency-green" /> Evacuated
          </span>
          <span className="text-sm font-bold text-emergency-green mt-0.5">
            {simulationState.evacuated_count} / {simulationState.total_agents}
          </span>
        </div>

        {/* Metric 4 */}
        <div className="bg-surface-elevated/70 border border-surface-border rounded p-2.5 flex flex-col">
          <span className="text-[10px] font-mono text-content-secondary uppercase flex items-center gap-1">
            <Clock className="w-3 h-3 text-brand-sky" /> In Transit
          </span>
          <span className="text-sm font-bold text-brand-sky mt-0.5">
            {simulationState.active_count} moving
          </span>
        </div>

        {/* Metric 5 */}
        <div className="bg-surface-elevated/70 border border-surface-border rounded p-2.5 flex flex-col">
          <span className="text-[10px] font-mono text-content-secondary uppercase flex items-center gap-1">
            <Flame className="w-3 h-3 text-emergency-red" /> Active Hazards
          </span>
          <span className={`text-sm font-bold mt-0.5 ${activeHazardsCount > 0 ? 'text-emergency-red' : 'text-content-muted'}`}>
            {activeHazardsCount} active
          </span>
        </div>

        {/* Metric 6 */}
        <div className="bg-surface-elevated/70 border border-surface-border rounded p-2.5 flex flex-col">
          <span className="text-[10px] font-mono text-content-secondary uppercase">Exits Available</span>
          <span className="text-sm font-bold text-emergency-green mt-0.5">
            {building.nodes.filter((n) => n.is_exit && !n.is_blocked).length} Operational
          </span>
        </div>
      </div>

      {/* Main Split: 3D Twin Preview on Left, Live Feed & Scenario Cards on Right */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left: Interactive 3D Building Model */}
        <div className="flex-1 relative h-full">
          <SceneControls
            cameraPreset={cameraPreset}
            isolatedFloor={isolatedFloor}
            overlays={overlays}
            floors={building.floors}
            onSetCameraPreset={onSetCameraPreset}
            onSetIsolatedFloor={onSetIsolatedFloor}
            onToggleOverlay={onToggleOverlay}
          />
          <BuildingScene
            building={building}
            simulationState={simulationState}
            activeRoute={activeRoute}
            selectedNodeId={selectedNodeId}
            selectedEdgeKey={selectedEdgeKey}
            isolatedFloor={isolatedFloor}
            cameraPreset={cameraPreset}
            overlays={overlays}
            onSelectNode={onSelectNode}
          />
        </div>

        {/* Right Operations Sidebar */}
        <div className="w-full lg:w-96 bg-surface-secondary border-t lg:border-t-0 lg:border-l border-surface-border flex flex-col overflow-y-auto">
          {/* Quick Scenario Launcher */}
          <div className="p-4 border-b border-surface-border">
            <h2 className="text-xs font-mono uppercase tracking-wider text-brand-ice font-bold flex items-center gap-1.5 mb-2.5">
              <Compass className="w-3.5 h-3.5 text-brand-sky" /> Demonstration Scenarios
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {scenarios.slice(0, 4).map((s) => {
                const isActive = s.id === currentScenarioId;
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelectScenario(s.id)}
                    className={`text-left p-2.5 rounded border transition-all ${
                      isActive
                        ? 'bg-brand-deep/80 border-brand-sky text-brand-ice shadow-sm'
                        : 'bg-surface-elevated/40 border-surface-border hover:border-brand-sky/40 text-content-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-content-primary truncate">{s.name}</span>
                      {isActive && <span className="text-[9px] font-mono text-brand-sky font-bold">ACTIVE</span>}
                    </div>
                    <p className="text-[11px] text-content-muted mt-1 line-clamp-2 leading-relaxed">
                      {s.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-Time Event Log */}
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs font-mono uppercase tracking-wider text-brand-ice font-bold">
                Simulation Event Log
              </h2>
              <span className="text-[10px] font-mono text-content-muted">LIVE FEED</span>
            </div>

            <div className="bg-surface-main/80 border border-surface-border rounded p-2.5 flex-1 min-h-[160px] max-h-[240px] overflow-y-auto font-mono text-xs space-y-2">
              {simulationState.recent_events && simulationState.recent_events.length > 0 ? (
                simulationState.recent_events.map((evt, idx) => (
                  <div key={idx} className="border-l-2 border-brand-sky/60 pl-2 text-[11px] leading-relaxed text-content-secondary">
                    <span className="text-[9px] text-content-muted mr-1.5">[T+{simulationState.elapsed_time_seconds.toFixed(0)}s]</span>
                    {evt}
                  </div>
                ))
              ) : (
                <div className="text-content-muted text-[11px] italic">No incidents logged. System operational.</div>
              )}
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => onNavigateToView('routing')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-deep hover:bg-brand-deep/80 text-brand-ice text-xs font-mono rounded border border-brand-sky/40 transition-colors"
              >
                Plan Routes <ArrowRight className="w-3.5 h-3.5 text-brand-sky" />
              </button>
              <button
                onClick={() => onNavigateToView('simulation')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-surface-elevated hover:bg-surface-elevated/80 text-content-primary text-xs font-mono rounded border border-surface-border transition-colors"
              >
                Simulation <ArrowRight className="w-3.5 h-3.5 text-content-muted" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
