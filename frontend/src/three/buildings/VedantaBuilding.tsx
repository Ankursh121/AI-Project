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
 * 3D Model of the Vedanta Academic Building (School of Computing & Veda Central Library).
 * Faithfully matches DIT University's signature collegiate red-brick architecture:
 * - Authentic warm red-brick masonry facade with subtle tonal texture.
 * - Prominent horizontal limestone / off-white floor dividing slabs and cornices.
 * - Classroom and library daylight tinted window bands.
 * - Classical entrance portico with cream limestone pillars.
 * - Rooftop parapet with dressed limestone coping.
 */
export const VedantaBuilding: React.FC<BuildingProps> = ({
  isSelected,
  onSelect,
  onDoubleClick,
  showLabels,
}) => {
  // Center coordinates for Vedanta on the campus grid
  const posX = -16;
  const posY = 0;
  const posZ = -4;

  const width = 16;
  const height = 7.5; // 3 storeys (~2.5m each)
  const depth = 9;

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

      {/* Building Base Plinth (Dark Granite / Ashlar Masonry Foundation) */}
      <mesh position={[0, 0.25, 0]} receiveShadow>
        <boxGeometry args={[width + 0.8, 0.5, depth + 0.8]} />
        <meshStandardMaterial color="#4A423D" roughness={0.8} />
      </mesh>

      {/* Main Structural Academic Body: Authentic DIT Collegiate Red Brick */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={isSelected ? '#B84D38' : '#9E3D2B'}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* Architectural Edge Contours */}
      <lineSegments position={[0, height / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
        <lineBasicMaterial
          color={isSelected ? '#F59E0B' : '#853222'}
          linewidth={isSelected ? 2 : 1}
        />
      </lineSegments>

      {/* Visible Limestone Floor Dividing Slabs / Cornices (Classic Collegiate Contrast) */}
      {[2.5, 5.0, 7.5].map((yLevel, idx) => (
        <group key={`floor-slab-${idx}`} position={[0, yLevel, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[width + 0.35, 0.22, depth + 0.35]} />
            <meshStandardMaterial color="#ECE5D8" roughness={0.65} />
          </mesh>
        </group>
      ))}

      {/* Recessed Horizontal Window Bands (Front Facade facing South +Z) */}
      {[1.3, 3.8, 6.3].map((yWindow, floorIdx) => (
        <group key={`front-windows-${floorIdx}`} position={[0, yWindow, depth / 2 + 0.05]}>
          {/* Left Wing Windows */}
          {[-6, -4.5, -3].map((xWin, wIdx) => (
            <group key={`win-l-${wIdx}`} position={[xWin, 0, 0]}>
              {/* Window Frame */}
              <mesh position={[0, 0, -0.02]}>
                <planeGeometry args={[1.2, 1.3]} />
                <meshStandardMaterial color="#ECE5D8" roughness={0.5} />
              </mesh>
              {/* Tinted Daylight Architectural Glass */}
              <mesh>
                <planeGeometry args={[1.05, 1.15]} />
                <meshStandardMaterial
                  color="#476A82"
                  roughness={0.15}
                  metalness={0.65}
                />
              </mesh>
            </group>
          ))}

          {/* Right Wing Windows */}
          {[3, 4.5, 6].map((xWin, wIdx) => (
            <group key={`win-r-${wIdx}`} position={[xWin, 0, 0]}>
              {/* Window Frame */}
              <mesh position={[0, 0, -0.02]}>
                <planeGeometry args={[1.2, 1.3]} />
                <meshStandardMaterial color="#ECE5D8" roughness={0.5} />
              </mesh>
              {/* Tinted Daylight Architectural Glass */}
              <mesh>
                <planeGeometry args={[1.05, 1.15]} />
                <meshStandardMaterial
                  color="#476A82"
                  roughness={0.15}
                  metalness={0.65}
                />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* Classical Academic Entrance Portico / Canopy (South Facade, +Z) */}
      <group position={[0, 0, depth / 2 + 1.2]}>
        {/* Portico Entrance Plinth & Steps */}
        <mesh position={[0, 0.25, 0]} receiveShadow>
          <boxGeometry args={[4.8, 0.5, 2.4]} />
          <meshStandardMaterial color="#DED7C8" roughness={0.7} />
        </mesh>

        {/* Cream Limestone Classical Supporting Columns */}
        {[-1.8, -0.6, 0.6, 1.8].map((colX, cIdx) => (
          <mesh key={`col-${cIdx}`} position={[colX, 2.1, 0.7]} castShadow>
            <cylinderGeometry args={[0.18, 0.2, 3.3, 12]} />
            <meshStandardMaterial color="#EDE6DA" roughness={0.6} />
          </mesh>
        ))}

        {/* Portico Overhang Canopy Slab (DIT Red Brick & Limestone Fascia) */}
        <mesh position={[0, 3.8, 0.7]} castShadow receiveShadow>
          <boxGeometry args={[5.2, 0.35, 2.6]} />
          <meshStandardMaterial color="#9E3D2B" roughness={0.6} />
        </mesh>
        <mesh position={[0, 4.05, 0.7]} receiveShadow>
          <boxGeometry args={[5.35, 0.15, 2.75]} />
          <meshStandardMaterial color="#ECE5D8" roughness={0.5} />
        </mesh>

        {/* Glazed Entrance Foyer Glass Behind Pillars */}
        <mesh position={[0, 1.6, -0.9]}>
          <planeGeometry args={[3.2, 2.4]} />
          <meshStandardMaterial color="#35566E" roughness={0.1} metalness={0.7} />
        </mesh>
      </group>

      {/* Rooftop Parapet Wall (DIT Red Brick with Limestone Coping) */}
      <group position={[0, height + 0.45, 0]}>
        {/* Parapet Brick Body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[width + 0.1, 0.9, depth + 0.1]} />
          <meshStandardMaterial color="#9E3D2B" roughness={0.7} />
        </mesh>
        {/* Limestone Coping Cap */}
        <mesh position={[0, 0.48, 0]} receiveShadow>
          <boxGeometry args={[width + 0.25, 0.1, depth + 0.25]} />
          <meshStandardMaterial color="#ECE5D8" roughness={0.5} />
        </mesh>
      </group>

      {/* Readable Building Name Badge */}
      {showLabels && (
        <Html position={[0, height + 1.6, 0]} center distanceFactor={34} zIndexRange={[100, 0]}>
          <div
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide whitespace-nowrap shadow-md border transition-all pointer-events-none flex items-center gap-1.5 ${
              isSelected
                ? 'bg-[#16385C] text-white border-amber-400 ring-2 ring-amber-400/50'
                : 'bg-[#0F243A]/95 text-white border-slate-400/60'
            }`}
          >
            <span>🏛️</span>
            <span>VEDANTA (ACADEMIC BLOCK)</span>
          </div>
        </Html>
      )}
    </group>
  );
};
