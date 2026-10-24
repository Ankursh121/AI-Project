import React from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

interface BuildingProps {
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick?: () => void;
  showLabels: boolean;
}

/**
 * 3D Model of the Sarojini Girls' Hostel.
 * Matches DIT University's residential collegiate architecture:
 * - Distinctive 4-storey residential hall with warm terracotta/clay brick masonry.
 * - Architectural natural concrete floor bands and rooftop parapets.
 * - Modular student room windows with sheltered concrete sunshades (chajjas).
 * - Forest bronze safety balcony railings and grilles.
 * - Enclosed secure entrance foyer and courtyard.
 */
export const SarojiniHostel: React.FC<BuildingProps> = ({
  isSelected,
  onSelect,
  onDoubleClick,
  showLabels,
}) => {
  // Center coordinates for Sarojini on the campus grid
  const posX = 16;
  const posY = 0;
  const posZ = 4;

  const width = 12;
  const height = 8.5; // 4 storeys (~2.1m each)
  const depth = 13;

  return (
    <group position={[posX, posY, posZ]}>
      {/* Interactive Selection Click Box */}
      <mesh
        position={[0, height / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick?.();
        }}
        visible={false}
      >
        <boxGeometry args={[width + 1, height + 2, depth + 1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Hostel Foundation Plinth (Warm Earthy Stone Masonry) */}
      <mesh position={[0, 0.25, 0]} receiveShadow>
        <boxGeometry args={[width + 0.6, 0.5, depth + 0.6]} />
        <meshStandardMaterial color="#54453E" roughness={0.8} />
      </mesh>

      {/* Main Residential Hall Body (Warm Collegiate Terracotta / Brick Tone) */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={isSelected ? '#B35641' : '#9B4532'}
          roughness={0.72}
          metalness={0.04}
        />
      </mesh>

      {/* Wireframe Outline */}
      <lineSegments position={[0, height / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
        <lineBasicMaterial
          color={isSelected ? '#F59E0B' : '#7D3323'}
          linewidth={isSelected ? 2 : 1}
        />
      </lineSegments>

      {/* 4-Storey Horizontal Floor Slabs & Parapets (Natural Concrete Bands) */}
      {[2.1, 4.2, 6.3, 8.4].map((yFloor, fIdx) => (
        <group key={`hostel-floor-${fIdx}`} position={[0, yFloor, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[width + 0.35, 0.18, depth + 0.35]} />
            <meshStandardMaterial color="#D8D0C2" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Modular Student Room Windows with Concrete Sunshades (West Facade facing Campus -X) */}
      {[1.1, 3.2, 5.3, 7.4].map((yWin, floorIdx) => (
        <group key={`west-rooms-${floorIdx}`} position={[-width / 2 - 0.05, yWin, 0]}>
          {[-4.2, -2.1, 0, 2.1, 4.2].map((zPos, roomIdx) => (
            <group key={`room-${roomIdx}`} position={[0, 0, zPos]}>
              {/* Window Frame */}
              <mesh position={[0.01, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[1.3, 1.2]} />
                <meshStandardMaterial color="#D8D0C2" roughness={0.5} />
              </mesh>
              {/* Tinted Daylight Architectural Glass */}
              <mesh rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[1.15, 1.05]} />
                <meshStandardMaterial
                  color="#4D6F88"
                  roughness={0.15}
                  metalness={0.65}
                />
              </mesh>

              {/* Natural Concrete Sunshade (Chajja) above window */}
              <mesh position={[-0.18, 0.65, 0]} rotation={[0, 0, 0.12]} castShadow>
                <boxGeometry args={[0.35, 0.06, 1.4]} />
                <meshStandardMaterial color="#E2DAD0" roughness={0.7} />
              </mesh>

              {/* Balcony Railing / Safety Grille (Forest Bronze) */}
              <mesh position={[-0.08, -0.25, 0]}>
                <boxGeometry args={[0.15, 0.45, 1.15]} />
                <meshStandardMaterial color="#2E4238" metalness={0.3} roughness={0.6} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* Modular Student Room Windows (South Facade +Z) */}
      {[1.1, 3.2, 5.3, 7.4].map((yWin, floorIdx) => (
        <group key={`south-rooms-${floorIdx}`} position={[0, yWin, depth / 2 + 0.05]}>
          {[-3.6, 0, 3.6].map((xPos, roomIdx) => (
            <group key={`s-room-${roomIdx}`} position={[xPos, 0, 0]}>
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[1.3, 1.2]} />
                <meshStandardMaterial color="#D8D0C2" roughness={0.5} />
              </mesh>
              <mesh>
                <planeGeometry args={[1.15, 1.05]} />
                <meshStandardMaterial
                  color="#4D6F88"
                  roughness={0.15}
                  metalness={0.65}
                />
              </mesh>
              <mesh position={[0, 0.65, 0.18]} castShadow>
                <boxGeometry args={[1.4, 0.06, 0.35]} />
                <meshStandardMaterial color="#E2DAD0" roughness={0.7} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* Enclosed Security Entrance Foyer (North Facade, -Z) */}
      <group position={[0, 0, -depth / 2 - 0.7]}>
        <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.2, 3.2, 1.5]} />
          <meshStandardMaterial color="#9B4532" roughness={0.7} />
        </mesh>
        <mesh position={[0, 3.25, 0]}>
          <boxGeometry args={[4.4, 0.15, 1.65]} />
          <meshStandardMaterial color="#D8D0C2" roughness={0.6} />
        </mesh>
        {/* Entrance Doorway */}
        <mesh position={[0, 1.1, -0.76]}>
          <planeGeometry args={[2.0, 2.2]} />
          <meshStandardMaterial color="#35566E" roughness={0.15} metalness={0.7} />
        </mesh>
      </group>

      {/* Rooftop Water Storage & Service Core Structure */}
      <mesh position={[0, height + 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.5, 1.8, 4.5]} />
        <meshStandardMaterial color="#D8D0C2" roughness={0.7} />
      </mesh>

      {/* Readable Building Name Badge */}
      {showLabels && (
        <Html position={[0, height + 1.5, 0]} center distanceFactor={34} zIndexRange={[100, 0]}>
          <div
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide whitespace-nowrap shadow-md border transition-all pointer-events-none flex items-center gap-1.5 ${
              isSelected
                ? 'bg-[#16385C] text-white border-amber-400 ring-2 ring-amber-400/50'
                : 'bg-[#0F243A]/95 text-white border-slate-400/60'
            }`}
          >
            <span>🏠</span>
            <span>SAROJINI (GIRLS' HOSTEL)</span>
          </div>
        </Html>
      )}
    </group>
  );
};
