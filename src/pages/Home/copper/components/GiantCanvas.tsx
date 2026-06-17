import * as THREE from 'three';
import { CANVAS_CENTER, CANVAS_W, CANVAS_H, WOOD, WOOD_D, BARK_D } from '../shared';

/**
 * GiantCanvas — a large artist canvas, several times taller than the golem,
 * facing the viewer. The painted surface is the live CanvasTexture produced by
 * the PaintingSystem, so real, evolving brushwork appears here.
 */
export default function GiantCanvas({ texture }: { texture: THREE.Texture }) {
  const [cx, cy, cz] = CANVAS_CENTER.toArray();
  const frameW = CANVAS_W + 0.4;
  const frameH = CANVAS_H + 0.4;

  return (
    <group position={[cx, cy, cz]}>
      {/* wooden outer frame */}
      <mesh position={[0, 0, -0.08]} castShadow receiveShadow>
        <boxGeometry args={[frameW, frameH, 0.16]} />
        <meshStandardMaterial color={WOOD_D} roughness={0.75} />
      </mesh>
      {/* canvas surface with the live painting */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[CANVAS_W, CANVAS_H]} />
        <meshStandardMaterial map={texture} roughness={0.85} />
      </mesh>
      {/* easel legs splaying back */}
      <mesh position={[-frameW / 2 + 0.1, -frameH / 2 - 1.1, -0.6]} rotation={[0.2, 0, 0.08]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 3.2, 8]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>
      <mesh position={[frameW / 2 - 0.1, -frameH / 2 - 1.1, -0.6]} rotation={[0.2, 0, -0.08]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 3.2, 8]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>
      <mesh position={[0, -frameH / 2 - 1.1, -0.9]} rotation={[-0.3, 0, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 3.0, 8]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>
      {/* tray ledge */}
      <mesh position={[0, -frameH / 2 - 0.05, 0.18]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[frameW, 0.12, 0.3]} />
        <meshStandardMaterial color={BARK_D} roughness={0.7} />
      </mesh>
    </group>
  );
}
