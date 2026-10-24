import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Himalayan & Mussoorie Foothills Mountain Backdrop:
 * Surrounds the DIT University Dehradun campus with majestic mountain ridges,
 * tiered forested foothills, and an expansive valley floor that seamlessly grounds the campus.
 * Eliminates the "floating cardboard slab" appearance and gives authentic geographic realism.
 */
export const HimalayanMountains: React.FC = () => {
  // Generate mountain peaks with natural varied heights, radii, and positions
  const mountainPeaks = useMemo(() => {
    const peaks: {
      position: [number, number, number];
      radius: number;
      height: number;
      segments: number;
      color: string;
      rotationY: number;
    }[] = [];

    // 1. Northern Mussoorie Main Ridge (Grandest peaks behind Vedanta & Chanakya)
    const northPeaks: [number, number, number, number][] = [
      // [x, z, height, radius]
      [0, -110, 52, 42],
      [-35, -115, 48, 38],
      [38, -105, 50, 40],
      [-75, -120, 55, 46],
      [75, -112, 54, 44],
      [-115, -125, 46, 40],
      [115, -118, 48, 42],
      // Closer Northern Foothills (Layer 2)
      [-18, -75, 32, 28],
      [22, -72, 34, 30],
      [-55, -80, 36, 32],
      [58, -78, 35, 30],
      [-90, -85, 30, 26],
      [92, -82, 32, 28],
    ];

    northPeaks.forEach(([x, z, h, r], i) => {
      // Natural mountain color variation: deep pine green, slate forest, misty ridge
      const colors = ['#2E4D38', '#385C44', '#264230', '#32543D', '#2B4734'];
      peaks.push({
        position: [x, h / 2 - 2, z],
        radius: r,
        height: h,
        segments: 6 + (i % 3), // Faceted low-poly mountain ridges
        color: colors[i % colors.length],
        rotationY: (i * 0.8) % Math.PI,
      });
    });

    // 2. Eastern Mountain Ridge (Behind Sarojini Girls' Hostel & Sports Grounds)
    const eastPeaks: [number, number, number, number][] = [
      [95, -45, 44, 36],
      [110, 0, 48, 38],
      [105, 45, 42, 35],
      [125, -20, 52, 44],
      [130, 25, 46, 40],
      // Closer Eastern Foothills
      [70, -25, 26, 24],
      [75, 20, 28, 25],
      [72, 60, 24, 22],
    ];

    eastPeaks.forEach(([x, z, h, r], i) => {
      const colors = ['#30523C', '#2A4935', '#395E46', '#26402E'];
      peaks.push({
        position: [x, h / 2 - 2, z],
        radius: r,
        height: h,
        segments: 6 + (i % 2),
        color: colors[i % colors.length],
        rotationY: (i * 1.1) % Math.PI,
      });
    });

    // 3. Western Mountain Ridge (West of Vedanta Building)
    const westPeaks: [number, number, number, number][] = [
      [-95, -45, 45, 38],
      [-110, 0, 47, 40],
      [-105, 45, 43, 36],
      [-125, -20, 50, 42],
      [-130, 25, 46, 39],
      // Closer Western Foothills
      [-70, -25, 28, 25],
      [-75, 20, 26, 24],
      [-72, 60, 25, 22],
    ];

    westPeaks.forEach(([x, z, h, r], i) => {
      const colors = ['#2E4D38', '#385C44', '#264230', '#32543D'];
      peaks.push({
        position: [x, h / 2 - 2, z],
        radius: r,
        height: h,
        segments: 6 + (i % 3),
        color: colors[i % colors.length],
        rotationY: (i * 0.9) % Math.PI,
      });
    });

    // 4. Southern Valley Knolls (Distant rolling green hills along the valley entrance)
    const southKnolls: [number, number, number, number][] = [
      [-80, 105, 30, 32],
      [-30, 115, 25, 30],
      [30, 115, 26, 30],
      [80, 105, 32, 34],
      [0, 130, 35, 38],
    ];

    southKnolls.forEach(([x, z, h, r], i) => {
      peaks.push({
        position: [x, h / 2 - 2, z],
        radius: r,
        height: h,
        segments: 7,
        color: '#34583E',
        rotationY: i * 0.7,
      });
    });

    return peaks;
  }, []);

  // Dense Pine Tree Clusters scattered along mountain slopes
  const mountainTreeClusters = useMemo(() => {
    const trees: [number, number, number, number][] = [];
    const seedPositions = [
      // Foothill slopes north
      [-25, -60], [-10, -58], [15, -62], [30, -55], [-45, -65], [45, -65],
      [-65, -70], [65, -70], [-85, -75], [85, -75],
      // Foothill slopes east
      [60, -10], [62, 10], [65, 35], [58, -35], [75, 0], [80, 25],
      // Foothill slopes west
      [-60, -10], [-62, 10], [-65, 35], [-58, -35], [-75, 0], [-80, 25],
      // Valley south corners
      [-55, 75], [55, 75], [-40, 85], [40, 85],
    ];

    seedPositions.forEach(([bx, bz], sIdx) => {
      // 3-5 trees per cluster
      const count = 3 + (sIdx % 3);
      for (let j = 0; j < count; j++) {
        const ox = (Math.sin(sIdx * 5 + j * 2.3) * 6);
        const oz = (Math.cos(sIdx * 3 + j * 1.7) * 6);
        const scale = 1.2 + (Math.sin(j + sIdx) * 0.4);
        trees.push([bx + ox, 0, bz + oz, scale]);
      }
    });

    return trees;
  }, []);

  return (
    <group>
      {/* 1. Expansive Dehradun Valley Ground Floor (Stretches 400m to eliminate floating plate look) */}
      <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[420, 420, 16, 16]} />
        <meshStandardMaterial
          color="#3A6648"
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>

      {/* 2. Outer Mountain Horizon Peaks (Mussoorie Foothills Arc) */}
      {mountainPeaks.map((peak, idx) => (
        <mesh
          key={`mountain-${idx}`}
          position={peak.position}
          rotation={[0, peak.rotationY, 0]}
          castShadow
          receiveShadow
        >
          <coneGeometry args={[peak.radius, peak.height, peak.segments]} />
          <meshStandardMaterial
            color={peak.color}
            roughness={0.88}
            metalness={0.05}
            flatShading
          />
        </mesh>
      ))}

      {/* 3. Himalayan Pine / Deodar Forest Trees on Foothill Slopes */}
      {mountainTreeClusters.map(([tx, _, tz, sc], tIdx) => (
        <group key={`mt-tree-${tIdx}`} position={[tx, 0, tz]} scale={[sc, sc * 1.15, sc]}>
          {/* Trunk */}
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.32, 1.8, 5]} />
            <meshStandardMaterial color="#4A3423" roughness={0.9} />
          </mesh>
          {/* Lower Pine Canopy */}
          <mesh position={[0, 2.3, 0]} castShadow>
            <coneGeometry args={[1.5, 2.0, 5]} />
            <meshStandardMaterial color="#1E3E2B" roughness={0.8} flatShading />
          </mesh>
          {/* Mid Pine Canopy */}
          <mesh position={[0, 3.4, 0]} castShadow>
            <coneGeometry args={[1.15, 1.7, 5]} />
            <meshStandardMaterial color="#274D36" roughness={0.75} flatShading />
          </mesh>
          {/* Upper Pine Tip */}
          <mesh position={[0, 4.4, 0]} castShadow>
            <coneGeometry args={[0.75, 1.4, 5]} />
            <meshStandardMaterial color="#346144" roughness={0.7} flatShading />
          </mesh>
        </group>
      ))}

      {/* 4. Foothill Fog / Mountain Mist Layer (Soft atmospheric elevation) */}
      <mesh position={[0, 6, -95]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[320, 60]} />
        <meshBasicMaterial
          color="#D4E4F0"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
