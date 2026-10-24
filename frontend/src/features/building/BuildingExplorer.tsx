import React, { useState } from 'react';
import { Search, Layers, Compass, Filter } from 'lucide-react';
import {
  BuildingGraphModel,
  SimulationStateResponse,
  RouteResponse,
  CameraPreset,
  OverlayToggles,
} from '../../types';
import { BuildingScene } from '../../three/BuildingScene';
import { SceneControls } from '../../three/SceneControls';
import { NodeInspector } from './NodeInspector';

interface BuildingExplorerProps {
  building: BuildingGraphModel;
  simulationState: SimulationStateResponse;
  activeRoute: RouteResponse | null;
  selectedNodeId: string | null;
  selectedEdgeKey: string | null;
  isolatedFloor: number | null;
  cameraPreset: CameraPreset;
  overlays: OverlayToggles;
  onSelectNode: (id: string) => void;
  onSelectEdge?: (edgeKey: string) => void;
  onSetCameraPreset: (p: CameraPreset) => void;
  onSetIsolatedFloor: (f: number | null) => void;
  onToggleOverlay: (k: keyof OverlayToggles) => void;
  onNavigateToRoutingWithNode?: (nodeId: string) => void;
}

export const BuildingExplorer: React.FC<BuildingExplorerProps> = ({
  building,
  simulationState,
  activeRoute,
  selectedNodeId,
  selectedEdgeKey,
  isolatedFloor,
  cameraPreset,
  overlays,
  onSelectNode,
  onSelectEdge,
  onSetCameraPreset,
  onSetIsolatedFloor,
  onToggleOverlay,
  onNavigateToRoutingWithNode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const selectedNode = building.nodes.find((n) => n.id === selectedNodeId) || null;
  const connectedEdges = selectedNode
    ? building.edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  // Filter nodes for search and category
  const filteredNodes = building.nodes.filter((node) => {
    const matchesSearch =
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFloor = isolatedFloor === null || node.floor === isolatedFloor;
    const matchesType =
      filterType === 'all'
        ? true
        : filterType === 'exit'
        ? node.is_exit
        : filterType === 'stairs'
        ? node.type === 'stairs' || node.type === 'ramp'
        : filterType === 'hazard'
        ? node.hazard_level > 0 || node.is_blocked
        : node.type === filterType;

    return matchesSearch && matchesFloor && matchesType;
  });

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-surface-main">
      {/* Left Navigation & Search Panel */}
      <div className="w-full lg:w-72 bg-surface-secondary border-r border-surface-border flex flex-col h-full z-10">
        {/* Search Input */}
        <div className="p-3 border-b border-surface-border">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-content-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search rooms, labs, exits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-main text-xs text-brand-ice pl-8 pr-3 py-1.5 rounded border border-surface-border focus:border-brand-sky focus:outline-none font-mono"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1 mt-2.5 overflow-x-auto text-[10px] font-mono">
            {['all', 'exit', 'room', 'stairs', 'hazard'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2 py-0.5 rounded capitalize transition-colors ${
                  filterType === type
                    ? 'bg-brand-deep text-brand-ice font-semibold border border-brand-sky/40'
                    : 'text-content-secondary hover:text-brand-ice hover:bg-surface-elevated'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Node Location List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <button
                key={node.id}
                onClick={() => onSelectNode(node.id)}
                className={`w-full text-left p-2 rounded border transition-all text-xs font-mono flex items-center justify-between ${
                  isSelected
                    ? 'bg-brand-deep/80 border-brand-sky text-brand-ice shadow-sm'
                    : 'bg-surface-elevated/40 border-surface-border hover:border-brand-sky/30 text-content-secondary'
                }`}
              >
                <div className="truncate pr-2">
                  <span className="font-semibold text-content-primary block truncate">{node.name}</span>
                  <span className="text-[10px] text-content-muted">{node.id} • F{node.floor}</span>
                </div>
                {node.is_exit ? (
                  <span className="text-[9px] px-1.5 py-0.5 bg-emergency-green/20 text-emergency-green rounded font-bold">
                    EXIT
                  </span>
                ) : node.is_blocked || node.hazard_level >= 75 ? (
                  <span className="text-[9px] px-1.5 py-0.5 bg-emergency-red/20 text-emergency-red rounded font-bold">
                    BLOCKED
                  </span>
                ) : node.hazard_level > 20 ? (
                  <span className="text-[9px] px-1.5 py-0.5 bg-emergency-amber/20 text-emergency-amber rounded font-bold">
                    HAZARD
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Center 3D Digital Twin Scene */}
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
          onSelectEdge={onSelectEdge}
        />
      </div>

      {/* Right Telemetry Inspector Panel */}
      <div className="w-full lg:w-80 bg-surface-secondary border-t lg:border-t-0 lg:border-l border-surface-border flex flex-col h-full z-10">
        <NodeInspector
          node={selectedNode}
          edge={null}
          connectedEdges={connectedEdges}
          onCalculateRouteFromNode={onNavigateToRoutingWithNode}
        />
      </div>
    </div>
  );
};
