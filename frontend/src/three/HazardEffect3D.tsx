import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { HazardEvent, BuildingGraphModel } from '../types';
import { nodeToVector3 } from '../utils/coordinates';

interface HazardEffect3DProps {
  hazards: HazardEvent[];
  building: BuildingGraphModel;
}

export const HazardEffect3D: React.FC<HazardEffect3DProps> = ({ hazards, building }) => {
  const nodeMap = new Map(building.nodes.map((n) => [n.id, n]));
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    // Gentle floating and pulsation for active fire / smoke effects
    groupRef.current.children.forEach((child, idx) => {
      const scale = 1.0 + Math.sin(time * 3 + idx) * 0.15;
      child.scale.set(scale, scale * 1.1, scale);
    });
  });

  return (
    <group ref={groupRef}>
      {hazards
        .filter((h) => h.active)
        .map((hazard) => {
          let pos = new THREE.Vector3(0, 0, 0);

          if (hazard.location_type === 'node') {
            const node = nodeMap.get(hazard.target_id);
            if (!node) return null;
            pos = nodeToVector3(node.x, node.y, node.floor, 1.0);
          } else {
            // Edge hazard
            const [u, v] = hazard.target_id.split('-');
            const nu = nodeMap.get(u);
            const nv = nodeMap.get(v);
            if (!nu || !nv) return null;
            const pu = nodeToVector3(nu.x, nu.y, nu.floor, 1.0);
            const pv = nodeToVector3(nv.x, nv.y, nv.floor, 1.0);
            pos = pu.clone().add(pv).multiplyScalar(0.5);
          }

          if (hazard.hazard_type === 'fire') {
            return (
              <group key={hazard.hazard_id} position={pos}>
                {/* Core Fire Flame */}
                <mesh position={[0, 0.4, 0]}>
                  <coneGeometry args={[1.2, 2.2, 16]} />
                  <meshStandardMaterial
                    color="#FF5B61"
                    emissive="#FF2E36"
                    emissiveIntensity={1.2}
                    roughness={0.2}
                    transparent
                    opacity={0.9}
                  />
                </mesh>
                {/* Heat Glow Sphere */}
                <mesh position={[0, 0.2, 0]}>
                  <sphereGeometry args={[1.8, 16, 16]} />
                  <meshBasicMaterial color="#FF5B61" transparent opacity={0.25} />
                </mesh>
              </group>
            );
          }

          if (hazard.hazard_type === 'smoke') {
            return (
              <group key={hazard.hazard_id} position={pos}>
                <mesh position={[0, 0.8, 0]}>
                  <sphereGeometry args={[1.6, 16, 16]} />
                  <meshStandardMaterial
                    color="#4A5568"
                    emissive="#2D3748"
                    emissiveIntensity={0.3}
                    transparent
                    opacity={0.65}
                    roughness={0.9}
                  />
                </mesh>
              </group>
            );
          }

          if (hazard.hazard_type === 'flood') {
            return (
              <group key={hazard.hazard_id} position={pos}>
                <mesh position={[0, -0.2, 0]}>
                  <cylinderGeometry args={[2.5, 2.5, 0.2, 24]} />
                  <meshStandardMaterial
                    color="#3182CE"
                    emissive="#1E3A8A"
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.7}
                    roughness={0.1}
                  />
                </mesh>
              </group>
            );
          }

          // Structural blockage
          return (
            <group key={hazard.hazard_id} position={pos}>
              <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[1.8, 1.2, 0.4]} />
                <meshStandardMaterial color="#FF5B61" roughness={0.5} />
              </mesh>
            </group>
          );
        })}
    </group>
  );
};
