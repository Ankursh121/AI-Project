import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { BuildingGraphModel } from '../types';
import { nodeToVector3 } from '../utils/coordinates';

interface RoutePath3DProps {
  path: string[];
  building: BuildingGraphModel;
  isBlocked?: boolean;
}

export const RoutePath3D: React.FC<RoutePath3DProps> = ({ path, building, isBlocked = false }) => {
  const pulseSphereRef = useRef<THREE.Mesh>(null);

  // Generate 3D curve through waypoints
  const { curve, points } = useMemo(() => {
    if (!path || path.length < 2) return { curve: null, points: [] };

    const nodeMap = new Map(building.nodes.map((n) => [n.id, n]));
    const pts: THREE.Vector3[] = [];

    for (const nodeId of path) {
      const node = nodeMap.get(nodeId);
      if (node) {
        pts.push(nodeToVector3(node.x, node.y, node.floor, 0.6));
      }
    }

    if (pts.length < 2) return { curve: null, points: [] };

    const c = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2);
    return { curve: c, points: pts };
  }, [path, building]);

  // Animate traveling pulse along the route
  useFrame(({ clock }) => {
    if (!curve || !pulseSphereRef.current) return;
    const t = (clock.getElapsedTime() * 0.45) % 1.0;
    const point = curve.getPointAt(t);
    pulseSphereRef.current.position.copy(point);
  });

  if (!curve || points.length < 2) return null;

  const tubeColor = isBlocked ? '#DC2626' : '#1D4ED8';
  const pulseColor = isBlocked ? '#FCA5A5' : '#FFFFFF';

  return (
    <group>
      {/* Route Navigation Tube */}
      <mesh>
        <tubeGeometry args={[curve, 64, 0.16, 8, false]} />
        <meshStandardMaterial
          color={tubeColor}
          roughness={0.25}
          metalness={0.3}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Traveling Luminous Pulse Sphere */}
      <mesh ref={pulseSphereRef}>
        <sphereGeometry args={[0.38, 16, 16]} />
        <meshStandardMaterial
          color={pulseColor}
          emissive={isBlocked ? '#DC2626' : '#2563EB'}
          emissiveIntensity={0.6}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
};
