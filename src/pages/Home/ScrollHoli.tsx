import { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* vivid Holi powder palette */
const POWDER = [
  '#f72585', '#ff006e', '#b5179e', '#7209b7', '#560bad',
  '#3a86ff', '#4cc9f0', '#06d6a0', '#80ed99',
  '#ffd60a', '#ffbe0b', '#fb5607', '#ff5400',
];

interface Burst { x: number; y: number; key: number }

/* ─── One colored powder cloud at a screen point ──────────── */
function PowderCloud({ burst, onDone }: { burst: Burst; onDone: (k: number) => void }) {
  const COUNT = 260;
  const ref = useRef<THREE.Points>(null);
  const start = useRef(performance.now());

  const { positions, colors, vel } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);
    const vel       = new Float32Array(COUNT * 3);
    const c = new THREE.Color();
    // pick 2-3 colors per burst for a cohesive splash
    const palette = Array.from({ length: 3 }, () => POWDER[Math.floor(Math.random() * POWDER.length)]);
    for (let i = 0; i < COUNT; i++) {
      positions[i*3] = burst.x; positions[i*3+1] = burst.y; positions[i*3+2] = 0;
      const ang = Math.random() * Math.PI * 2;
      const sp  = 0.6 + Math.random() * 4.2;
      vel[i*3]   = Math.cos(ang) * sp;
      vel[i*3+1] = Math.sin(ang) * sp + 0.8;
      vel[i*3+2] = (Math.random() - 0.5) * 2;
      c.set(palette[i % palette.length]);
      colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
    }
    return { positions, colors, vel };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burst.key]);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    const age = (performance.now() - start.current) / 1000;
    if (age > 2.4) { onDone(burst.key); return; }
    for (let i = 0; i < COUNT; i++) {
      positions[i*3]   += vel[i*3]   * d;
      positions[i*3+1] += vel[i*3+1] * d;
      positions[i*3+2] += vel[i*3+2] * d;
      vel[i*3+1] -= 2.2 * d;   // gravity
      vel[i*3]   *= 0.96;
      vel[i*3+1] *= 0.96;
      vel[i*3+2] *= 0.96;
    }
    if (ref.current) {
      (ref.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      const mat = ref.current.material as THREE.PointsMaterial;
      mat.opacity = Math.max(0, 0.9 * (1 - age / 2.4));
      mat.size = 0.12 + age * 0.05;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={COUNT} itemSize={3} />
        <bufferAttribute attach="attributes-color"    array={colors}    count={COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.13} vertexColors transparent opacity={0.9}
        sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Scene({ bursts, removeBurst }: { bursts: Burst[]; removeBurst: (k: number) => void }) {
  return (
    <>
      <ambientLight intensity={1} />
      {bursts.map(b => <PowderCloud key={b.key} burst={b} onDone={removeBurst} />)}
    </>
  );
}

/* ─── Fixed full-screen overlay that bursts on scroll ─────── */
export default function ScrollHoli() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const keyRef     = useRef(0);
  const lastY      = useRef(window.scrollY);
  const accum      = useRef(0);
  const lastBurst  = useRef(0);

  useEffect(() => {
    // world bounds: camera fov 50 at z=8 → roughly ±3.6 x, ±3.6 y in view; use generous spread
    const spawn = () => {
      const k = keyRef.current++;
      // random-ish position biased toward upper area
      const x = (Math.random() - 0.5) * 9;
      const y = (Math.random() - 0.5) * 6;
      setBursts(b => [...b.slice(-8), { x, y, key: k }]);
    };

    const onScroll = () => {
      const y = window.scrollY;
      const delta = Math.abs(y - lastY.current);
      lastY.current = y;
      accum.current += delta;
      const now = performance.now();
      // fire a splash every ~220px of scroll, throttled to 180ms
      if (accum.current > 220 && now - lastBurst.current > 180) {
        accum.current = 0;
        lastBurst.current = now;
        spawn();
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const removeBurst = (k: number) => setBursts(b => b.filter(x => x.key !== k));

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 5,
        pointerEvents: 'none',
      }}
      aria-hidden
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene bursts={bursts} removeBurst={removeBurst} />
      </Canvas>
    </div>
  );
}
