import React, { useState } from 'react';
import {
  Compass,
  Accessibility,
  Sliders,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  AlertOctagon,
} from 'lucide-react';
import {
  BuildingGraphModel,
  SimulationStateResponse,
  RouteResponse,
  AlgorithmType,
  CameraPreset,
  OverlayToggles,
} from '../../types';
import { BuildingScene } from '../../three/BuildingScene';
import { SceneControls } from '../../three/SceneControls';
import { TurnByTurnList } from './TurnByTurnList';

interface RoutePlannerProps {
  building: BuildingGraphModel;
  simulationState: SimulationStateResponse;
  activeRoute: RouteResponse | null;
  selectedNodeId: string | null;
  selectedEdgeKey: string | null;
  isolatedFloor: number | null;
  cameraPreset: CameraPreset;
  overlays: OverlayToggles;
  onSelectNode: (id: string) => void;
  onSetCameraPreset: (p: CameraPreset) => void;
  onSetIsolatedFloor: (f: number | null) => void;
  onToggleOverlay: (k: keyof OverlayToggles) => void;
  onRequestRoute: (req: any) => Promise<RouteResponse>;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
  building,
  simulationState,
  activeRoute,
  selectedNodeId,
  selectedEdgeKey,
  isolatedFloor,
  cameraPreset,
  overlays,
  onSelectNode,
  onSetCameraPreset,
  onSetIsolatedFloor,
  onToggleOverlay,
  onRequestRoute,
}) => {
  const [startNode, setStartNode] = useState<string>(selectedNodeId || 'ROOM_101');
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('utility');
  const [requiresAccessible, setRequiresAccessible] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.2);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Custom utility weights
  const [wTime, setWTime] = useState<number>(0.35);
  const [wHazard, setWHazard] = useState<number>(0.40);
  const [wCongestion, setWCongestion] = useState<number>(0.25);

  const nonExitNodes = building.nodes.filter((n) => !n.is_exit);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      await onRequestRoute({
        start_node: startNode,
        algorithm,
        requires_accessible_route: requiresAccessible,
        speed,
        weights: {
          w_time: wTime,
          w_hazard: wHazard,
          w_congestion: wCongestion,
          max_hazard_threshold: 75.0,
        },
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-surface-main">
      {/* Left Control & Guidance Panel */}
      <div className="w-full lg:w-96 bg-surface-secondary border-r border-surface-border flex flex-col h-full z-10 overflow-y-auto">
        <div className="p-4 border-b border-surface-border">
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-4 h-4 text-brand-sky" />
            <h2 className="text-sm font-mono font-bold uppercase text-brand-ice tracking-wider">
              Route Optimization Planner
            </h2>
          </div>
          <p className="text-xs text-content-secondary leading-relaxed">
            Calculate safe evacuation paths considering physical distance, smoke hazards, and accessibility.
          </p>
        </div>

        {/* Input Parameters Form */}
        <div className="p-4 space-y-4 border-b border-surface-border">
          {/* Starting Room Selection */}
          <div>
            <label className="text-[11px] font-mono text-content-secondary uppercase block mb-1">
              Starting Location:
            </label>
            <select
              value={startNode}
              onChange={(e) => {
                setStartNode(e.target.value);
                onSelectNode(e.target.value);
              }}
              className="w-full bg-surface-elevated text-xs font-mono text-brand-ice p-2 rounded border border-surface-border focus:border-brand-sky focus:outline-none"
            >
              {nonExitNodes.map((n) => (
                <option key={n.id} value={n.id} className="bg-surface-secondary">
                  {n.name} ({n.id} • F{n.floor})
                </option>
              ))}
            </select>
          </div>

          {/* Algorithm Picker */}
          <div>
            <label className="text-[11px] font-mono text-content-secondary uppercase block mb-1">
              Routing Algorithm:
            </label>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
              {[
                { id: 'utility', label: 'Utility Agent', desc: 'Multi-criteria trade-off' },
                { id: 'astar', label: 'A* Search', desc: 'Heuristic-pruned' },
                { id: 'dijkstra', label: 'Dijkstra', desc: 'Least-cost uniform' },
                { id: 'bfs', label: 'BFS', desc: 'Fewest hops' },
              ].map((algo) => (
                <button
                  key={algo.id}
                  type="button"
                  onClick={() => setAlgorithm(algo.id as AlgorithmType)}
                  className={`p-2 rounded text-left border transition-all ${
                    algorithm === algo.id
                      ? 'bg-brand-deep text-brand-ice border-brand-sky shadow-sm'
                      : 'bg-surface-elevated/50 text-content-secondary border-surface-border hover:border-brand-sky/30'
                  }`}
                >
                  <span className="font-semibold block">{algo.label}</span>
                  <span className="text-[9px] text-content-muted block leading-tight">{algo.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility Toggle */}
          <div className="bg-surface-elevated/70 p-2.5 rounded border border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Accessibility className="w-4 h-4 text-brand-sky" />
              <div>
                <span className="text-xs font-mono font-semibold text-content-primary block">
                  Wheelchair Accessible
                </span>
                <span className="text-[10px] text-content-muted block">
                  Strictly excludes stairwells; uses ramps
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={requiresAccessible}
              onChange={(e) => setRequiresAccessible(e.target.checked)}
              className="w-4 h-4 rounded border-surface-border text-brand-sky focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Calculate Route Action Button */}
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="w-full py-2.5 bg-brand-sky hover:bg-brand-ice text-surface-main font-mono text-xs font-bold rounded shadow-glow-sky flex items-center justify-center gap-2 transition-all"
          >
            {isCalculating ? (
              <span>Calculating...</span>
            ) : (
              <>
                <Compass className="w-4 h-4" /> Compute Evacuation Route
              </>
            )}
          </button>
        </div>

        {/* Results & Instructions View */}
        <div className="p-4 flex-1">
          {activeRoute ? (
            activeRoute.found ? (
              <div className="space-y-3">
                {/* Metrics Summary Strip */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-surface-elevated p-2 rounded border border-surface-border">
                    <span className="text-[10px] text-content-muted block">SELECTED EXIT</span>
                    <span className="font-bold text-emergency-green">{activeRoute.selected_exit}</span>
                  </div>
                  <div className="bg-surface-elevated p-2 rounded border border-surface-border">
                    <span className="text-[10px] text-content-muted block">EST. TRAVEL TIME</span>
                    <span className="font-bold text-brand-ice">{activeRoute.estimated_travel_time.toFixed(1)}s</span>
                  </div>
                  <div className="bg-surface-elevated p-2 rounded border border-surface-border">
                    <span className="text-[10px] text-content-muted block">PHYSICAL DISTANCE</span>
                    <span className="font-bold text-content-primary">{activeRoute.total_distance.toFixed(1)}m</span>
                  </div>
                  <div className="bg-surface-elevated p-2 rounded border border-surface-border">
                    <span className="text-[10px] text-content-muted block">EXPANDED NODES</span>
                    <span className="font-bold text-brand-sky">{activeRoute.nodes_expanded}</span>
                  </div>
                </div>

                {/* Plain-English Decision Rationale */}
                <div className="bg-brand-deep/40 border border-brand-sky/30 rounded p-2.5 text-xs text-brand-ice leading-relaxed">
                  <span className="text-[10px] font-mono text-brand-sky font-bold block mb-1">
                    AI AGENT DECISION RATIONALE:
                  </span>
                  {activeRoute.decision_reason}
                </div>

                {/* Step-by-Step Directions */}
                <div>
                  <h3 className="text-xs font-mono uppercase text-content-secondary mb-2">
                    Turn-By-Turn Navigation Steps
                  </h3>
                  <TurnByTurnList instructions={activeRoute.instructions} />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emergency-red/10 border border-emergency-red/30 rounded text-xs font-mono text-emergency-red flex items-start gap-2">
                <AlertOctagon className="w-5 h-5 shrink-0" />
                <div>
                  <strong className="block font-bold">NO SAFE EVACUATION ROUTE FOUND</strong>
                  <p className="mt-1 text-[11px] text-content-secondary">
                    All exits are compromised or blocked by hazards. Occupants instructed to shelter in place.
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="p-6 text-center text-xs font-mono text-content-muted">
              Select a room and click "Compute Evacuation Route" to visualize optimal path.
            </div>
          )}
        </div>
      </div>

      {/* Right / Center 3D Visualization */}
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
          onSelectNode={(nodeId) => {
            onSelectNode(nodeId);
            setStartNode(nodeId);
          }}
        />
      </div>
    </div>
  );
};
