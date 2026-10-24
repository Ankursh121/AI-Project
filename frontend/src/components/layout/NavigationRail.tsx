import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Compass,
  Activity,
  GitCompare,
  FileSpreadsheet,
} from 'lucide-react';
import { ViewMode } from '../../types';

interface NavigationRailProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
}

interface NavItem {
  id: ViewMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, tag: 'F1' },
  { id: 'building', label: 'Building 3D', icon: Layers, tag: 'F2' },
  { id: 'routing', label: 'Route Planner', icon: Compass, tag: 'F3' },
  { id: 'simulation', label: 'Simulation', icon: Activity, tag: 'F4' },
  { id: 'algorithms', label: 'Algorithms Lab', icon: GitCompare, tag: 'F5' },
  { id: 'reports', label: 'Evacuation Report', icon: FileSpreadsheet, tag: 'F6' },
];

export const NavigationRail: React.FC<NavigationRailProps> = ({ currentView, onSelectView }) => {
  return (
    <aside className="w-16 bg-surface-secondary border-r border-surface-border flex flex-col items-center py-3 select-none z-20 justify-between">
      <div className="flex flex-col items-center gap-2 w-full px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center transition-all group relative ${
                isActive
                  ? 'bg-surface-elevated text-brand-sky border border-brand-sky/40 shadow-glow-sky'
                  : 'text-content-secondary hover:text-brand-ice hover:bg-surface-elevated/50'
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-mono tracking-tighter opacity-80">{item.tag}</span>

              {/* Tooltip on hover */}
              <div className="absolute left-16 px-2 py-1 bg-surface-elevated text-brand-ice text-xs rounded border border-surface-border shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {item.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* College Project Badge */}
      <div className="text-[9px] font-mono text-content-muted text-center px-1">
        B.Tech CSE
      </div>
    </aside>
  );
};
