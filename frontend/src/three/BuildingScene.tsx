import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  BuildingGraphModel,
  SimulationStateResponse,
  RouteResponse,
  OverlayToggles,
  CameraPreset,
} from '../types';
import { CampusGround } from './CampusGround';
import { HimalayanMountains } from './HimalayanMountains';
import { VedantaBuilding } from './buildings/VedantaBuilding';
import { ChanakyaBuilding } from './buildings/ChanakyaBuilding';
import { SarojiniHostel } from './buildings/SarojiniHostel';
import { InteractiveNode } from './InteractiveNode';
import { RoutePath3D } from './RoutePath3D';
import { HazardEffect3D } from './HazardEffect3D';
import { AgentMarkers3D } from './AgentMarkers3D';

export interface CameraFocusRequest {
  type: 'reset' | 'campus' | 'building';
  buildingKey?: 'VEDANTA' | 'CHANAKYA' | 'SAROJINI' | string;
  id: number;
}

interface BuildingSceneProps {
  building: BuildingGraphModel;
  simulationState: SimulationStateResponse;
  activeRoute: RouteResponse | null;
  selectedNodeId: string | null;
  selectedEdgeKey: string | null;
  selectedBuildingKey?: string | null;
  isolatedFloor?: number | null;
  cameraPreset?: CameraPreset;
  overlays: OverlayToggles;
  focusRequest?: CameraFocusRequest | null;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge?: (edgeKey: string) => void;
  onSelectBuilding?: (buildingKey: string) => void;
  onDoubleClickBuilding?: (buildingKey: string) => void;
  onSelectAgent?: (agentId: string) => void;
}

/**
 * Natural 3D Mouse Controls & Camera Controller:
 * - Left drag: Smoothly rotates the entire campus around the focus target.
 * - Right drag: Smoothly pans the camera across the campus in screen space.
 * - Scroll wheel: Smoothly zooms toward/away with sensible clamp limits (8m - 70m).
 * - Smooth transition lerp when Reset View, Focus Campus, or Building Focus is triggered.
 * - Automatically cancels active transition on manual user mouse interaction so it never fights the user.
 */
const CameraController: React.FC<{
  focusRequest?: CameraFocusRequest | null;
}> = ({ focusRequest }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const transitionRef = useRef<{
    active: boolean;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    progress: number;
  }>({
    active: false,
    startPos: new THREE.Vector3(20, 24, 32),
    endPos: new THREE.Vector3(20, 24, 32),
    startTarget: new THREE.Vector3(0, 1.5, -2),
    endTarget: new THREE.Vector3(0, 1.5, -2),
    progress: 0,
  });

  // Cancel any running transition immediately when the user interacts with mouse
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const handleUserStart = () => {
      transitionRef.current.active = false;
    };
    controls.addEventListener('start', handleUserStart);
    return () => {
      controls.removeEventListener('start', handleUserStart);
    };
  }, []);

  // Trigger smooth camera animation on new focusRequest
  useEffect(() => {
    if (!focusRequest || !controlsRef.current) return;
    const controls = controlsRef.current;
    const camera = controls.object;

    let targetPos = new THREE.Vector3(20, 24, 32);
    let targetLookAt = new THREE.Vector3(0, 1.5, -2);

    if (focusRequest.type === 'reset') {
      // Default initial campus angle and zoom
      targetPos.set(20, 24, 32);
      targetLookAt.set(0, 1.5, -2);
    } else if (focusRequest.type === 'campus') {
      // Elevated view framing all three buildings
      targetPos.set(24, 26, 32);
      targetLookAt.set(0, 1.5, -2);
    } else if (focusRequest.type === 'building') {
      if (focusRequest.buildingKey === 'VEDANTA') {
        targetLookAt.set(-16, 3.5, -4);
        targetPos.set(-4, 13, 9);
      } else if (focusRequest.buildingKey === 'CHANAKYA') {
        targetLookAt.set(0, 3.0, -13);
        targetPos.set(10, 12, 1);
      } else if (focusRequest.buildingKey === 'SAROJINI') {
        targetLookAt.set(16, 4.0, 4);
        targetPos.set(27, 14, 18);
      }
    }

    transitionRef.current = {
      active: true,
      startPos: camera.position.clone(),
      endPos: targetPos,
      startTarget: controls.target.clone(),
      endTarget: targetLookAt,
      progress: 0,
    };
  }, [focusRequest]);

  // Frame-by-frame cubic ease-out interpolation
  useFrame((_, delta) => {
    const t = transitionRef.current;
    if (!t.active || !controlsRef.current) return;

    t.progress += delta * 2.5;
    if (t.progress >= 1) {
      t.progress = 1;
      t.active = false;
    }
    // Cubic ease-out factor
    const factor = 1 - Math.pow(1 - t.progress, 3);

    const controls = controlsRef.current;
    controls.object.position.lerpVectors(t.startPos, t.endPos, factor);
    controls.target.lerpVectors(t.startTarget, t.endTarget, factor);
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping={true}
      dampingFactor={0.05}
      screenSpacePanning={true}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
      minDistance={8}
      maxDistance={70}
      maxPolarAngle={Math.PI / 2.05}
      minPolarAngle={0.05}
      target={[0, 2, 0]}
    />
  );
};

