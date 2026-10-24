import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { NodeModel } from '../types';
import { nodePositionTuple } from '../utils/coordinates';

interface InteractiveNodeProps {
  node: NodeModel;
  isSelected: boolean;
  isIsolated: boolean;
  showLabel: boolean;
  onSelect: (nodeId: string) => void;
}

export const InteractiveNode: React.FC<InteractiveNodeProps> = ({
  node,
  isSelected,
  isIsolated,
  showLabel,
  onSelect,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  if (isIsolated) return null;

  const position = nodePositionTuple(node.x, node.y, node.floor, 0.4);

  // Determine geometry size and styling based on node type
  let color = '#C5BDB2'; // Natural stone paver default
  let emissive = '#C5BDB2';
  let emissiveIntensity = 0.05;
  let size: [number, number, number] = [2.0, 0.25, 2.0];

  if (node.is_exit) {
    color = '#16A34A'; // Safe emerald green
    emissive = '#16A34A';
    emissiveIntensity = isSelected || hovered ? 0.6 : 0.3;
    size = [2.4, 0.4, 2.4];
  } else if (node.type === 'stairs') {
    color = '#D97706'; // Natural sandstone amber
    size = [1.9, 0.5, 1.9];
  } else if (node.type === 'ramp') {
    color = '#2563EB'; // Clear accessible blue
    size = [2.2, 0.35, 2.2];
  } else if (node.type === 'corridor') {
    color = '#D6CEBF';
    size = [1.8, 0.2, 1.8];
  } else if (node.type === 'lab') {
    color = '#B8AFA0';
    size = [2.4, 0.35, 2.4];
  }

  if (node.is_blocked || node.hazard_level >= 75) {
    color = '#DC2626'; // Emergency crimson
    emissive = '#DC2626';
    emissiveIntensity = 0.5;
  } else if (node.hazard_level > 20) {
    color = '#EA580C';
    emissive = '#EA580C';
    emissiveIntensity = 0.3;
  }

  if (isSelected) {
    color = '#2563EB';
    emissive = '#2563EB';
    emissiveIntensity = 0.6;
  }

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* Subtle selection ring */}
      {isSelected && (
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.4, 1.7, 32]} />
          <meshBasicMaterial color="#2563EB" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}

      {/* HTML Label on top: Show on hover, selection, or designated exit */}
      {(isSelected || hovered || (showLabel && node.is_exit)) && (
        <Html
          position={[0, 1.2, 0]}
          center
          distanceFactor={38}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            className={`px-2 py-0.5 rounded-md text-[9.5px] font-sans font-medium tracking-tight transition-all duration-150 shadow-sm backdrop-blur-md border ${
              isSelected
                ? 'bg-blue-600/95 text-white font-bold border-blue-400 shadow-blue-500/20'
                : node.is_blocked
                ? 'bg-rose-600/95 text-white font-semibold border-rose-400 shadow-rose-500/20'
                : node.is_exit
                ? 'bg-emerald-800/90 text-white font-medium border-emerald-400/50 shadow-emerald-500/20'
                : hovered
                ? 'bg-white/95 text-slate-900 border-blue-400 font-semibold shadow-md'
                : 'bg-slate-900/85 text-white border-white/20'
            }`}
          >
            {node.name}
            {node.hazard_level > 0 && (
              <span className="ml-1 text-[9px] px-1 bg-rose-600 text-white rounded">
                {Math.round(node.hazard_level)}%
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};
