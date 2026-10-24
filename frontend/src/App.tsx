import React from 'react';
import { useSimulation } from './hooks/useSimulation';
import { CampusDashboard } from './components/CampusDashboard';

export const App: React.FC = () => {
  const sim = useSimulation();

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
