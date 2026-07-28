import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Users, X, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/** Playful hand-written blurbs that levitate around the Draw button. */
const FLOATERS: { text: string; left: string; top: string; rot: number; delay: number; size: string }[] = [
  { text: 'sketch anything',       left: '24%', top: '57%', rot: -9, delay: 0.0, size: '1.9rem' },
  { text: 'play with friends',     left: '66%', top: '54%', rot: 8,  delay: 0.7, size: '2rem'   },
  { text: 'guess & win',           left: '18%', top: '75%', rot: 7,  delay: 1.2, size: '1.7rem' },
  { text: 'no rules — just doodle', left: '70%', top: '77%', rot: -7, delay: 0.4, size: '1.7rem' },
];

/**
 * The entry point OUT of the immersive hero scene and INTO the app.
 * A single prominent CTA on the world; tapping it opens a small choice menu
 * (draw solo vs play with friends) so first-time visitors always have an
 * obvious way in — the 3D scene alone gave them none.
 */
export default function HeroEntry() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <>
      {/* Levitating hand-written blurbs around the button. Outer span holds the
          fixed position + self-centering; inner motion span does the float. */}
      {FLOATERS.map(f => (
        <span
          key={f.text}
          aria-hidden
          className="pointer-events-none fixed z-30 select-none whitespace-nowrap"
          style={{ left: f.left, top: f.top, transform: 'translate(-50%, -50%)' }}
        >
          <motion.span
            className="inline-block text-white"
            style={{
              fontFamily: 'var(--font-doodle)', fontSize: f.size, fontWeight: 700,
              rotate: f.rot, textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.92, y: [0, -13, 0] }}
            transition={{
              opacity: { delay: 1.5 + f.delay, duration: 0.9 },
              y: { delay: f.delay, duration: 4.2 + f.delay, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            {f.text}
          </motion.span>
        </span>
      ))}

      {/* Big, fun hero CTA — always visible on the world. */}
      <motion.button
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.0, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => setOpen(true)}
        onPointerDown={e => e.stopPropagation()}
        className="fixed left-1/2 bottom-[8vh] z-40 flex -translate-x-1/2 items-center gap-3
                   rounded-[2rem] bg-lavender px-12 py-4 text-white
                   shadow-[0_16px_48px_rgb(139_120_224/0.6)] transition-all
                   hover:scale-[1.05] hover:bg-lavender-dark active:scale-95"
        style={{ fontFamily: 'var(--font-doodle)' }}
      >
        <span className="pointer-events-none absolute inset-0 rounded-[2rem] ring-2 ring-white/45 opacity-30 animate-ping" />
        <Pencil size={34} strokeWidth={2.4} />
        <span className="pb-1 text-6xl font-bold leading-none">Draw</span>
      </motion.button>

      {/* Choice menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            onPointerDown={e => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.92, y: 22, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 22, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-cream hover:text-gray-700"
              >
                <X size={20} />
              </button>

              <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-900">
                Ready to draw?
              </h2>
              <p className="mb-5 mt-1 text-sm text-gray-500">Pick how you want to jump in.</p>

              <div className="flex flex-col gap-3">
                <Choice
                  icon={<Pencil size={20} />}
                  title="Draw solo"
                  desc="Your own infinite canvas — start creating instantly."
                  accent="bg-lavender"
                  onClick={() => navigate('/draw')}
                />
                <Choice
                  icon={<Users size={20} />}
                  title="Play with friends"
                  desc="Create or join a live draw & guess room."
                  accent="bg-teal-500"
                  onClick={() => navigate('/games')}
                />
              </div>

              {!user && (
                <button
                  onClick={() => navigate('/login')}
                  className="mt-5 flex w-full items-center justify-center gap-2 text-sm text-gray-500 transition-colors hover:text-lavender-dark"
                >
                  <LogIn size={15} /> Sign in to save your work
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Choice({
  icon, title, desc, accent, onClick,
}: { icon: ReactNode; title: string; desc: string; accent: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl border border-cream-dark p-4 text-left
                 transition-all hover:border-lavender hover:bg-lavender-light/40"
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent} text-white shadow-md transition-transform group-hover:scale-105`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="mt-0.5 text-xs text-gray-500">{desc}</div>
      </div>
      <ArrowRight size={18} className="text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-lavender-dark" />
    </button>
  );
}
