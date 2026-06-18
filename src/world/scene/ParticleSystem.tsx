import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EFFECTS } from '../config/assets';
import { WORLD } from '../config/worldConfig';
import { worldState } from '../state/worldStore';
import { makeRng } from '../utils/placement';

const MAX = 520; // hard cap (desktop). Active count scales with density × scroll.

/**
 * Cinematic Holi powder — soft pigment clouds drifting through the air, carried
 * by the wind. NOT fireworks, confetti, or explosions: particles ease in, rise
 * and waft slowly, then fade. Count and opacity grow with the scroll timeline.
 */
export default function ParticleSystem({ lowPerf = false }: { lowPerf?: boolean }) {
  const puff = useTexture(EFFECTS.powderPuffs[0]);
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const cap = lowPerf ? Math.round(MAX * 0.4) : MAX;

  // Per-particle CPU state
  const state = useMemo(() => {
    const rng = makeRng(WORLD.seed ^ 0x51ed270b);
    const palette = WORLD.holiColors.map(c => new THREE.Color(c));
    const positions = new Float32Array(cap * 3);
    const colors = new Float32Array(cap * 3);
    const sizes = new Float32Array(cap);
    const alphas = new Float32Array(cap);
    const vel = new Float32Array(cap * 3);
    const life = new Float32Array(cap);
    const maxLife = new Float32Array(cap);

    const spawn = (i: number) => {
      // spawn in a ring around the workshop, low to the ground
      const a = rng() * Math.PI * 2;
      const r = 4 + rng() * WORLD.groundRadius * 0.5;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 0.3 + rng() * 1.5;
      positions[i * 3 + 2] = Math.sin(a) * r;
      // slow rise + lateral drift
      vel[i * 3] = (rng() - 0.5) * 0.12;
      vel[i * 3 + 1] = 0.12 + rng() * 0.18;
      vel[i * 3 + 2] = (rng() - 0.5) * 0.12;
      const col = palette[Math.floor(rng() * palette.length)];
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
      sizes[i] = 2.2 + rng() * 4.0;
      maxLife[i] = 6 + rng() * 7;
      life[i] = rng() * maxLife[i]; // stagger
      alphas[i] = 0;
    };
    for (let i = 0; i < cap; i++) spawn(i);
    return { positions, colors, sizes, alphas, vel, life, maxLife, spawn, rng };
  }, [cap]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(state.positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(state.colors, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(state.sizes, 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(state.alphas, 1));
    return g;
  }, [state]);

  const uniforms = useMemo(() => ({ uTex: { value: puff }, uOpacity: { value: 1 } }), [puff]);

  useFrame((_s, delta) => {
    const dt = Math.min(delta, 0.05);
    const { particleDensity, scrollProgress, windStrength } = worldState();
    // how many particles are "active" right now
    const activeRatio = THREE.MathUtils.clamp(particleDensity * (0.2 + scrollProgress * 0.9), 0, 1);
    const activeCount = Math.floor(cap * activeRatio);

    const { positions, alphas, vel, life, maxLife, sizes, spawn } = state;
    for (let i = 0; i < cap; i++) {
      if (i >= activeCount) { alphas[i] = Math.max(0, alphas[i] - dt); continue; }
      life[i] += dt;
      if (life[i] > maxLife[i]) { spawn(i); life[i] = 0; }
      // wind-driven waft
      const wob = Math.sin(life[i] * 0.8 + i) * 0.4 * windStrength;
      positions[i * 3] += (vel[i * 3] + wob * 0.3) * dt;
      positions[i * 3 + 1] += vel[i * 3 + 1] * dt;
      positions[i * 3 + 2] += (vel[i * 3 + 2] + wob * 0.2) * dt;
      // ease alpha in then out across lifetime
      const lr = life[i] / maxLife[i];
      const fade = Math.sin(lr * Math.PI); // 0→1→0
      alphas[i] = fade;
      sizes[i] += dt * 0.4; // clouds grow slightly as they disperse
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aAlpha.needsUpdate = true;
    geometry.attributes.aSize.needsUpdate = true;
    if (matRef.current) matRef.current.uniforms.uOpacity.value = 0.55;
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
        vertexShader={VERT}
        fragmentShader={FRAG}
      />
    </points>
  );
}

const VERT = /* glsl */ `
  attribute vec3 color;
  attribute float aSize;
  attribute float aAlpha;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = color;
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 tex = texture2D(uTex, gl_PointCoord);
    float a = tex.a * vAlpha * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;
