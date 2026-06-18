import { AnimatePresence, motion } from 'framer-motion';
import { useGolemStore } from '../state/golemStore';

/**
 * The paint stain rendered on the "camera layer" (a DOM overlay above the 3D
 * canvas). It splats where the user clicked, looks accidental, then fades out
 * during the golem's cleaning phase. Uses layered radial blobs for a wet,
 * irregular paint look.
 */
export default function ScreenStain() {
  const stain = useGolemStore(s => s.stain);
  const phase = useGolemStore(s => s.fourthWall);
  const cleaning = phase === 'clean' || phase === 'return';

  return (
    <AnimatePresence>
      {stain && (
        <motion.div
          key={stain.id}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: 1, opacity: cleaning ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{
            scale: { type: 'spring', stiffness: 220, damping: 16 },
            opacity: { duration: cleaning ? 2.8 : 0.25 },
          }}
          style={{
            position: 'fixed',
            left: stain.x,
            top: stain.y,
            width: 260,
            height: 260,
            marginLeft: -130,
            marginTop: -130,
            pointerEvents: 'none',
            zIndex: 40,
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))',
          }}
        >
          <Splat color={stain.color} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Irregular multi-blob paint splat with drips. */
function Splat({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 260 260" width="260" height="260" style={{ overflow: 'visible' }}>
      <g fill={color}>
        <circle cx="130" cy="128" r="78" />
        <circle cx="78" cy="100" r="34" />
        <circle cx="186" cy="112" r="40" />
        <circle cx="96" cy="180" r="30" />
        <circle cx="176" cy="176" r="26" />
        <circle cx="150" cy="60" r="20" />
        {/* drips */}
        <path d="M128 196 q-8 40 2 64 q10 -22 -2 -64Z" />
        <path d="M186 150 q22 26 18 52 q-16 -18 -18 -52Z" opacity="0.9" />
        <circle cx="40" cy="120" r="9" />
        <circle cx="220" cy="150" r="7" />
        <circle cx="130" cy="262" r="6" />
      </g>
      {/* wet sheen */}
      <ellipse cx="110" cy="106" rx="26" ry="14" fill="#fff" opacity="0.18" />
    </svg>
  );
}
