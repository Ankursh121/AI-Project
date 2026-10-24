import React, { useState, useEffect } from 'react';
import {
  BuildingGraphModel,
  ScenarioModel,
  SimulationStateResponse,
  RouteResponse,
  AlgorithmType,
  CameraPreset,
  OverlayToggles,
  HazardEvent,
} from '../types';
import { BuildingScene, CameraFocusRequest } from '../three/BuildingScene';
import {
  RotateCcw,
  Navigation,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Compass,
  ShieldAlert,
  ArrowRight,
  Focus,
  Clock,
  MapPin,
  Info,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Eye,
  EyeOff,
} from 'lucide-react';

interface CampusDashboardProps {
  building: BuildingGraphModel;
  scenarios: ScenarioModel[];
  currentScenarioId: string;
  simulationState: SimulationStateResponse;
  activeRoute: RouteResponse | null;
  selectedNodeId: string | null;
  selectedEdgeKey: string | null;
  cameraPreset: CameraPreset;
  overlays: OverlayToggles;
  isBackendOnline: boolean;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeKey: string) => void;
  onSelectScenario: (scenarioId: string) => void;
  onSetCameraPreset: (preset: CameraPreset) => void;
  onToggleOverlay: (key: keyof OverlayToggles) => void;
  onRequestRoute: (startNodeId: string, algorithm: AlgorithmType) => Promise<any>;
  onInjectHazard: (hazard: HazardEvent) => Promise<any>;
  onResetScenario: () => void;
  onRefresh: () => void;
}

// Building profile information displayed on selection
const BUILDING_INFO: Record<
  string,
  { name: string; type: string; occupancy: string; exit: string; tip: string; icon: string }
> = {
  VEDANTA: {
    name: 'Vedanta Academic Block',
    type: 'Academic Building (School of Computing & Veda Central Library)',
    occupancy: '~150 occupants',
    exit: 'North Gate Exit (Assembly Area A)',
    tip: 'Wide collegiate corridors lead north to primary assembly grounds.',
    icon: '🏛️',
  },
  CHANAKYA: {
    name: 'Chanakya Administrative Block',
    type: 'Administrative & Institutional Offices',
    occupancy: '~60 occupants',
    exit: 'South Portico Exit (Assembly Area B)',
    tip: 'Central paved walkway leads directly to the main campus gate.',
    icon: '🏢',
  },
  SAROJINI: {
    name: "Sarojini Girls' Hostel",
    type: 'Student Residential Hall & Courtyard',
    occupancy: '~120 residents',
    exit: 'East Hostel Gate (Hostel Grounds)',
    tip: 'Direct east gateway to open-air assembly grounds.',
    icon: '🏠',
  },
};

