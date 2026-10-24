/**
 * Number and string formatting utilities for telemetry and charts.
 */

export function formatSeconds(sec: number): string {
  if (isNaN(sec) || sec === null || sec === undefined) return '0.0s';
  return `${sec.toFixed(1)}s`;
}

export function formatMeters(m: number): string {
  if (isNaN(m) || m === null || m === undefined) return '0.0m';
  return `${m.toFixed(1)}m`;
}

export function formatPercent(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0%';
  const pct = Math.round(val * 100);
  return `${pct}%`;
}

export function getHazardColorClass(level: number): string {
  if (level >= 75) return 'text-emergency-red bg-emergency-red/10 border-emergency-red/30';
  if (level >= 40) return 'text-emergency-amber bg-emergency-amber/10 border-emergency-amber/30';
  if (level > 0) return 'text-brand-sky bg-brand-sky/10 border-brand-sky/30';
  return 'text-emergency-green bg-emergency-green/10 border-emergency-green/30';
}
