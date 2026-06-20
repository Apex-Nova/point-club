import { useMemo } from 'react';
import * as THREE from 'three';
import { PROPS } from '../config/assets';
import { WORLD } from '../config/worldConfig';
import { PLATFORM_TOP, CLEARING_GROUND } from '../config/terrain';
import PropModel from './workshop/PropModel';
import { getArtworkTexture } from '../character/canvasArtwork';

const T = PLATFORM_TOP; // platform surface height — props sit on this

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
      <group position={[3, T, 1.2]} rotation={[0, -0.5, 0]}>
        <PropModel url={PROPS.workbench} targetHeight={1.05} />
        <PropModel url={PROPS.palette} targetHeight={0.32} position={[-0.2, 1.08, 0]} rotationY={0.4} />
        <PropModel url={PROPS.brush} targetHeight={0.5} position={[0.35, 1.1, 0.1]} rotationY={1.2} />
        <SketchPaper position={[0.05, 1.05, -0.25]} rotationY={0.3} />
      </group>

      {/* Paint buckets in use around the easel */}
      <PropModel url={PROPS.paintBucket} targetHeight={0.42} position={[-1.6, T, 1.8]} rotationY={0.6} />
      <PropModel url={PROPS.paintBucket} targetHeight={0.42} position={[-1.1, T, 2.3]} rotationY={2.1} />
      <PropModel url={PROPS.paintBucket} targetHeight={0.36} position={[2.2, T, -1.4]} rotationY={-1} />
      <PropModel url={PROPS.paintBucket} targetHeight={0.4} position={[-2.4, T, 0.9]} rotationY={1.3} />
      <PropModel url={PROPS.paintBucket} targetHeight={0.34} position={[1.0, T, 2.6]} rotationY={-0.4} />
      <PropModel url={PROPS.brush} targetHeight={0.46} position={[-1.9, T, 1.4]} rotationY={2.6} />

      {/* Storytelling clutter — spills, sketches, crate, measuring stick */}
      <PaintSpill position={[-1.3, T + 0.01, 1.6]} color="#ff6fae" />
      <PaintSpill position={[1.4, T + 0.01, 1.0]} color="#5bc0eb" radius={0.4} />
      <PaintSpill position={[-2.1, T + 0.01, 0.7]} color="#ffcf5c" radius={0.3} />
      <SketchPaper position={[-2.0, T + 0.02, 2.2]} rotationY={-0.5} onGround />
      <SketchPaper position={[1.8, T + 0.02, 1.9]} rotationY={0.8} onGround />
      <Crate position={[3.4, T, -0.4]} />
      <MeasuringStick position={[-2.6, T, 2.6]} />
    </group>
  );
}

/** Handcrafted wooden studio deck. Built as a flared dirt mound that blends
 *  into the surrounding ground (no floating ring / gap) topped by a thick
 *  wooden deck — embedded in the terrain, not hovering above it. */
function Platform() {
  const moundH = Math.abs(CLEARING_GROUND) + 0.18;
  return (
    <group>
      {/* flared earth mound — wide buried base tapering up, so the platform
          reads as part of the ground rather than a floating disc */}
      <mesh receiveShadow position={[0, CLEARING_GROUND - 0.05, 0]}>
        <cylinderGeometry args={[5.1, 6.8, moundH, 56]} />
        <meshStandardMaterial color="#574629" roughness={1} />
      </mesh>
      {/* thick wooden deck (top at PLATFORM_TOP) */}
      <mesh receiveShadow castShadow position={[0, T - 0.16, 0]}>
        <cylinderGeometry args={[5.0, 5.15, 0.34, 56]} />
        <meshStandardMaterial color="#7a5230" roughness={0.85} />
      </mesh>
      {/* packed-earth studio floor on top of the deck */}
      <mesh receiveShadow position={[0, T + 0.001, 0]}>
        <cylinderGeometry args={[4.85, 4.92, 0.05, 56]} />
        <meshStandardMaterial color="#876746" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** A loose sheet of sketch paper — on the bench (tilted) or flat on the deck. */
function SketchPaper({ position, rotationY = 0, onGround = false }:
  { position: [number, number, number]; rotationY?: number; onGround?: boolean }) {
  return (
    <mesh position={position} rotation={[onGround ? -Math.PI / 2 : -1.2, rotationY, 0]} castShadow>
      <planeGeometry args={[0.5, 0.65]} />
      <meshStandardMaterial color="#f4efe1" roughness={1} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** A flat irregular paint spill on the platform. */
function PaintSpill({ position, color, radius = 0.32 }:
  { position: [number, number, number]; color: string; radius?: number }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[radius, 16]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0} polygonOffset polygonOffsetFactor={-1} />
    </mesh>
  );
}

/** A small wooden storage crate. */
function Crate({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#8a6239" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.3, 0.305]}>
        <boxGeometry args={[0.62, 0.12, 0.02]} />
        <meshStandardMaterial color="#6b4a2b" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** A leaning measuring stick (artist's tool). */
function MeasuringStick({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={[position[0], position[1] + 0.5, position[2]]} rotation={[0, 0, 0.5]} castShadow>
      <boxGeometry args={[0.05, 1.4, 0.05]} />
      <meshStandardMaterial color="#caa46a" roughness={0.7} />
    </mesh>
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