export const BuildingScene: React.FC<BuildingSceneProps> = ({
  building,
  simulationState,
  activeRoute,
  selectedNodeId,
  selectedEdgeKey,
  selectedBuildingKey,
  overlays,
  focusRequest,
  onSelectNode,
  onSelectEdge,
  onSelectBuilding,
  onDoubleClickBuilding,
  onSelectAgent,
}) => {
  return (
    <div
      className="w-full h-full relative select-none bg-[#DCEBF5] cursor-grab active:cursor-grabbing"
      onContextMenu={(e) => e.preventDefault()}
      style={{ touchAction: 'none' }}
    >
      <Canvas
        camera={{ position: [20, 24, 32], fov: 42, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        shadows
      >
        {/* Natural Clear Dehradun Daylight Sky & Atmospheric Mountain Haze */}
        <color attach="background" args={['#DCEBF5']} />
        <fog attach="fog" args={['#DCEBF5', 80, 250]} />

        {/* Natural Daylight & Warm Foothill Sun */}
        <ambientLight intensity={0.75} color="#F0F6FA" />
        <directionalLight
          position={[32, 50, 26]}
          intensity={1.35}
          color="#FFFDF5"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-25, 30, -30]} intensity={0.35} color="#C4DCF0" />
        {/* Sky-to-Lawn Hemisphere Lighting for Realistic Outdoor Bounce */}
        <hemisphereLight args={['#D8E8F5', '#4A7C59', 0.5]} />

        {/* Natural 3D Mouse & Camera Controller */}
        <CameraController focusRequest={focusRequest} />

        {/* Surrounding Himalayan Mountains & Expansive Dehradun Valley Floor */}
        <HimalayanMountains />

        {/* Subtle Ground Reference Grid on Grass */}
        {overlays.grid && (
          <Grid
            position={[0, -0.22, 0]}
            args={[65, 55]}
            cellSize={2}
            cellThickness={0.5}
            cellColor="#C8D6C8"
            sectionSize={10}
            sectionThickness={1.0}
            sectionColor="#B0C2B0"
            fadeDistance={75}
          />
        )}

        {/* DIT University Campus Ground, Paved Walkways, Trees, and Exits */}
        <CampusGround
          building={building}
          selectedEdgeKey={selectedEdgeKey}
          onSelectEdge={onSelectEdge}
          showLabels={overlays.labels}
        />

        {/* Three Distinct DIT University Buildings */}
        <VedantaBuilding
          isSelected={selectedBuildingKey === 'VEDANTA'}
          onSelect={() => {
            if (onSelectBuilding) onSelectBuilding('VEDANTA');
            onSelectNode('VEDANTA_ENTRANCE');
          }}
          onDoubleClick={() => {
            if (onDoubleClickBuilding) onDoubleClickBuilding('VEDANTA');
          }}
          showLabels={overlays.labels}
        />

        <ChanakyaBuilding
          isSelected={selectedBuildingKey === 'CHANAKYA'}
          onSelect={() => {
            if (onSelectBuilding) onSelectBuilding('CHANAKYA');
            onSelectNode('CHANAKYA_ENTRANCE');
          }}
          onDoubleClick={() => {
            if (onDoubleClickBuilding) onDoubleClickBuilding('CHANAKYA');
          }}
          showLabels={overlays.labels}
        />

        <SarojiniHostel
          isSelected={selectedBuildingKey === 'SAROJINI'}
          onSelect={() => {
            if (onSelectBuilding) onSelectBuilding('SAROJINI');
            onSelectNode('SAROJINI_ENTRANCE');
          }}
          onDoubleClick={() => {
            if (onDoubleClickBuilding) onDoubleClickBuilding('SAROJINI');
          }}
          showLabels={overlays.labels}
        />

        {/* Interactive Waypoint Nodes (Entrances, Junctions, Assembly Points) */}
        {building.nodes.map((node) => {
          return (
            <InteractiveNode
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              isIsolated={false}
              showLabel={overlays.labels}
              onSelect={onSelectNode}
            />
          );
        })}

        {/* 3D Animated Route Spline with Travelling Pulse */}
        {overlays.routes && activeRoute && activeRoute.found && (
          <RoutePath3D
            path={activeRoute.path}
            building={building}
            isBlocked={activeRoute.warnings.length > 0}
          />
        )}

        {/* Environmental Hazards (Fire, Smoke, Structural Blockage) */}
        {overlays.hazards && (
          <HazardEffect3D
            hazards={simulationState.active_hazards}
            building={building}
          />
        )}

        {/* Evacuation Pedestrian Groups */}
        <AgentMarkers3D
          agents={simulationState.agents}
          building={building}
          onSelectAgent={onSelectAgent}
        />
      </Canvas>
    </div>
  );
};
