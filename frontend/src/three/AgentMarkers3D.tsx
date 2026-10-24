import React from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { EvacuationAgentModel, BuildingGraphModel } from '../types';
import { nodeToVector3 } from '../utils/coordinates';

interface AgentMarkers3DProps {
  agents: EvacuationAgentModel[];
  building: BuildingGraphModel;
  onSelectAgent?: (agentId: string) => void;
}

export const AgentMarkers3D: React.FC<AgentMarkers3DProps> = ({ agents, building, onSelectAgent }) => {
  const nodeMap = new Map(building.nodes.map((n) => [n.id, n]));

  return (
    <group>
      {agents.map((agent) => {
        if (agent.status === 'evacuated') {
          return null; // Group reached safety outside
        }

        const currNode = nodeMap.get(agent.current_location);
        if (!currNode) return null;

        let pos = nodeToVector3(currNode.x, currNode.y, currNode.floor, 0.7);

        // If in transit along an edge, interpolate position
        const path = agent.assigned_route;
        const idx = agent.current_route_index;
        if (path && idx < path.length - 1) {
          const nextNode = nodeMap.get(path[idx + 1]);
          if (nextNode) {
            const pStart = nodeToVector3(currNode.x, currNode.y, currNode.floor, 0.7);
            const pEnd = nodeToVector3(nextNode.x, nextNode.y, nextNode.floor, 0.7);
            // Slight visual progression along current edge
            pos = pStart.clone().lerp(pEnd, 0.35);
          }
        }

        const isWheelchair = agent.requires_accessible_route;
        const isTrapped = agent.status === 'trapped';
        const markerColor = isTrapped ? '#FF5B61' : isWheelchair ? '#88BDF2' : '#BDDDFC';

        return (
          <group
            key={agent.agent_id}
            position={pos}
            onClick={(e) => {
              e.stopPropagation();
              onSelectAgent?.(agent.agent_id);
            }}
          >
            {/* Pedestrian Group Marker */}
            <mesh position={[0, 0.45, 0]}>
              <cylinderGeometry args={[0.35, 0.45, 0.9, 12]} />
              <meshStandardMaterial
                color={markerColor}
                emissive={markerColor}
                emissiveIntensity={0.6}
                roughness={0.3}
              />
            </mesh>
            <mesh position={[0, 1.05, 0]}>
              <sphereGeometry args={[0.3, 12, 12]} />
              <meshStandardMaterial color={markerColor} roughness={0.3} />
            </mesh>

            {/* HTML Count Badge */}
            <Html position={[0, 1.6, 0]} center distanceFactor={30} style={{ pointerEvents: 'none' }}>
              <div
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center gap-1 border shadow-sm ${
                  isTrapped
                    ? 'bg-emergency-red text-white border-white/40'
                    : 'bg-surface-elevated text-brand-ice border-brand-sky/60'
                }`}
              >
                {isWheelchair && <span>♿</span>}
                <span>{agent.group_size}p</span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};
