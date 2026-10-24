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
 * 3D Model of the Chanakya Administrative Block.
 * Matches DIT University's institutional administrative architecture:
 * - Formal symmetrical wings in authentic collegiate red brick.
 * - Central elevated administrative tower/pediment in warm dressed sandstone.
 * - University crest / clock insignia in polished architectural brass.
 * - Dignified sandstone portico entrance with administrative staircase.
 * - Vertical daylight window bays with dark architectural bronze frames.
 */
export const ChanakyaBuilding: React.FC<BuildingProps> = ({
  isSelected,
  onSelect,
  onDoubleClick,
  showLabels,
}) => {
  // Center coordinates for Chanakya on the campus grid
  const posX = 0;
  const posY = 0;
  const posZ = -13;

  const width = 14;
  const height = 6.0; // 2 storeys (~3.0m each)
  const depth = 8;

  return (
    <group position={[posX, posY, posZ]}>
      {/* Interactive Selection Click Box */}
      <mesh
        position={[0, height / 2 + 1, 0]}
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
        <boxGeometry args={[width + 1, height + 3, depth + 1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Building Base Plinth (Dark Granite Masonry) */}
      <mesh position={[0, 0.25, 0]} receiveShadow>
        <boxGeometry args={[width + 0.6, 0.5, depth + 0.6]} />
        <meshStandardMaterial color="#4A4540" roughness={0.8} />
      </mesh>

      {/* Lateral Office Wings (Left & Right) in Authentic DIT Collegiate Red Brick */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={isSelected ? '#AB4734' : '#943827'}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* Edge Wireframe Lines */}
      <lineSegments position={[0, height / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
        <lineBasicMaterial
          color={isSelected ? '#F59E0B' : '#7D2D1E'}
          linewidth={isSelected ? 2 : 1}
        />
      </lineSegments>

      {/* Central Elevated Administrative Tower / Pediment (Warm Natural Sandstone) */}
      <group position={[0, height + 1.2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[5.5, 2.4, depth + 0.4]} />
          <meshStandardMaterial
            color={isSelected ? '#E4D7C2' : '#D5C7B0'}
            roughness={0.6}
            metalness={0.05}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(5.5, 2.4, depth + 0.4)]} />
          <lineBasicMaterial color="#BDB09B" />
        </lineSegments>

        {/* Central Red-Brick Pilasters flanking the pediment */}
        <mesh position={[-2.4, 0, (depth + 0.4) / 2 + 0.05]} castShadow>
          <boxGeometry args={[0.5, 2.3, 0.15]} />
          <meshStandardMaterial color="#943827" roughness={0.7} />
        </mesh>
        <mesh position={[2.4, 0, (depth + 0.4) / 2 + 0.05]} castShadow>
          <boxGeometry args={[0.5, 2.3, 0.15]} />
          <meshStandardMaterial color="#943827" roughness={0.7} />
        </mesh>

        {/* University Administrative Clock / Crest Insignia (Polished Brass / Gold) */}
        <group position={[0, 0.35, (depth + 0.4) / 2 + 0.06]}>
          {/* Gold Crest Outer Ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 0.08, 20]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.25} />
          </mesh>
          {/* White Clock Face */}
          <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.02, 20]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* Floor Divider Sandstone Slab */}
      <mesh position={[0, 3.0, 0]} receiveShadow>
        <boxGeometry args={[width + 0.25, 0.2, depth + 0.25]} />
        <meshStandardMaterial color="#E5DCCE" roughness={0.65} />
      </mesh>

      {/* Administrative Vertical Windows (Front Facade +Z) */}
      {[1.5, 4.5].map((yWin, fIdx) => (
        <group key={`chanakya-windows-${fIdx}`} position={[0, yWin, depth / 2 + 0.05]}>
          {[-5.2, -3.8, -2.4, 2.4, 3.8, 5.2].map((xWin, wIdx) => (
            <group key={`win-${wIdx}`} position={[xWin, 0, 0]}>
              {/* Dark Bronze Window Frame */}
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[1.0, 1.6]} />
                <meshStandardMaterial color="#2C333D" roughness={0.5} />
              </mesh>
              {/* Tinted Daylight Architectural Glass */}
              <mesh>
                <planeGeometry args={[0.85, 1.45]} />
                <meshStandardMaterial
                  color="#4A6D86"
                  roughness={0.15}
                  metalness={0.65}
                />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* Symmetrical Entrance Portico (Administrative Center, +Z) */}
      <group position={[0, 0, depth / 2 + 0.8]}>
        {/* Sandstone Entrance Plinth */}
        <mesh position={[0, 0.2, 0]} receiveShadow>
          <boxGeometry args={[4.2, 0.4, 1.8]} />
          <meshStandardMaterial color="#D5C7B0" roughness={0.7} />
        </mesh>
        {/* Entrance Columns */}
        <mesh position={[-1.6, 1.6, 0.6]} castShadow>
          <cylinderGeometry args={[0.16, 0.18, 2.8, 12]} />
          <meshStandardMaterial color="#E5DCCE" roughness={0.6} />
        </mesh>
        <mesh position={[1.6, 1.6, 0.6]} castShadow>
          <cylinderGeometry args={[0.16, 0.18, 2.8, 12]} />
          <meshStandardMaterial color="#E5DCCE" roughness={0.6} />
        </mesh>
        {/* Portico Canopy Slab */}
        <mesh position={[0, 3.1, 0.6]} receiveShadow>
          <boxGeometry args={[4.5, 0.25, 2.0]} />
          <meshStandardMaterial color="#D5C7B0" roughness={0.6} />
        </mesh>
        {/* Glazed Entry Door */}
        <mesh position={[0, 1.3, -0.7]}>
          <planeGeometry args={[2.4, 2.2]} />
          <meshStandardMaterial color="#35566E" roughness={0.15} metalness={0.7} />
        </mesh>
      </group>

      {/* Rooftop Parapet Coping */}
      <mesh position={[0, height + 0.1, 0]} receiveShadow>
        <boxGeometry args={[width + 0.15, 0.2, depth + 0.15]} />
        <meshStandardMaterial color="#E5DCCE" roughness={0.65} />
      </mesh>

      {/* Readable Building Name Badge */}
      {showLabels && (
        <Html position={[0, height + 2.5, 0]} center distanceFactor={34} zIndexRange={[100, 0]}>
          <div
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide whitespace-nowrap shadow-md border transition-all pointer-events-none flex items-center gap-1.5 ${
              isSelected
                ? 'bg-[#16385C] text-white border-amber-400 ring-2 ring-amber-400/50'
                : 'bg-[#0F243A]/95 text-white border-slate-400/60'
            }`}
          >
            <span>🏢</span>
            <span>CHANAKYA (ADMIN BLOCK)</span>
          </div>
        </Html>
      )}
    </group>
  );
};
