import React from 'react';
import { ShieldAlert, RefreshCw, Server, AlertCircle, Compass } from 'lucide-react';
import { ScenarioModel } from '../../types';

interface HeaderProps {
  scenarios: ScenarioModel[];
  currentScenarioId: string;
  isBackendOnline: boolean;
  onSelectScenario: (id: string) => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  scenarios,
  currentScenarioId,
  isBackendOnline,
  onSelectScenario,
  onRefresh,
}) => {
  return (
    <header className="h-14 bg-surface-secondary/95 border-b border-surface-border px-4 flex items-center justify-between z-30 select-none backdrop-blur-md">
      {/* Brand & Building Title */}
      <div className="flex items-center gap-3">
        {/* Custom Geometric Floorplan & Exit Logo */}
        <div className="w-8 h-8 rounded bg-brand-deep/80 border border-brand-sky/40 flex items-center justify-center text-brand-sky shadow-sm">
          <ShieldAlert className="w-4 h-4 text-brand-sky" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-bold tracking-wider text-brand-ice uppercase font-mono">
              AEGIS-EVAC
            </h1>
            <span className="text-[10px] text-content-muted font-mono">|</span>
            <span className="text-xs font-semibold text-content-primary">
              Emergency Evacuation Planning System
            </span>
          </div>
          <p className="text-[10px] text-content-secondary font-mono tracking-tight">
            Dr. A.P.J. Abdul Kalam Block • 3D Digital Twin
          </p>
        </div>
      </div>

      {/* Scenario Selector & Server Status */}
      <div className="flex items-center gap-3">
        {/* Scenario Switcher */}
        <div className="flex items-center gap-2 bg-surface-main/80 border border-surface-border rounded px-2.5 py-1">
          <Compass className="w-3.5 h-3.5 text-brand-sky" />
          <span className="text-[11px] font-mono text-content-secondary">SCENARIO:</span>
          <select
            value={currentScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-transparent text-xs text-brand-ice font-medium focus:outline-none cursor-pointer pr-1"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id} className="bg-surface-secondary text-content-primary">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Backend Online / Mock Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border ${
            isBackendOnline
              ? 'bg-emergency-green/10 text-emergency-green border-emergency-green/30'
              : 'bg-emergency-amber/10 text-emergency-amber border-emergency-amber/30'
          }`}
          title={isBackendOnline ? 'Connected to FastAPI backend at :8000' : 'Backend offline. Operating in high-fidelity mock mode.'}
        >
          {isBackendOnline ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emergency-green animate-pulse" />
              <Server className="w-3 h-3" />
              <span>LIVE API</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3" />
              <span>DEMO MODE</span>
            </>
          )}
        </div>

        {/* Reload Data Button */}
        <button
          onClick={onRefresh}
          className="p-1.5 text-content-secondary hover:text-brand-ice hover:bg-surface-elevated rounded border border-surface-border/60 transition-colors"
          title="Reload building state"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
