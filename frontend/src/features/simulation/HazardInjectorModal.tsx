import React, { useState } from 'react';
import { Flame, X, AlertTriangle } from 'lucide-react';
import { HazardType, HazardEvent, BuildingGraphModel } from '../../types';

interface HazardInjectorModalProps {
  isOpen: boolean;
  building: BuildingGraphModel;
  onClose: () => void;
  onInject: (hazard: HazardEvent) => Promise<void>;
}

export const HazardInjectorModal: React.FC<HazardInjectorModalProps> = ({
  isOpen,
  building,
  onClose,
  onInject,
}) => {
  const [hazardType, setHazardType] = useState<HazardType>('fire');
  const [targetId, setTargetId] = useState<string>('CORRIDOR_G_CENTRAL');
  const [severity, setSeverity] = useState<number>(85.0);
  const [spreadToNeighbors, setSpreadToNeighbors] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const hazard: HazardEvent = {
        hazard_id: `dynamic_${hazardType}_${Date.now()}`,
        hazard_type: hazardType,
        location_type: 'node',
        target_id: targetId,
        severity,
        spread_rate: 5.0,
        spread_to_neighbors: spreadToNeighbors,
        is_passable: severity < 75.0,
        active: true,
        description: `Dynamic simulated ${hazardType} event injected at ${targetId}`,
      };
      await onInject(hazard);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface-secondary border border-surface-border rounded-lg max-w-md w-full p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-emergency-red" />
            <h3 className="text-sm font-mono font-bold uppercase text-brand-ice">
              Trigger Emergency Hazard Event
            </h3>
          </div>
          <button onClick={onClose} className="text-content-muted hover:text-brand-ice">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {/* Hazard Type */}
          <div>
            <label className="text-content-secondary uppercase block mb-1.5">Hazard Type:</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'fire', label: '🔥 Fire' },
                { id: 'smoke', label: '💨 Smoke' },
                { id: 'flood', label: '🌊 Flood' },
                { id: 'structural_blockage', label: '🚧 Blockage' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setHazardType(t.id as HazardType)}
                  className={`p-2 rounded border text-left transition-all ${
                    hazardType === t.id
                      ? 'bg-brand-deep text-brand-ice border-brand-sky font-bold'
                      : 'bg-surface-elevated text-content-secondary border-surface-border'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location Selection */}
          <div>
            <label className="text-content-secondary uppercase block mb-1">Target Location:</label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full bg-surface-elevated text-brand-ice p-2 rounded border border-surface-border focus:outline-none"
            >
              {building.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.id} • F{n.floor})
                </option>
              ))}
            </select>
          </div>

          {/* Severity Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-content-secondary uppercase">Severity Level:</label>
              <span className={`font-bold ${severity >= 75 ? 'text-emergency-red' : 'text-emergency-amber'}`}>
                {severity}% {severity >= 75 ? '(IMPASSABLE)' : '(Passable)'}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="w-full cursor-pointer accent-emergency-red"
            />
          </div>

          {/* Smoke Diffusion Checkbox */}
          <div className="flex items-center gap-2 bg-surface-elevated p-2 rounded border border-surface-border">
            <input
              type="checkbox"
              id="spread"
              checked={spreadToNeighbors}
              onChange={(e) => setSpreadToNeighbors(e.target.checked)}
              className="cursor-pointer"
            />
            <label htmlFor="spread" className="text-content-secondary cursor-pointer">
              Diffuse smoke to adjacent hallway connections
            </label>
          </div>

          {/* Warning Message */}
          <div className="p-2.5 bg-emergency-red/10 border border-emergency-red/30 rounded text-[11px] text-emergency-red flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Injecting this hazard will immediately test dynamic multi-agent replanning for any occupants whose routes traverse this area.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-content-secondary hover:text-brand-ice"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-emergency-red hover:bg-emergency-red/80 text-white font-bold rounded shadow-glow-red transition-all"
            >
              {isSubmitting ? 'Injecting...' : 'Deploy Hazard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
