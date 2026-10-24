import React from 'react';
import { RouteStepInstruction } from '../../types';
import { MapPin, ArrowDown, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TurnByTurnListProps {
  instructions: RouteStepInstruction[];
}

export const TurnByTurnList: React.FC<TurnByTurnListProps> = ({ instructions }) => {
  if (!instructions || instructions.length === 0) {
    return (
      <div className="p-4 text-center text-xs font-mono text-content-muted">
        No route guidance instructions available.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {instructions.map((step, idx) => {
        const isStart = idx === 0;
        const isEnd = idx === instructions.length - 1;

        return (
          <div
            key={step.step_number}
            className={`p-2.5 rounded border text-xs font-mono transition-all ${
              isEnd
                ? 'bg-emergency-green/10 border-emergency-green/30 text-content-primary'
                : isStart
                ? 'bg-brand-deep/70 border-brand-sky/30 text-content-primary'
                : 'bg-surface-elevated/60 border-surface-border text-content-secondary'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {/* Step Icon */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  isEnd
                    ? 'bg-emergency-green text-surface-main'
                    : isStart
                    ? 'bg-brand-sky text-surface-main'
                    : 'bg-surface-border text-brand-ice'
                }`}
              >
                {isEnd ? <ShieldCheck className="w-3.5 h-3.5" /> : step.step_number}
              </div>

              {/* Instruction Text & Metadata */}
              <div className="flex-1">
                <p className="font-semibold text-content-primary text-xs leading-snug">
                  {step.instruction}
                </p>

                <div className="flex items-center gap-2 mt-1 text-[10px] text-content-muted">
                  <span>{step.location_name}</span>
                  {step.edge_distance > 0 && (
                    <>
                      <span>•</span>
                      <span>{step.edge_distance.toFixed(1)}m</span>
                      <span>•</span>
                      <span>~{step.edge_time.toFixed(1)}s</span>
                    </>
                  )}
                </div>

                {/* Step Warning if present */}
                {step.hazard_warning && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emergency-amber bg-emergency-amber/10 border border-emergency-amber/20 px-1.5 py-0.5 rounded">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>{step.hazard_warning}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
