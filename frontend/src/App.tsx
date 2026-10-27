import React, { useMemo } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { CampusDashboard } from './components/CampusDashboard';
import { AlgorithmLaboratory } from './features/algorithms/AlgorithmLaboratory';
import { EvacuationReports } from './features/reports/EvacuationReports';

export const App: React.FC = () => {
  const sim = useSimulation();

  // Read view parameter from URL if provided (e.g. ?view=algorithms or ?view=reports)
  const currentView = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view');
  }, []);

  if (currentView === 'algorithms') {
    return (
      <div className="h-screen w-screen flex flex-col bg-slate-900 text-slate-100 font-sans">
        <AlgorithmLaboratory building={sim.building} />
      </div>
    );
  }

  if (currentView === 'reports') {
    return (
      <div className="h-screen w-screen flex flex-col bg-slate-900 text-slate-100 font-sans">
        <EvacuationReports />
      </div>
    );
  }

  return (
    <CampusDashboard
      building={sim.building}
      scenarios={sim.scenarios}
      currentScenarioId={sim.currentScenarioId}
      simulationState={sim.simulationState}
      activeRoute={sim.activeRoute}
      selectedNodeId={sim.selectedNodeId}
      selectedEdgeKey={sim.selectedEdgeKey}
      cameraPreset={sim.cameraPreset}
      overlays={sim.overlays}
      isBackendOnline={sim.isBackendOnline}
      onSelectNode={sim.setSelectedNodeId}
      onSelectEdge={sim.setSelectedEdgeKey}
      onSelectScenario={sim.selectScenario}
      onSetCameraPreset={sim.setCameraPreset}
      onToggleOverlay={sim.toggleOverlay}
      onRequestRoute={(startNode, algo) =>
        sim.requestRoute({ start_node: startNode, algorithm: algo })
      }
      onInjectHazard={sim.injectHazardEvent}
      onResetScenario={sim.resetCurrentSimulation}
      onRefresh={sim.refreshAll}
    />
  );
};

