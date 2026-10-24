import React from 'react';
import * as THREE from 'three';
import { BuildingGraphModel } from '../types';
import { nodeToVector3 } from '../utils/coordinates';

interface CampusGroundProps {
  building: BuildingGraphModel;
  selectedEdgeKey: string | null;
  onSelectEdge?: (edgeKey: string) => void;
  showLabels: boolean;
}

/**
 * Natural low-poly campus tree with realistic wooden trunk and rich green foliage.
 */
const LowPolyTree: React.FC<{ position: [number, number, number]; scale?: number }> = ({
  position,
  scale = 1.0,
}) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Natural Bark Trunk */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 1.4, 6]} />
        <meshStandardMaterial color="#5A3D28" roughness={0.9} />
      </mesh>
      {/* Lower Foliage (Deep Forest Green) */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <coneGeometry args={[1.25, 1.6, 6]} />
        <meshStandardMaterial color="#2D6A4F" roughness={0.75} />
      </mesh>
      {/* Upper Foliage (Fresh Natural Leaf Green) */}
      <mesh position={[0, 2.7, 0]} castShadow>
        <coneGeometry args={[0.95, 1.4, 6]} />
        <meshStandardMaterial color="#3D855E" roughness={0.7} />
      </mesh>
    </group>
  );
};

/**
 * Modern Collegiate Lamp Post.
 */