export const CampusDashboard: React.FC<CampusDashboardProps> = ({
  building,
  scenarios,
  currentScenarioId,
  simulationState,
  activeRoute,
  selectedNodeId,
  selectedEdgeKey,
  cameraPreset,
  overlays,
  isBackendOnline,
  onSelectNode,
  onSelectEdge,
  onSelectScenario,
  onSetCameraPreset,
  onToggleOverlay,
  onRequestRoute,
  onInjectHazard,
  onResetScenario,
  onRefresh,
}) => {
  // Selected origin building: 'VEDANTA', 'CHANAKYA', or 'SAROJINI'
  const [selectedBuilding, setSelectedBuilding] = useState<'VEDANTA' | 'CHANAKYA' | 'SAROJINI'>('VEDANTA');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('astar');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);

  // Panel Open / Close visibility state for unobstructed 3D campus view
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(true);
  const [isRoutePanelOpen, setIsRoutePanelOpen] = useState(true);
  const [showDetailedSteps, setShowDetailedSteps] = useState(false);

  // Camera focus trigger for Reset View, Focus Campus, and Double-Click
  const [focusRequest, setFocusRequest] = useState<CameraFocusRequest | null>(null);

  // Map origin building to primary entrance node ID
  const buildingToNodeMap: Record<string, string> = {
    VEDANTA: 'VEDANTA_ENTRANCE',
    CHANAKYA: 'CHANAKYA_ENTRANCE',
    SAROJINI: 'SAROJINI_ENTRANCE',
  };

  // Sync selectedNodeId with selected building
  const handleSelectBuilding = (buildingKey: 'VEDANTA' | 'CHANAKYA' | 'SAROJINI') => {
    setSelectedBuilding(buildingKey);
    onSelectNode(buildingToNodeMap[buildingKey]);
  };

  // Double click a building focuses the camera smoothly on it
  const handleDoubleClickBuilding = (buildingKey: string) => {
    setSelectedBuilding(buildingKey as any);
    onSelectNode(buildingToNodeMap[buildingKey]);
    setFocusRequest({ type: 'building', buildingKey, id: Date.now() });
  };

  // Reset view to original campus isometric angle and zoom
  const handleResetView = () => {
    setFocusRequest({ type: 'reset', id: Date.now() });
  };

  // Focus camera to frame all three campus buildings
  const handleFocusCampus = () => {
    setFocusRequest({ type: 'campus', id: Date.now() });
  };

  // Sync selectedNodeId changes externally from 3D canvas clicks
  useEffect(() => {
    if (selectedNodeId?.includes('VEDANTA')) {
      setSelectedBuilding('VEDANTA');
    } else if (selectedNodeId?.includes('CHANAKYA')) {
      setSelectedBuilding('CHANAKYA');
    } else if (selectedNodeId?.includes('SAROJINI')) {
      setSelectedBuilding('SAROJINI');
    }
  }, [selectedNodeId]);

  // Calculate evacuation route
  const handleCalculateRoute = async () => {
    const startNode = buildingToNodeMap[selectedBuilding];
    setIsCalculating(true);
    try {
      await onRequestRoute(startNode, selectedAlgorithm);
    } finally {
      setIsCalculating(false);
    }
  };

  // Auto calculate route on initial load once building data is loaded
  useEffect(() => {
    if (building.nodes.length > 0 && !activeRoute) {
      handleCalculateRoute();
    }
  }, [building, selectedBuilding]);

  // Simulate dynamic hazard injection
  const handleSimulateHazard = async () => {
    setIsInjecting(true);
    try {
      const targetId =
        selectedBuilding === 'VEDANTA'
          ? 'PATH_WEST_VEDANTA'
          : selectedBuilding === 'SAROJINI'
          ? 'PATH_EAST_SAROJINI'
          : 'CENTRAL_PLAZA';

      const newHazard: HazardEvent = {
        hazard_id: `dynamic_hazard_${Date.now()}`,
        hazard_type: 'fire',
        location_type: 'node',
        target_id: targetId,
        severity: 85.0,
        spread_rate: 0.1,
        spread_to_neighbors: true,
        is_passable: false,
        active: true,
        description: `Emergency hazard simulated along ${selectedBuilding} evacuation path`,
      };
      await onInjectHazard(newHazard);
      // Auto-recalculate route to demonstrate dynamic obstacle avoidance
      await handleCalculateRoute();
    } finally {
      setIsInjecting(false);
    }
  };

  // Produce clean, human-readable one-sentence route decision explanation
  const getRouteExplanation = (): string => {
    if (!activeRoute) return '';
    if (!activeRoute.found) {
      return 'No safe evacuation route is available. All known exit pathways from this location are currently blocked by hazards.';
    }
    if (activeRoute.decision_reason) {
      return activeRoute.decision_reason;
    }
    const exitName = activeRoute.selected_exit_name || activeRoute.selected_exit || 'designated exit';
    const hasWarnings = activeRoute.warnings && activeRoute.warnings.length > 0;
    if (hasWarnings) {
      return `Route redirected toward ${exitName} because alternative pathways are affected by emergency hazards.`;
    }
    return `Route selected toward ${exitName} via primary campus walkways providing the quickest and safest exit.`;
  };

  const selectedBuildingData = BUILDING_INFO[selectedBuilding];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#DCEBF5] text-slate-800 font-sans antialiased select-none">
      {/* 1. Header with Frosted Glassmorphism and Official DIT University Logo */}
      <header className="h-12 border-b border-white/15 bg-[#0F243A]/90 backdrop-blur-xl px-4 flex items-center justify-between z-20 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          {/* Official DIT University Logo Badge */}
          <div className="h-8.5 px-2 py-0.5 bg-white/95 rounded-lg border border-white/80 shadow-sm flex items-center justify-center shrink-0">
            <img
              src="/logoo.jpg"
              alt="DIT University"
              className="h-6 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-wide text-white drop-shadow-sm">
              DIT University — Emergency Evacuation
            </h1>
            <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-sky-200 border border-white/15 font-medium">
              Foothills Campus
            </span>
          </div>
        </div>

        {/* Mouse controls hint & connection indicator */}
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden md:flex items-center gap-2 text-slate-300 text-[11px] font-medium">
            <span>Left Drag: Rotate</span>
            <span>•</span>
            <span>Right Drag: Pan</span>
            <span>•</span>
            <span>Scroll: Zoom</span>
            <span>•</span>
            <span>Double-Click: Focus</span>
          </div>

          {/* Frosted Glass Toggle Button for Controls Panel */}
          <button
            id="btn-toggle-controls"
            onClick={() => setIsControlPanelOpen(!isControlPanelOpen)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer backdrop-blur-md border shadow-sm ${
              isControlPanelOpen
                ? 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                : 'bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-100 border-emerald-400/40 shadow-emerald-500/20'
            }`}
            title={isControlPanelOpen ? 'Close Controls Panel' : 'Open Controls Panel'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-300" />
            <span>{isControlPanelOpen ? 'Hide Controls' : 'Show Controls'}</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-emerald-200 font-medium">
              {isBackendOnline ? 'Live API' : 'Demo Mode'}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Large 3D Campus View with Surrounding Mountains */}
      <div className="flex-1 relative overflow-hidden">
        {/* Full 3D Canvas */}
        <div className="absolute inset-0">
          <BuildingScene
            building={building}
            simulationState={simulationState}
            activeRoute={activeRoute}
            selectedNodeId={selectedNodeId || buildingToNodeMap[selectedBuilding]}
            selectedEdgeKey={selectedEdgeKey}
            selectedBuildingKey={selectedBuilding}
            cameraPreset={cameraPreset}
            overlays={overlays}
            focusRequest={focusRequest}
            onSelectNode={onSelectNode}
            onSelectEdge={onSelectEdge}
            onSelectBuilding={(bKey) => handleSelectBuilding(bKey as any)}
            onDoubleClickBuilding={handleDoubleClickBuilding}
          />
        </div>

        {/* Floating Frosted Glass Toggle Button to Re-Open Controls Panel when closed */}
        {!isControlPanelOpen && (
          <button
            id="btn-open-controls-floating"
            onClick={() => setIsControlPanelOpen(true)}
            className="absolute top-3 left-3 z-20 flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/85 hover:bg-white/95 active:scale-95 backdrop-blur-xl border border-white/80 shadow-[0_12px_36px_rgba(0,0,0,0.15)] text-slate-800 text-xs font-bold transition-all cursor-pointer group"
            title="Open Controls Panel for making changes"
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-700 group-hover:rotate-12 transition-transform" />
            <span>Open Controls Panel</span>
          </button>
        )}

        {/* 3. Small Control Panel (Floating Left in Frosted Glassmorphism Card) */}
        <div
          className={`absolute top-3 left-3 w-80 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-4 flex flex-col gap-3.5 z-10 text-xs text-slate-800 transition-all duration-300 transform ${
            isControlPanelOpen
              ? 'translate-x-0 opacity-100 pointer-events-auto'
              : '-translate-x-[115%] opacity-0 pointer-events-none'
          }`}
        >
          {/* Header of Control Panel with Glass Close Button */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-700" />
              <span>Evacuation Controls</span>
            </div>
            <button
              id="btn-close-controls-panel"
              onClick={() => setIsControlPanelOpen(false)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/70 hover:bg-white/95 active:scale-95 backdrop-blur-md border border-white/80 text-[11px] text-slate-600 hover:text-slate-900 shadow-xs transition-all cursor-pointer"
              title="Close Controls Panel"
            >
              <span>Hide</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Starting Location Dropdown */}
          <div>
            <label htmlFor="start-location-select" className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-700" />
              Starting Location
            </label>
            <select
              id="start-location-select"
              value={selectedBuilding}
              onChange={(e) => handleSelectBuilding(e.target.value as any)}
              className="w-full bg-white/70 backdrop-blur-md hover:bg-white/95 border border-slate-300/80 rounded-xl px-3 py-2 text-xs text-slate-900 shadow-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all"
            >
              <option value="VEDANTA">Vedanta (Academic Block)</option>
              <option value="CHANAKYA">Chanakya (Administrative Block)</option>
              <option value="SAROJINI">Sarojini Girls' Hostel</option>
            </select>
          </div>

          {/* Algorithm Dropdown */}
          <div>
            <label htmlFor="algorithm-select" className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-700" />
              Algorithm
            </label>
            <select
              id="algorithm-select"
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value as AlgorithmType)}
              className="w-full bg-white/70 backdrop-blur-md hover:bg-white/95 border border-slate-300/80 rounded-xl px-3 py-2 text-xs text-slate-900 shadow-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all"
            >
              <option value="bfs">BFS</option>
              <option value="dijkstra">Dijkstra</option>
              <option value="astar">A*</option>
              <option value="utility">Utility Agent</option>
            </select>
          </div>

          {/* Scenario Dropdown */}
          <div>
            <label htmlFor="scenario-select" className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-700" />
              Scenario
            </label>
            <select
              id="scenario-select"
              value={currentScenarioId}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="w-full bg-white/70 backdrop-blur-md hover:bg-white/95 border border-slate-300/80 rounded-xl px-3 py-2 text-xs text-slate-900 shadow-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all"
            >
              {scenarios.map((scen) => (
                <option key={scen.id} value={scen.id}>
                  {scen.name}
                </option>
              ))}
            </select>
          </div>

          {/* Primary Action Button: Find Safe Route */}
          <button
            id="btn-find-safe-route"
            onClick={handleCalculateRoute}
            disabled={isCalculating}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#16385C] to-[#1E4A78] hover:from-[#1E4A78] hover:to-[#255C94] active:scale-[0.99] border border-white/20 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-60"
          >
            <Navigation className={`w-3.5 h-3.5 text-white ${isCalculating ? 'animate-spin' : ''}`} />
            {isCalculating ? 'Calculating...' : 'Find Safe Route'}
          </button>

          {/* Scenario Action Buttons: Simulate Hazard & Reset Scenario */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-simulate-hazard"
              onClick={handleSimulateHazard}
              disabled={isInjecting}
              className="py-2 px-2 rounded-xl bg-rose-50/80 backdrop-blur-sm hover:bg-rose-100/90 border border-rose-200/80 text-rose-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Inject emergency hazard to test dynamic obstacle avoidance"
            >
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              Simulate Hazard
            </button>

            <button
              id="btn-reset-scenario"
              onClick={onResetScenario}
              className="py-2 px-2 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white border border-slate-200/80 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Reset scenario hazards and layout"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              Reset Scenario
            </button>
          </div>

          {/* Camera View Buttons: Reset View & Focus Campus */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/70">
            <button
              id="btn-reset-view"
              onClick={handleResetView}
              className="py-2 px-2 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white border border-slate-200/80 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Reset camera to default view angle and zoom"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-700" />
              Reset View
            </button>

            <button
              id="btn-focus-campus"
              onClick={handleFocusCampus}
              className="py-2 px-2 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white border border-slate-200/80 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Frame all three campus buildings"
            >
              <Focus className="w-3.5 h-3.5 text-blue-700" />
              Focus Campus
            </button>
          </div>

          {/* 4. Small Building Information Panel (Appears on click / selection) */}
          {selectedBuildingData && (
            <div className="mt-1 pt-2.5 border-t border-slate-200/70 flex flex-col gap-1.5 bg-white/60 backdrop-blur-md p-3 rounded-xl border border-white/80 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{selectedBuildingData.icon}</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {selectedBuildingData.name}
                  </span>
                </div>
                <button
                  onClick={() => handleDoubleClickBuilding(selectedBuilding)}
                  className="text-[10px] text-blue-700 hover:text-blue-900 font-semibold transition-colors cursor-pointer"
                  title="Center camera on this building"
                >
                  Focus
                </button>
              </div>

              <div className="text-[11px] text-slate-600">
                {selectedBuildingData.type}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Occupancy: {selectedBuildingData.occupancy}</span>
              </div>

              <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-200/80 text-[10px] text-emerald-900">
                <span className="font-semibold text-emerald-700">Safe Exit: </span>
                {selectedBuildingData.exit}
              </div>
            </div>
          )}
        </div>

        {/* Floating Frosted Glass Button to Re-Open Route Panel when closed */}
        {!isRoutePanelOpen && activeRoute && (
          <button
            id="btn-open-route-floating"
            onClick={() => setIsRoutePanelOpen(true)}
            className="absolute top-3 right-3 z-20 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/85 hover:bg-white/95 active:scale-95 backdrop-blur-xl border border-white/80 shadow-[0_12px_36px_rgba(0,0,0,0.15)] text-slate-800 text-xs font-bold transition-all cursor-pointer group"
            title="Open Route Details Panel"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-700" />
            <span>Route Details</span>
          </button>
        )}

        {/* 5. Simple Route Information Section (Floating Right in Frosted Glassmorphism Card) */}
        {activeRoute && (
          <div
            className={`absolute top-3 right-3 w-80 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-4 flex flex-col gap-3 z-10 text-xs text-slate-800 transition-all duration-300 transform ${
              isRoutePanelOpen
                ? 'translate-x-0 opacity-100 pointer-events-auto'
                : 'translate-x-[115%] opacity-0 pointer-events-none'
            }`}
          >
            {/* Header: Status, Algorithm & Glass Close Button */}
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <div className="flex items-center gap-1.5">
                {activeRoute.found ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="font-bold text-xs text-slate-900">
                  {activeRoute.found ? 'Safe Evacuation Route' : 'No Safe Route'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-mono font-bold uppercase">
                  {activeRoute.algorithm}
                </span>
                <button
                  id="btn-close-route-panel"
                  onClick={() => setIsRoutePanelOpen(false)}
                  className="p-1 rounded-lg bg-white/70 hover:bg-white/95 active:scale-95 backdrop-blur-md border border-white/80 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                  title="Close Route Details Panel"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {activeRoute.found ? (
              <>
                {/* Starting Location & Destination Exit */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white/70 backdrop-blur-md border border-white/80 shadow-xs">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-blue-700" />
                      Start
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                      {selectedBuildingData.name.split(' ')[0]}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/70 backdrop-blur-md border border-white/80 shadow-xs">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      Exit
                    </div>
                    <div className="text-xs font-bold text-emerald-800 mt-0.5 truncate">
                      {activeRoute.selected_exit_name || activeRoute.selected_exit || 'Exit Gate'}
                    </div>
                  </div>
                </div>

                {/* Estimated Distance & Travel Time */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white/70 backdrop-blur-md border border-white/80 shadow-xs">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-blue-700" />
                      Travel Time
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {activeRoute.estimated_travel_time.toFixed(1)}s
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/70 backdrop-blur-md border border-white/80 shadow-xs">
                    <div className="text-[10px] text-slate-500 font-medium">Total Distance</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {activeRoute.total_distance.toFixed(1)}m
                    </div>
                  </div>
                </div>

                {/* Ordered Route Locations & Step Instructions */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      {showDetailedSteps ? 'Step-by-Step Instructions' : 'Route Waypoints'}
                    </div>
                    {activeRoute.instructions && activeRoute.instructions.length > 0 && (
                      <button
                        id="btn-toggle-route-steps"
                        onClick={() => setShowDetailedSteps(!showDetailedSteps)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50/90 hover:bg-blue-100 text-blue-700 font-medium border border-blue-200/60 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <ListOrdered className="w-3 h-3" />
                        <span>{showDetailedSteps ? 'Chips' : 'Steps'}</span>
                      </button>
                    )}
                  </div>

                  {!showDetailedSteps ? (
                    <div className="flex flex-wrap items-center gap-1 p-2 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 max-h-24 overflow-y-auto">
                      {activeRoute.path.map((nodeId, idx) => (
                        <React.Fragment key={`wp-${idx}`}>
                          <span
                            onClick={() => onSelectNode(nodeId)}
                            className={`text-[10px] px-2 py-0.5 rounded-lg cursor-pointer transition-all shadow-xs ${
                              idx === 0
                                ? 'bg-blue-100 text-blue-900 font-bold border border-blue-300'
                                : idx === activeRoute.path.length - 1
                                ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {nodeId.replace(/_/g, ' ')}
                          </span>
                          {idx < activeRoute.path.length - 1 && (
                            <ArrowRight className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 p-1.5 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 max-h-32 overflow-y-auto">
                      {activeRoute.instructions?.map((step) => (
                        <div
                          key={`step-${step.step_number}`}
                          className="flex items-start gap-1.5 p-1.5 rounded-lg bg-white/90 border border-slate-200/70 text-[10px]"
                        >
                          <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white font-bold text-[8.5px] flex items-center justify-center shrink-0 mt-0.5">
                            {step.step_number}
                          </span>
                          <div className="flex-1 leading-tight">
                            <span className="text-slate-800 font-medium">{step.instruction}</span>
                            {step.hazard_warning && (
                              <div className="text-[9px] text-amber-700 font-medium mt-0.5">
                                {step.hazard_warning}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Plain English One-Sentence Explanation */}
                <div className="p-3 rounded-xl bg-blue-50/80 backdrop-blur-md border border-blue-200/80 shadow-xs">
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-950 uppercase mb-1">
                    <Info className="w-3 h-3 text-blue-700" />
                    Decision Explanation
                  </div>
                  <p className="text-[11px] text-blue-950 leading-relaxed font-normal">
                    {getRouteExplanation()}
                  </p>
                </div>
              </>
            ) : (
              <div className="p-3.5 rounded-xl bg-rose-50/90 backdrop-blur-md border border-rose-300 text-rose-800 text-xs shadow-xs">
                {getRouteExplanation()}
              </div>
            )}
          </div>
        )}

        {/* 6. Simple Bottom Campus Legend (Frosted Glassmorphism Pill) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl px-5 py-2 rounded-full border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-center gap-4 text-xs z-10 select-none text-slate-700 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#9E3D2B] inline-block shadow-xs" />
            <span className="text-[11px] text-slate-800">Vedanta (Red Brick)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#943827] inline-block shadow-xs" />
            <span className="text-[11px] text-slate-800">Chanakya (Red Brick)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#9B4532] inline-block shadow-xs" />
            <span className="text-[11px] text-slate-800">Sarojini (Terracotta)</span>
          </div>
          <div className="w-px h-3.5 bg-slate-300/80" />
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 shadow-xs" />
            <span className="text-[11px] text-emerald-800">Exit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600 shadow-xs" />
            <span className="text-[11px] text-rose-800">Hazard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 rounded bg-[#1D4ED8] shadow-xs" />
            <span className="text-[11px] text-blue-800 font-semibold">Safe Route</span>
          </div>
        </div>
      </div>
    </div>
  );
};
