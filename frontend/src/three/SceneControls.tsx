import React from 'react';
import {
  Camera,
  Layers,
  Tag,
  Flame,
  Route as RouteIcon,
  Grid as GridIcon,
  RotateCcw,
} from 'lucide-react';
import { CameraPreset, OverlayToggles } from '../types';

interface SceneControlsProps {
  cameraPreset: CameraPreset;
  isolatedFloor: number | null;
  overlays: OverlayToggles;
  floors: number[];
  onSetCameraPreset: (preset: CameraPreset) => void;
  onSetIsolatedFloor: (floor: number | null) => void;
  onToggleOverlay: (key: keyof OverlayToggles) => void;
}

export const SceneControls: React.FC<SceneControlsProps> = ({
  cameraPreset,
  isolatedFloor,
  overlays,
  floors,
  onSetCameraPreset,
  onSetIsolatedFloor,
  onToggleOverlay,
}) => {
  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 select-none pointer-events-auto">
      {/* Camera View Switcher */}
      <div className="bg-surface-secondary/90 border border-surface-border rounded-lg p-1.5 flex items-center gap-1 shadow-md backdrop-blur-sm">
        <span className="text-[10px] font-mono text-content-muted px-1.5 flex items-center gap-1">
          <Camera className="w-3 h-3 text-brand-sky" /> VIEW:
        </span>
        {(['isometric', 'top', 'front'] as CameraPreset[]).map((p) => (
          <button
            key={p}
            onClick={() => onSetCameraPreset(p)}
            className={`px-2 py-0.5 text-xs font-mono rounded capitalize transition-colors ${
              cameraPreset === p
                ? 'bg-brand-deep text-brand-ice font-semibold border border-brand-sky/40'
                : 'text-content-secondary hover:text-brand-ice hover:bg-surface-elevated'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Floor Isolation Filter */}
      <div className="bg-surface-secondary/90 border border-surface-border rounded-lg p-1.5 flex items-center gap-1 shadow-md backdrop-blur-sm">
        <span className="text-[10px] font-mono text-content-muted px-1.5 flex items-center gap-1">
          <Layers className="w-3 h-3 text-brand-sky" /> FLOOR:
        </span>
        <button
          onClick={() => onSetIsolatedFloor(null)}
          className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
            isolatedFloor === null
              ? 'bg-brand-deep text-brand-ice font-semibold border border-brand-sky/40'
              : 'text-content-secondary hover:text-brand-ice hover:bg-surface-elevated'
          }`}
        >
          All
        </button>
        {floors.map((f) => (
          <button
            key={f}
            onClick={() => onSetIsolatedFloor(f)}
            className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
              isolatedFloor === f
                ? 'bg-brand-deep text-brand-ice font-semibold border border-brand-sky/40'
                : 'text-content-secondary hover:text-brand-ice hover:bg-surface-elevated'
            }`}
          >
            F{f}
          </button>
        ))}
      </div>

      {/* Overlay Toggles */}
      <div className="bg-surface-secondary/90 border border-surface-border rounded-lg p-1.5 flex items-center gap-1 shadow-md backdrop-blur-sm">
        <button
          onClick={() => onToggleOverlay('labels')}
          className={`p-1.5 rounded transition-colors ${
            overlays.labels ? 'bg-brand-deep text-brand-sky border border-brand-sky/40' : 'text-content-muted hover:text-brand-ice'
          }`}
          title="Toggle Room Labels"
        >
          <Tag className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onToggleOverlay('hazards')}
          className={`p-1.5 rounded transition-colors ${
            overlays.hazards ? 'bg-brand-deep text-emergency-red border border-emergency-red/40' : 'text-content-muted hover:text-brand-ice'
          }`}
          title="Toggle Hazards"
        >
          <Flame className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onToggleOverlay('routes')}
          className={`p-1.5 rounded transition-colors ${
            overlays.routes ? 'bg-brand-deep text-brand-sky border border-brand-sky/40' : 'text-content-muted hover:text-brand-ice'
          }`}
          title="Toggle Safe Routes"
        >
          <RouteIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onToggleOverlay('grid')}
          className={`p-1.5 rounded transition-colors ${
            overlays.grid ? 'bg-brand-deep text-brand-ice border border-brand-ice/40' : 'text-content-muted hover:text-brand-ice'
          }`}
          title="Toggle Grid Ground"
        >
          <GridIcon className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-4 bg-surface-border mx-0.5" />
        <button
          onClick={() => onSetCameraPreset('isometric')}
          className="p-1.5 text-content-secondary hover:text-brand-ice hover:bg-surface-elevated rounded transition-colors"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