const CampusLampPost: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Post Base */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 0.3, 8]} />
        <meshStandardMaterial color="#263238" roughness={0.6} />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 2.9, 8]} />
        <meshStandardMaterial color="#37474F" roughness={0.5} />
      </mesh>
      {/* Luminaire Head */}
      <mesh position={[0, 3.1, 0]}>
        <cylinderGeometry args={[0.18, 0.12, 0.25, 8]} />
        <meshStandardMaterial color="#263238" roughness={0.6} />
      </mesh>
      {/* Warm Frosted Lantern Globe */}
      <mesh position={[0, 2.95, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          color="#FFF9E6"
          emissive="#FFF2C6"
          emissiveIntensity={0.6}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
};

export const CampusGround: React.FC<CampusGroundProps> = ({
  building,
  selectedEdgeKey,
  onSelectEdge,
}) => {
  const nodeMap = new Map(building.nodes.map((n) => [n.id, n]));

  // Tree coordinates positioned along perimeter and lawn borders
  const treePositions: [number, number, number][] = [
    // West Lawn (near Vedanta)
    [-24, 0, -2],
    [-24, 0, 8],
    [-23, 0, 14],
    [-19, 0, 16],
    // North Perimeter
    [-12, 0, -18],
    [-6, 0, -18],
    [6, 0, -18],
    [12, 0, -18],
    // East Lawn (near Sarojini)
    [24, 0, -2],
    [24, 0, 6],
    [23, 0, 14],
    // Central Green Borders
    [-13, 0, 8],
    [-2, 0, 8],
    [10, 0, 5],
  ];

  // Lamp post coordinates along main pedestrian paths
  const lampPositions: [number, number, number][] = [
    [-10, 0, -3],
    [-3, 0, 3],
    [3, 0, 3],
    [10, 0, 0],
    [-2, 0, -9],
    [-15, 0, -11],
    [15, 0, -7],
    [0, 0, 15],
  ];

  return (
    <group>
      {/* 1. Main Campus Landscaped Lawn Ground (Dehradun Foothill Grass) */}
      <mesh position={[0, -0.08, 0]} receiveShadow>
        <boxGeometry args={[56, 0.25, 46]} />
        <meshStandardMaterial
          color="#417551"
          roughness={0.88}
          metalness={0.02}
        />
      </mesh>

      {/* Dressed Limestone Curb surrounding the campus boundary */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[56.3, 0.12, 46.3]} />
        <meshStandardMaterial color="#D8D1C5" roughness={0.7} />
      </mesh>
      {/* Recessed grass inner surface */}
      <mesh position={[0, 0.07, 0]} receiveShadow>
        <boxGeometry args={[55.6, 0.1, 45.6]} />
        <meshStandardMaterial color="#417551" roughness={0.88} />
      </mesh>

      {/* 2. Mussoorie Diversion Road (South Approach Road in front of University) */}
      <group position={[0, 0.06, 21.5]}>
        {/* Asphalt Roadway */}
        <mesh receiveShadow>
          <boxGeometry args={[70, 0.06, 6.5]} />
          <meshStandardMaterial color="#2E3338" roughness={0.8} />
        </mesh>
        {/* Yellow Dashed Centerline */}
        {[-28, -20, -12, -4, 4, 12, 20, 28].map((xPos, idx) => (
          <mesh key={`centerline-${idx}`} position={[xPos, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4.5, 0.2]} />
            <meshStandardMaterial color="#F59E0B" roughness={0.5} />
          </mesh>
        ))}
        {/* White Solid Outer Edge Lines */}
        <mesh position={[0, 0.035, 2.9]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[69, 0.15]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.035, -2.9]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[69, 0.15]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.5} />
        </mesh>
      </group>

      {/* 3. Central University Plaza Decorative Stone Medallion */}
      <group position={[0, 0.08, -2]}>
        {/* Outer Circular Sandstone Ring */}
        <mesh receiveShadow>
          <cylinderGeometry args={[4.8, 4.8, 0.05, 32]} />
          <meshStandardMaterial color="#DCD4C7" roughness={0.7} />
        </mesh>
        {/* Inner Sandstone Inlay */}
        <mesh position={[0, 0.03, 0]} receiveShadow>
          <cylinderGeometry args={[3.8, 3.8, 0.05, 32]} />
          <meshStandardMaterial color="#ECE4D8" roughness={0.65} />
        </mesh>
        {/* Central Garden Planter Bed */}
        <mesh position={[0, 0.15, 0]} receiveShadow>
          <cylinderGeometry args={[1.6, 1.8, 0.25, 24]} />
          <meshStandardMaterial color="#9E3D2B" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 0.05, 24]} />
          <meshStandardMaterial color="#2E5A3C" roughness={0.8} />
        </mesh>
      </group>

      {/* 4. Central Assembly Sports Lawn (Manicured Athletic Turf) */}
      <group position={[-5, 0.08, 11]}>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[12, 8]} />
          <meshStandardMaterial color="#4A8F62" roughness={0.92} />
        </mesh>
        {/* Crisp White Athletic Chalk Field Markings */}
        <lineSegments position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(12, 8)]} />
          <lineBasicMaterial color="#E2E8F0" />
        </lineSegments>
      </group>

      {/* 5. East Athletic Complex Grounds */}
      <group position={[13, 0.08, 13]}>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 8]} />
          <meshStandardMaterial color="#428358" roughness={0.92} />
        </mesh>
        <lineSegments position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(10, 8)]} />
          <lineBasicMaterial color="#E2E8F0" />
        </lineSegments>
      </group>

      {/* 6. Campus Perimeter Security Fence (Collegiate Red-Brick Pillars + Bronze Railings) */}
      {/* South Boundary Pillars */}
      {[-24, -16, -8, 8, 16, 24].map((px, idx) => (
        <group key={`south-pillar-${idx}`} position={[px, 0.08, 18.2]}>
          <mesh position={[0, 0.8, 0]} castShadow>
            <boxGeometry args={[0.55, 1.6, 0.55]} />
            <meshStandardMaterial color="#9E3D2B" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.65, 0]}>
            <boxGeometry args={[0.7, 0.12, 0.7]} />
            <meshStandardMaterial color="#ECE5D8" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Connecting Security Railing along South Edge */}
      {[-20, -12, 12, 20].map((rx, idx) => (
        <mesh key={`railing-${idx}`} position={[rx, 0.7, 18.2]}>
          <boxGeometry args={[7.3, 0.9, 0.08]} />
          <meshStandardMaterial color="#2B3540" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* 7. Natural Campus Trees */}
      {treePositions.map((pos, idx) => (
        <LowPolyTree key={`tree-${idx}`} position={pos} scale={0.85 + (idx % 3) * 0.15} />
      ))}

      {/* 8. Campus Lamp Posts */}
      {lampPositions.map((pos, idx) => (
        <CampusLampPost key={`lamp-${idx}`} position={pos} />
      ))}

      {/* 9. Natural Sandstone Paved Pedestrian Walkways */}
      {building.edges.map((edge) => {
        const u = nodeMap.get(edge.source);
        const v = nodeMap.get(edge.target);
        if (!u || !v) return null;

        const pu = nodeToVector3(u.x, u.y, 0, 0.12);
        const pv = nodeToVector3(v.x, v.y, 0, 0.12);

        const edgeKey = `${edge.source}-${edge.target}`;
        const isSelected =
          selectedEdgeKey === edgeKey || selectedEdgeKey === `${edge.target}-${edge.source}`;

        const midPoint = pu.clone().add(pv).multiplyScalar(0.5);
        const distance = pu.distanceTo(pv);
        const direction = pv.clone().sub(pu).normalize();

        // Realistic natural walkway material colors
        let walkwayColor = '#E3DCCF'; // Natural warm sandstone paver
        if (edge.is_blocked || edge.hazard_level >= 75) {
          walkwayColor = '#DC2626'; // Hazard crimson
        } else if (edge.crowd_density > 0.5) {
          walkwayColor = '#F59E0B'; // Congestion amber
        } else if (isSelected) {
          walkwayColor = '#2563EB'; // University blue selection
        }

        // Align walkway mesh between nodes
        const orientation = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          direction
        );

        return (
          <group key={edgeKey} position={midPoint} quaternion={orientation}>
            <mesh
              receiveShadow
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectEdge) onSelectEdge(edgeKey);
              }}
            >
              <boxGeometry args={[edge.width || 2.4, 0.04, distance]} />
              <meshStandardMaterial
                color={walkwayColor}
                roughness={0.75}
                metalness={0.05}
              />
            </mesh>
            {/* Subtle paver curb border lines */}
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(edge.width || 2.4, 0.04, distance)]} />
              <lineBasicMaterial color={isSelected ? '#1D4ED8' : '#C0B7A8'} />
            </lineSegments>
          </group>
        );
      })}

      {/* 10. South Main University Gate Grand Portal */}
      <group position={[0, 0.1, 18.2]}>
        {/* Main Pylons (Red Brick with Limestone Caps) */}
        <mesh position={[-2.6, 1.4, 0]} castShadow>
          <boxGeometry args={[0.7, 2.8, 0.7]} />
          <meshStandardMaterial color="#9E3D2B" roughness={0.65} />
        </mesh>
        <mesh position={[2.6, 1.4, 0]} castShadow>
          <boxGeometry args={[0.7, 2.8, 0.7]} />
          <meshStandardMaterial color="#9E3D2B" roughness={0.65} />
        </mesh>
        {/* Sandstone Pillar Caps */}
        <mesh position={[-2.6, 2.85, 0]}>
          <boxGeometry args={[0.85, 0.18, 0.85]} />
          <meshStandardMaterial color="#ECE5D8" roughness={0.6} />
        </mesh>
        <mesh position={[2.6, 2.85, 0]}>
          <boxGeometry args={[0.85, 0.18, 0.85]} />
          <meshStandardMaterial color="#ECE5D8" roughness={0.6} />
        </mesh>
        {/* Collegiate Blue Arch Overhead Beam */}
        <mesh position={[0, 2.6, 0]}>
          <boxGeometry args={[5.8, 0.35, 0.4]} />
          <meshStandardMaterial color="#0F243A" roughness={0.5} />
        </mesh>
      </group>

      {/* North Emergency Gate Portal */}
      <group position={[-20, 0.1, -14]}>
        <mesh position={[0, 1.0, 0]}>
          <boxGeometry args={[3.0, 2.0, 0.3]} />
          <meshStandardMaterial color="#16A34A" />
        </mesh>
      </group>

      {/* East Hostel Perimeter Gate Portal */}
      <group position={[22, 0.1, -10]}>
        <mesh position={[0, 1.0, 0]}>
          <boxGeometry args={[3.0, 2.0, 0.3]} />
          <meshStandardMaterial color="#16A34A" />
        </mesh>
      </group>
    </group>
  );
};
