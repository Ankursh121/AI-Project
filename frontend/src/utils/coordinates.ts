import * as THREE from 'three';

/**
 * Coordinate mapping from DIT University Campus ground grid (x, y, floor)
 * to 3D Three.js coordinate space (X=East/West, Y=Elevation, Z=North/South).
 */

export const SCALE = 1.0;
export const FLOOR_HEIGHT = 4.0;
export const CENTER_X = 0.0;
export const CENTER_Y = 0.0;

export function nodeToVector3(x: number, y: number, floor: number = 0, yOffset: number = 0): THREE.Vector3 {
  const posX = (x - CENTER_X) * SCALE;
  const posY = (floor * FLOOR_HEIGHT) + yOffset;
  const posZ = (y - CENTER_Y) * SCALE;
  return new THREE.Vector3(posX, posY, posZ);
}

export function nodePositionTuple(x: number, y: number, floor: number = 0, yOffset: number = 0): [number, number, number] {
  const v = nodeToVector3(x, y, floor, yOffset);
  return [v.x, v.y, v.z];
}
