import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BuildingGraphModel,
  ScenarioModel,
  SimulationStateResponse,
  RouteResponse,
  OverlayToggles,
  CameraPreset,
  HazardEvent,
  RouteRequest,
} from '../types';
import { api } from '../services/api';
import { MOCK_BUILDING, MOCK_SCENARIOS, MOCK_SIMULATION_STATE } from '../services/mockData';

export function useSimulation() {
  const [building, setBuilding] = useState<BuildingGraphModel>(MOCK_BUILDING);
  const [scenarios, setScenarios] = useState<ScenarioModel[]>(MOCK_SCENARIOS);
  const [currentScenarioId, setCurrentScenarioId] = useState<string>('scenario_a_normal');
  const [simulationState, setSimulationState] = useState<SimulationStateResponse>(MOCK_SIMULATION_STATE);
  
  // Selection & 3D state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeKey, setSelectedEdgeKey] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteResponse | null>(null);
  const [isolatedFloor, setIsolatedFloor] = useState<number | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  
  // Display Overlays
  const [overlays, setOverlays] = useState<OverlayToggles>({
    hazards: true,
    crowd: true,
    routes: true,
    labels: true,
    grid: true,
  });

  // Controls & Playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const playIntervalRef = useRef<any>(null);

  // Initialize and load building & scenarios
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    const online = await api.checkHealth();
    setIsBackendOnline(online);

    const [bldg, scens, state] = await Promise.all([
      api.getBuilding(),
      api.getScenarios(),
      api.getSimulationState(),
    ]);

    setBuilding(bldg);
    setScenarios(scens);
    setSimulationState(state);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Periodic heartbeat poll
  useEffect(() => {
    const timer = setInterval(async () => {
      const online = await api.checkHealth();
      setIsBackendOnline(online);
      if (online && isPlaying) {
        const state = await api.getSimulationState();
        setSimulationState(state);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Handle Play / Continuous Stepping
  useEffect(() => {
    if (isPlaying) {
      const stepDuration = Math.max(600, 2000 / simSpeed);
      playIntervalRef.current = setInterval(async () => {
        const nextState = await api.advanceSimulation({ steps: 1 });
        setSimulationState(nextState);
        if (nextState.is_completed) {
          setIsPlaying(false);
        }
      }, stepDuration);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, simSpeed]);

  const toggleOverlay = useCallback((key: keyof OverlayToggles) => {
    setOverlays((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const selectScenario = useCallback(async (scenarioId: string) => {
    setCurrentScenarioId(scenarioId);
    setIsPlaying(false);
    await api.resetSimulation(scenarioId);
    const [bldg, state] = await Promise.all([
      api.getBuilding(),
      api.getSimulationState(),
    ]);
    setBuilding(bldg);
    setSimulationState(state);
    setActiveRoute(null);
  }, []);

  const stepForward = useCallback(async (steps: number = 1) => {
    const nextState = await api.advanceSimulation({ steps });
    setSimulationState(nextState);
  }, []);

  const runToCompletion = useCallback(async () => {
    setIsPlaying(false);
    const nextState = await api.advanceSimulation({ steps: 1, run_to_completion: true, max_steps: 60 });
    setSimulationState(nextState);
  }, []);

  const resetCurrentSimulation = useCallback(async () => {
    setIsPlaying(false);
    await api.resetSimulation(currentScenarioId);
    const [bldg, state] = await Promise.all([
      api.getBuilding(),
      api.getSimulationState(),
    ]);
    setBuilding(bldg);
    setSimulationState(state);
    setActiveRoute(null);
  }, [currentScenarioId]);

  const injectHazardEvent = useCallback(async (hazard: HazardEvent) => {
    await api.injectHazard(hazard);
    const [bldg, state] = await Promise.all([
      api.getBuilding(),
      api.getSimulationState(),
    ]);
    setBuilding(bldg);
    setSimulationState(state);
  }, []);

  const requestRoute = useCallback(async (req: RouteRequest) => {
    const res = await api.calculateRoute(req);
    setActiveRoute(res);
    return res;
  }, []);

  return {
    building,
    scenarios,
    currentScenarioId,
    simulationState,
    selectedNodeId,
    selectedEdgeKey,
    activeRoute,
    isolatedFloor,
    cameraPreset,
    overlays,
    isPlaying,
    simSpeed,
    isBackendOnline,
    isLoading,
    // Actions
    setSelectedNodeId,
    setSelectedEdgeKey,
    setActiveRoute,
    setIsolatedFloor,
    setCameraPreset,
    setSimSpeed,
    setIsPlaying,
    toggleOverlay,
    selectScenario,
    stepForward,
    runToCompletion,
    resetCurrentSimulation,
    injectHazardEvent,
    requestRoute,
    refreshAll,
  };
}
