import React from 'react';
import {
  MapPin,
  Shield,
  AlertTriangle,
  Users,
  Compass,
  ArrowRight,
  Accessibility,
} from 'lucide-react';
import { NodeModel, EdgeModel } from '../../types';

interface NodeInspectorProps {
  node: NodeModel | null;
  edge: EdgeModel | null;
  connectedEdges: EdgeModel[];
  onCalculateRouteFromNode?: (nodeId: string) => void;
  onClose?: () => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  node,
  connectedEdges,
  onCalculateRouteFromNode,
}) => {
  if (!node) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-content-muted">
        <MapPin className="w-8 h-8 text-surface-border mb-2" />
        <p className="text-xs font-mono">Select a room, corridor, or exit in the 3D model to inspect telemetry</p>
      </div>
    );
  }

  const isLethal = node.hazard_level >= 75 || node.is_blocked;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {/* Node Header */}
      <div className="border-b border-surface-border pb-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-deep text-brand-ice border border-brand-sky/30">
            {node.type.toUpperCase()} • FLOOR {node.floor}
          </span>
          {node.is_exit ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emergency-green/20 text-emergency-green font-bold">
              SAFE EXIT
            </span>
          ) : isLethal ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emergency-red/20 text-emergency-red font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> IMPASSABLE
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-content-secondary">
              OPERATIONAL
            </span>
          )}
        </div>
        <h3 className="text-base font-bold text-content-primary mt-1.5">{node.name}</h3>
        <span className="text-xs font-mono text-brand-sky">{node.id}</span>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-surface-elevated p-2 rounded border border-surface-border">
          <span className="text-[10px] text-content-muted flex items-center gap-1">
            <Users className="w-3 h-3 text-brand-sky" /> OCCUPANCY
          </span>
          <span className="text-sm font-bold text-content-primary mt-0.5 block">
            {node.current_occupancy} / {node.capacity}
          </span>
        </div>

        <div className="bg-surface-elevated p-2 rounded border border-surface-border">
          <span className="text-[10px] text-content-muted flex items-center gap-1">
            <Accessibility className="w-3 h-3 text-brand-sky" /> ACCESSIBLE
          </span>
          <span className={`text-sm font-bold mt-0.5 block ${node.accessible ? 'text-emergency-green' : 'text-emergency-amber'}`}>
            {node.accessible ? 'Step-Free' : 'Stairs Only'}
          </span>
        </div>
      </div>

      {/* Hazard Gauge */}
      <div className="bg-surface-elevated p-3 rounded border border-surface-border">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <span className="text-content-secondary flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emergency-red" /> Hazard Level
          </span>
          <span className={`font-bold ${isLethal ? 'text-emergency-red' : node.hazard_level > 20 ? 'text-emergency-amber' : 'text-emergency-green'}`}>
            {node.hazard_level.toFixed(1)} / 100
          </span>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-2 bg-surface-main rounded-full overflow-hidden border border-surface-border/50">
          <div
            className={`h-full transition-all duration-300 ${
              isLethal ? 'bg-emergency-red' : node.hazard_level > 20 ? 'bg-emergency-amber' : 'bg-emergency-green'
            }`}
            style={{ width: `${Math.min(100, Math.max(5, node.hazard_level))}%` }}
          />
        </div>
        <p className="text-[10px] text-content-muted mt-1.5">
          {node.hazard_level >= 75
            ? 'Critical hazard threshold exceeded. Route is impassable.'
            : node.hazard_level > 20
            ? 'Elevated hazard detected. Corridors passable with travel penalty.'
            : 'Nominal baseline condition. Safe for pedestrian navigation.'}
        </p>
      </div>

      {/* Connected Passageways */}
      <div>
        <h4 className="text-xs font-mono text-content-secondary uppercase mb-2">
          Connected Passageways ({connectedEdges.length})
        </h4>
        <div className="space-y-1.5">
          {connectedEdges.map((e, idx) => {
            const neighborId = e.source === node.id ? e.target : e.source;
            return (
              <div
                key={idx}
                className="bg-surface-elevated p-2 rounded border border-surface-border flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="font-semibold text-brand-ice">{neighborId}</span>
                  <span className="text-[10px] text-content-muted block">
                    {e.distance.toFixed(1)}m • {e.base_travel_time.toFixed(1)}s
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-main text-content-secondary border border-surface-border">
                    {Math.round(e.crowd_density * 100)}% flow
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Button: Route From Here */}
      {!node.is_exit && (
        <button
          onClick={() => onCalculateRouteFromNode?.(node.id)}
          className="w-full mt-auto py-2 bg-brand-deep hover:bg-brand-deep/80 text-brand-ice font-mono text-xs font-semibold rounded border border-brand-sky/40 flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Compass className="w-3.5 h-3.5 text-brand-sky" /> Calculate Escape Route <ArrowRight className="w-3.5 h-3.5 text-brand-sky" />
        </button>
      )}
    </div>
  );
};
