import React from 'react';
import { BuildingGraphModel, SimulationStateResponse, RouteResponse } from '../../types';

interface Canvas2DFallbackProps {
  building: BuildingGraphModel;
  simulationState: SimulationStateResponse;
  activeRoute: RouteResponse | null;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

export const Canvas2DFallback: React.FC<Canvas2DFallbackProps> = ({
  building,
  activeRoute,
  selectedNodeId,
  onSelectNode,
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-surface-main p-6 overflow-auto">
      <div className="max-w-4xl w-full bg-surface-secondary border border-surface-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4 border-b border-surface-border pb-3">
          <div>
            <h3 className="text-sm font-semibold text-brand-ice uppercase tracking-wider">
              2D Schematic Architectural Floor Plan
            </h3>
            <p className="text-xs text-content-secondary">
              High-contrast vector map representation of building locations and connections
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-brand-deep text-brand-ice rounded">
            2D CAD View
          </span>
        </div>

        {/* SVG Schematic Blueprint */}
        <div className="relative w-full aspect-[16/9] bg-surface-main border border-surface-border/50 rounded overflow-hidden p-4">
          <svg className="w-full h-full" viewBox="-20 0 90 40">
            {/* Draw corridor connections */}
            {building.edges.map((edge) => {
              const u = building.nodes.find((n) => n.id === edge.source);
              const v = building.nodes.find((n) => n.id === edge.target);
              if (!u || !v) return null;

              const isRouteSegment =
                activeRoute?.path &&
                activeRoute.path.includes(u.id) &&
                activeRoute.path.includes(v.id);

              return (
                <line
                  key={`${edge.source}-${edge.target}`}
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  stroke={isRouteSegment ? '#88BDF2' : edge.is_blocked ? '#FF5B61' : '#34495D'}
                  strokeWidth={isRouteSegment ? 1.4 : 0.8}
                  strokeDasharray={edge.is_blocked ? '1 1' : undefined}
                />
              );
            })}

            {/* Draw node waypoints */}
            {building.nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              let fill = '#384959';
              if (node.is_exit) fill = '#55C99A';
              else if (node.type === 'stairs') fill = '#F4B860';
              else if (node.type === 'ramp') fill = '#88BDF2';
              if (node.is_blocked) fill = '#FF5B61';

              return (
                <g
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  className="cursor-pointer transition-transform hover:scale-125"
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 2.5 : 1.8}
                    fill={fill}
                    stroke={isSelected ? '#BDDDFC' : '#101923'}
                    strokeWidth={0.6}
                  />
                  <text
                    x={node.x}
                    y={node.y - 2.6}
                    textAnchor="middle"
                    className="text-[2.2px] font-mono fill-content-secondary"
                  >
                    {node.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
