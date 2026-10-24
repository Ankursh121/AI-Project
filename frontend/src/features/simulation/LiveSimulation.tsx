import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  FastForward,
  Flame,
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Compass,
} from 'lucide-react';
import {
  BuildingGraphModel,
  SimulationStateResponse,
  RouteResponse,
  CameraPreset,
  OverlayToggles,
  HazardEvent,
} from '../../types';
import { BuildingScene } from '../../three/BuildingScene';
import { SceneControls } from '../../three/SceneControls';
import { HazardInjectorModal } from './HazardInjectorModal';

interface LiveSimulationProps {
  building: BuildingGraphModel;
  simulationState: SimulationStateResponse;
  activeRoute: RouteResponse | null;
  selectedNodeId: string | null;
  selectedEdgeKey: string | null;
  isolatedFloor: number | null;
  cameraPreset: CameraPreset;
  overlays: OverlayToggles;
  isPlaying: boolean;
  simSpeed: number;
  onSelectNode: (id: string) => void;
  onSetCameraPreset: (p: CameraPreset) => void;
  onSetIsolatedFloor: (f: number | null) => void;
  onToggleOverlay: (k: keyof OverlayToggles) => void;
  onSetIsPlaying: (playing: boolean) => void;
  onSetSimSpeed: (speed: number) => void;
  onStepForward: (steps?: number) => Promise<void>;
  onRunToCompletion: () => Promise<void>;
  onResetSimulation: () => Promise<void>;
  onInjectHazard: (hazard: HazardEvent) => Promise<void>;
}

export const LiveSimulation: React.FC<LiveSimulationProps> = ({
  building,
  simulationState,
  activeRoute,
  selectedNodeId,
  selectedEdgeKey,
  isolatedFloor,
  cameraPreset,
  overlays,
  isPlaying,
  simSpeed,
  onSelectNode,
  onSetCameraPreset,
  onSetIsolatedFloor,
  onToggleOverlay,
  onSetIsPlaying,
  onSetSimSpeed,
  onStepForward,
  onRunToCompletion,
  onResetSimulation,
  onInjectHazard,
}) => {
  const [isHazardModalOpen, setIsHazardModalOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-main">
      {/* Top Playback & Simulation Command Bar */}
      <div className="h-12 bg-surface-secondary border-b border-surface-border px-4 flex items-center justify-between select-none z-20">
        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSetIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all shadow-sm ${
              isPlaying
                ? 'bg-emergency-amber text-surface-main'
                : 'bg-emergency-green text-surface-main hover:bg-emerald-400'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'PAUSE' : 'START SIM'}</span>
          </button>

          <button
            onClick={() => onStepForward(1)}
            disabled={isPlaying}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-elevated hover:bg-surface-elevated/80 disabled:opacity-50 text-content-primary rounded text-xs font-mono border border-surface-border transition-colors"
            title="Step Forward by 1 clock cycle (5s)"
          >
            <SkipForward className="w-3.5 h-3.5 text-brand-sky" />
            <span>STEP (5s)</span>
          </button>

          <button
            onClick={onRunToCompletion}
            disabled={isPlaying || simulationState.is_completed}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-elevated hover:bg-surface-elevated/80 disabled:opacity-50 text-content-primary rounded text-xs font-mono border border-surface-border transition-colors"
            title="Fast forward until all agents evacuate"
          >
            <FastForward className="w-3.5 h-3.5 text-brand-sky" />
            <span>RUN TO END</span>
          </button>

          <button
            onClick={onResetSimulation}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-elevated hover:bg-surface-elevated/80 text-content-secondary hover:text-brand-ice rounded text-xs font-mono border border-surface-border transition-colors"
            title="Reset simulation to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-surface-main border border-surface-border rounded p-0.5 ml-2 font-mono text-[11px]">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => onSetSimSpeed(spd)}
                className={`px-2 py-0.5 rounded ${
                  simSpeed === spd
                    ? 'bg-brand-deep text-brand-ice font-bold border border-brand-sky/40'
                    : 'text-content-muted hover:text-content-secondary'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Hazard Injector Trigger */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-content-secondary">
            <Clock className="w-3.5 h-3.5 text-brand-sky" />
            <span>
              T+<strong className="text-brand-ice">{simulationState.elapsed_time_seconds.toFixed(1)}s</strong>
            </span>
          </div>

          <button
            onClick={() => setIsHazardModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emergency-red/20 hover:bg-emergency-red/30 text-emergency-red rounded text-xs font-mono font-bold border border-emergency-red/40 transition-colors shadow-glow-red"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>INJECT HAZARD</span>
          </button>
        </div>
      </div>

      {/* Main Simulation Viewport: Sidebar + 3D Scene */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side: Active Evacuation Groups & Live Events */}
        <div className="w-full lg:w-96 bg-surface-secondary border-r border-surface-border flex flex-col h-full z-10 overflow-y-auto">
          {/* Agent Status Table */}
          <div className="p-4 border-b border-surface-border">
            <h3 className="text-xs font-mono font-bold uppercase text-brand-ice tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-brand-sky" /> Evacuating Groups ({simulationState.agents.length})
            </h3>

            <div className="space-y-2">
              {simulationState.agents.map((agent) => {
                const isEvacuated = agent.status === 'evacuated';
                const isTrapped = agent.status === 'trapped';

                return (
                  <div
                    key={agent.agent_id}
                    className={`p-2.5 rounded border text-xs font-mono transition-all ${
                      isEvacuated
                        ? 'bg-emergency-green/10 border-emergency-green/30 text-content-primary'
                        : isTrapped
                        ? 'bg-emergency-red/10 border-emergency-red/30 text-content-primary'
                        : 'bg-surface-elevated border-surface-border text-content-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-content-primary truncate">{agent.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          isEvacuated
                            ? 'bg-emergency-green/20 text-emergency-green'
                            : isTrapped
                            ? 'bg-emergency-red/20 text-emergency-red'
                            : 'bg-brand-deep text-brand-sky'
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-content-muted mt-1.5">
                      <span>{agent.group_size} occupants {agent.requires_accessible_route && '♿'}</span>
                      <span>Loc: <strong className="text-brand-ice">{agent.current_location}</strong></span>
                      <span>Target: <strong className="text-emergency-green">{agent.destination_exit || 'None'}</strong></span>
                    </div>

                    {agent.reroute_count > 0 && (
                      <div className="mt-1.5 text-[10px] text-emergency-amber bg-emergency-amber/10 px-1.5 py-0.5 rounded border border-emergency-amber/20">
                        Rerouted {agent.reroute_count}x due to hazards
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event Stream Log */}
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="text-xs font-mono font-bold uppercase text-brand-ice tracking-wider mb-2">
              Live Environmental Telemetry
            </h3>
            <div className="bg-surface-main p-2.5 rounded border border-surface-border flex-1 min-h-[140px] font-mono text-[11px] space-y-1.5 overflow-y-auto">
              {simulationState.recent_events.map((evt, idx) => (
                <div key={idx} className="border-l-2 border-brand-sky/60 pl-2 text-content-secondary leading-snug">
                  {evt}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center / Right 3D Scene */}
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
      </div>

      {/* Hazard Injector Modal */}
      <HazardInjectorModal
        isOpen={isHazardModalOpen}
        building={building}
        onClose={() => setIsHazardModalOpen(false)}
        onInject={onInjectHazard}
      />
    </div>
  );
};
