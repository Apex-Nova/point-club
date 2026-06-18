import { useMemo } from 'react';
import * as THREE from 'three';
import { PROPS } from '../config/assets';
import { WORLD } from '../config/worldConfig';
import PropModel from './workshop/PropModel';
import { getArtworkTexture } from '../character/canvasArtwork';

/**
 * The Copper Golem's workspace — present and "occupied" even though the artist
 * isn't here yet. A raised wooden platform holds a giant easel + blank canvas,
 * a workbench with palette and brushes, and paint buckets mid-use.
 *
 * The easel, canvas surface and platform are built from geometry (workshop
 * structure). Palette / bucket / brush / workbench are imported props.
 */
export default function CanvasWorkshop() {
  return (
    <group name="CanvasWorkshop" position={WORLD.workshopPosition}>
      <Platform />
      <Easel />
      {/* Workbench with tools, angled toward the easel */}
      <group position={[3, 0, 1.2]} rotation={[0, -0.5, 0]}>
        <PropModel url={PROPS.workbench} targetHeight={1.05} />
        <PropModel url={PROPS.palette} targetHeight={0.32} position={[-0.2, 1.08, 0]} rotationY={0.4} />
        <PropModel url={PROPS.brush} targetHeight={0.5} position={[0.35, 1.1, 0.1]} rotationY={1.2} />
      </group>
      {/* Paint buckets scattered as if in use */}
      <PropModel url={PROPS.paintBucket} targetHeight={0.42} position={[-1.6, 0, 1.8]} rotationY={0.6} />
      <PropModel url={PROPS.paintBucket} targetHeight={0.42} position={[-1.1, 0, 2.3]} rotationY={2.1} />
      <PropModel url={PROPS.paintBucket} targetHeight={0.36} position={[2.2, 0, -1.4]} rotationY={-1} />
    </group>
  );
}

/** Raised circular wooden deck defining the studio floor. */
function Platform() {
  return (
    <group>
      <mesh receiveShadow castShadow position={[0, 0.1, 0]}>
        <cylinderGeometry args={[5.2, 5.4, 0.2, 48]} />
        <meshStandardMaterial color="#6b4f32" roughness={0.9} />
      </mesh>
      <mesh receiveShadow position={[0, 0.21, 0]}>
        <cylinderGeometry args={[5.0, 5.0, 0.02, 48]} />
        <meshStandardMaterial color="#7c5d3c" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** The painted surface — its texture is the golem's evolving artwork. */
function CanvasSurface() {
  const map = useMemo(() => getArtworkTexture(), []);
  return (
    <mesh name="CanvasBoard" position={[0, 0, 0.06]}>
      <planeGeometry args={[2.74, 2.04]} />
      <meshStandardMaterial map={map} roughness={0.95} emissive="#2a2418" emissiveIntensity={0.04} />
    </mesh>
  );
}

/** Wooden A-frame easel holding the giant blank canvas (future paint target). */
function Easel() {
  const wood = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#7a5230', roughness: 0.7 }),
    [],
  );
  const legGeo = useMemo(() => new THREE.BoxGeometry(0.12, 3.4, 0.12), []);

  return (
    <group position={[0, 0.2, 0]} rotation={[0, 0.35, 0]}>
      {/* Two front legs + one back leg (tripod) */}
      <mesh geometry={legGeo} material={wood} position={[-0.9, 1.7, 0]} rotation={[0, 0, 0.12]} castShadow />
      <mesh geometry={legGeo} material={wood} position={[0.9, 1.7, 0]} rotation={[0, 0, -0.12]} castShadow />
      <mesh geometry={legGeo} material={wood} position={[0, 1.7, -0.7]} rotation={[0.22, 0, 0]} castShadow />
      {/* Cross supports */}
      <mesh material={wood} position={[0, 1.1, 0.02]} castShadow>
        <boxGeometry args={[2.0, 0.12, 0.12]} />
      </mesh>
      <mesh material={wood} position={[0, 2.2, 0.02]} castShadow>
        <boxGeometry args={[2.2, 0.12, 0.12]} />
      </mesh>

      {/* Canvas frame + surface — the giant blank canvas */}
      <group position={[0, 2.1, 0.06]}>
        <mesh castShadow>
          <boxGeometry args={[3.0, 2.3, 0.1]} />
          <meshStandardMaterial color="#5b3d22" roughness={0.6} />
        </mesh>
        <CanvasSurface />
      </group>
    </group>
  );
}
