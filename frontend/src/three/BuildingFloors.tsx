import React from 'react';
import * as THREE from 'three';
import { BuildingGraphModel } from '../types';
import { nodeToVector3, FLOOR_HEIGHT } from '../utils/coordinates';

interface BuildingFloorsProps {
  building: BuildingGraphModel;
  isolatedFloor: number | null;
  selectedEdgeKey: string | null;
  onSelectEdge?: (edgeKey: string) => void;
}

export const BuildingFloors: React.FC<BuildingFloorsProps> = ({
  building,
  isolatedFloor,
  selectedEdgeKey,
  onSelectEdge,
}) => {
  const nodeMap = new Map(building.nodes.map((n) => [n.id, n]));

  return (
    <group>
      {/* Floor 0 Base Slab */}
      {(isolatedFloor === null || isolatedFloor === 0) && (
        <group position={[0, -0.05, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[36, 0.2, 16]} />
            <meshStandardMaterial
              color="#182532"
              roughness={0.8}
              metalness={0.1}
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* Subtle perimeter border */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(36, 0.2, 16)]} />
            <lineBasicMaterial color="#34495D" />
          </lineSegments>
        </group>
      )}

      {/* Floor 1 Upper Slab */}
      {(isolatedFloor === null || isolatedFloor === 1) && (
        <group position={[0, FLOOR_HEIGHT - 0.05, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[32, 0.2, 16]} />
            <meshStandardMaterial
              color="#1F2F3F"
              roughness={0.7}
              metalness={0.1}
              transparent
              opacity={0.8}
            />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(32, 0.2, 16)]} />
            <lineBasicMaterial color="#4A6572" />
          </lineSegments>
        </group>
      )}

      {/* Corridor Connections and Path Segments */}
      {building.edges.map((edge) => {
        const u = nodeMap.get(edge.source);
        const v = nodeMap.get(edge.target);
        if (!u || !v) return null;

        // Floor isolation check
        if (isolatedFloor !== null) {
          if (u.floor !== isolatedFloor && v.floor !== isolatedFloor) {
            return null;
          }
        }

        const pu = nodeToVector3(u.x, u.y, u.floor, 0.15);
        const pv = nodeToVector3(v.x, v.y, v.floor, 0.15);

        const edgeKey = `${edge.source}-${edge.target}`;
        const isSelected = selectedEdgeKey === edgeKey || selectedEdgeKey === `${edge.target}-${edge.source}`;

        // Corridor pathway dimensions
        const midPoint = pu.clone().add(pv).multiplyScalar(0.5);
        const distance = pu.distanceTo(pv);
        const direction = pv.clone().sub(pu).normalize();

        // Color based on congestion or blockage
        let corridorColor = '#223344';
        if (edge.is_blocked || edge.hazard_level >= 75) {
          corridorColor = '#FF5B61';
        } else if (edge.crowd_density > 0.6) {
          corridorColor = '#F4B860';
        } else if (isSelected) {
          corridorColor = '#88BDF2';
        } else if (!edge.accessible) {
          corridorColor = '#3A4D5F';
        }

        // Align box with edge direction
        const quaternion = new THREE.Quaternion();
        const upVector = new THREE.Vector3(0, 1, 0);
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);

        return (
          <group
            key={edgeKey}
            position={midPoint}
            quaternion={quaternion}
            onClick={(e) => {
              e.stopPropagation();
              onSelectEdge?.(edgeKey);
            }}
          >
            <mesh>
              <boxGeometry args={[0.9, 0.1, distance]} />
              <meshStandardMaterial
                color={corridorColor}
                roughness={0.6}
                metalness={0.1}
                emissive={isSelected ? '#88BDF2' : '#101923'}
                emissiveIntensity={isSelected ? 0.4 : 0.1}
              />
            </mesh>
          </group>
        );
      })}

      {/* External Ramp geometry for RAMP_EAST -> ASSEMBLY_EAST */}
      {(isolatedFloor === null || isolatedFloor === 1 || isolatedFloor === 0) && (
        <group>
          {/* Sloped ramp plane from Floor 1 to ground */}
          {(() => {
            const rampNode = nodeMap.get('RAMP_EAST');
            const assemblyNode = nodeMap.get('ASSEMBLY_EAST');
            if (!rampNode || !assemblyNode) return null;
            const p1 = nodeToVector3(rampNode.x, rampNode.y, 1, 0.2);
            const p0 = nodeToVector3(assemblyNode.x, assemblyNode.y, 0, 0.2);
            const mid = p1.clone().add(p0).multiplyScalar(0.5);
            const dir = p0.clone().sub(p1).normalize();
            const len = p1.distanceTo(p0);
            const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

            return (
              <group position={mid} quaternion={quat}>
                <mesh>
                  <boxGeometry args={[1.4, 0.12, len]} />
                  <meshStandardMaterial color="#88BDF2" roughness={0.4} metalness={0.2} emissive="#88BDF2" emissiveIntensity={0.25} />
                </mesh>
              </group>
            );
          })()}
        </group>
      )}
    </group>
  );
};
