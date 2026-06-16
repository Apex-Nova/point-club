import { Suspense, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil, Users, Swords, HelpCircle, Globe, Sparkles,
  ArrowRight, Play, Plus, DoorOpen, ChevronDown,
} from 'lucide-react';
import { lazy } from 'react';
import Navbar from '@/components/layout/Navbar';

const ForestScene = lazy(() => import('./ForestScene'));

/* ── Game mode cards ─────────────────────────────────────────── */
const GAMES = [
  {
    id:       'room',
    icon:     Users,
    emoji:    '🎨',
    label:    'DRAW TOGETHER',
    title:    'Multiplayer Canvas',
    desc:     'Real-time drawing room, up to 20 people on one infinite canvas.',
    color:    '#4ade80',
    glow:     '#4ade8040',
    cardBg:   'linear-gradient(145deg, #0f3320 0%, #0a2416 100%)',
    border:   '#2a6b40',
    action:   () => {},
    actionLabel: 'Create Room',
    route:    '/draw',
  },
  {
    id:       'guess',
    icon:     HelpCircle,
    emoji:    '🔍',
    label:    'GUESS IT',
    title:    'Guess the Drawing',
    desc:     'One draws, everyone guesses. Classic party game reimagined.',
    color:    '#facc15',
    glow:     '#facc1540',
    cardBg:   'linear-gradient(145deg, #2d2000 0%, #1e1600 100%)',
    border:   '#7a5c00',
    action:   () => {},
    actionLabel: 'Play Now',
    route:    '/games',
  },
  {
    id:       'battle',
    icon:     Swords,
    emoji:    '⚔️',
    label:    'BATTLE',
    title:    'Draw Battle',
    desc:     'Draw the same prompt — let the crowd vote for the best art.',
    color:    '#f87171',
    glow:     '#f8717140',
    cardBg:   'linear-gradient(145deg, #2d0f0f 0%, #1e0a0a 100%)',
    border:   '#7a3030',
    action:   () => {},
    actionLabel: 'Start Battle',
    route:    '/games',
  },
  {
    id:       'world',
    icon:     Globe,
    emoji:    '🌍',
    label:    'WORLD CANVAS',
    title:    'Infinite World',
    desc:     'One shared canvas that never ends. Leave your mark forever.',
    color:    '#60a5fa',
    glow:     '#60a5fa40',
    cardBg:   'linear-gradient(145deg, #0a1d2e 0%, #06131e 100%)',
    border:   '#1e4a6e',
    action:   () => {},
    actionLabel: 'Explore World',
    route:    '/world',
  },
  {
    id:       'scribble',
    icon:     Pencil,
    emoji:    '✏️',
    label:    'SCRIBBLE',
    title:    'Quick Draw',
    desc:     'Jump into a solo doodle session. No login needed.',
    color:    '#c084fc',
    glow:     '#c084fc40',
    cardBg:   'linear-gradient(145deg, #1a0d2e 0%, #120820 100%)',
    border:   '#4a2270',
    action:   () => {},
    actionLabel: 'Start Doodling',
    route:    '/draw',
  },
];

/* ── Floating leaf particles (CSS) ──────────────────────────── */
function Leaves() {
  const leaves = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${5 + (i * 5.5) % 90}%`,
    delay: i * 0.7,
    dur: 6 + (i % 5) * 1.4,
    size: 8 + (i % 4) * 4,
    color: ['#2d6b35', '#1a4d1e', '#4a8c55', '#3d7a48', '#5ea36b'][i % 5],
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {leaves.map(l => (
        <motion.div
          key={l.id}
          initial={{ y: -30, x: 0, rotate: 0, opacity: 0.7 }}
          animate={{ y: '110vh', x: [0, 30, -20, 15, 0], rotate: 360, opacity: [0.7, 0.5, 0.7, 0.3] }}
          transition={{ duration: l.dur, delay: l.delay, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', left: l.left, top: 0 }}
        >
          <svg width={l.size} height={l.size} viewBox="0 0 20 20">
            <ellipse cx="10" cy="10" rx="5" ry="9" fill={l.color}
              transform={`rotate(${(l.id * 37) % 360} 10 10)`} opacity="0.85" />
            <line x1="10" y1="1" x2="10" y2="19" stroke={l.color} strokeWidth="0.6" opacity="0.5" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Game card ───────────────────────────────────────────────── */
function GameCard({
  game, index, active, onClick,
}: {
  game: typeof GAMES[0];
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  const navigate = useNavigate();
  const Icon = game.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 + index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      whileHover={{ y: -10, scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="relative cursor-pointer rounded-3xl overflow-hidden flex-shrink-0"
      style={{
        width: 175,
        background: game.cardBg,
        border: `1.5px solid ${active ? game.color : game.border}`,
        boxShadow: active
          ? `0 0 28px ${game.glow}, 0 8px 32px rgba(0,0,0,0.6)`
          : `0 4px 24px rgba(0,0,0,0.5)`,
        transition: 'box-shadow 0.3s, border-color 0.3s',
      }}
    >
      {/* Glow top edge */}
      {active && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${game.color}80, transparent)` }}
        />
      )}

      <div className="p-5 flex flex-col gap-3" style={{ minHeight: 220 }}>
        {/* Badge */}
        <span
          className="self-start text-[8px] font-black tracking-[0.18em] px-2.5 py-1 rounded-full"
          style={{ background: `${game.color}18`, color: game.color, border: `1px solid ${game.color}30` }}
        >
          {game.label}
        </span>

        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mt-1"
          style={{
            background: `${game.color}12`,
            border: `1.5px solid ${game.color}30`,
            boxShadow: active ? `0 0 20px ${game.glow}` : undefined,
          }}
        >
          <Icon size={26} style={{ color: game.color }} />
        </div>

        {/* Title */}
        <div>
          <p className="font-black text-base leading-snug" style={{ color: '#e8f5e9' }}>{game.title}</p>
          <p className="text-[11px] leading-relaxed mt-1" style={{ color: '#6b8f6e' }}>{game.desc}</p>
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={e => { e.stopPropagation(); navigate(game.route); }}
          className="mt-auto flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all"
          style={{
            background: active ? game.color : `${game.color}18`,
            color: active ? '#030d06' : game.color,
            border: `1px solid ${game.color}40`,
          }}
        >
          <Play size={10} fill="currentColor" />
          {game.actionLabel}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ── Join / Create row ───────────────────────────────────────── */
function QuickJoin() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1, duration: 0.5 }}
      className="flex items-center gap-3 flex-wrap justify-center"
    >
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate('/draw')}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm"
        style={{
          background: 'linear-gradient(135deg, #4ade80, #22c55e)',
          color: '#030d06',
          boxShadow: '0 4px 20px #4ade8060',
        }}
      >
        <Plus size={15} /> Create Room
      </motion.button>

      <AnimatePresence mode="wait">
        {!show ? (
          <motion.button
            key="show"
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShow(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm"
            style={{
              background: 'rgba(74,222,128,0.08)',
              color: '#4ade80',
              border: '1.5px solid rgba(74,222,128,0.25)',
            }}
          >
            <DoorOpen size={15} /> Join Room
          </motion.button>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, width: 120 }}
            animate={{ opacity: 1, width: 'auto' }}
            className="flex items-center gap-2"
          >
            <input
              autoFocus
              placeholder="Room code…"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => {
                if (e.key === 'Enter' && code.trim()) navigate(`/room/${code.trim()}`);
                if (e.key === 'Escape') setShow(false);
              }}
              maxLength={8}
              className="px-4 py-3 rounded-xl font-mono font-bold text-sm outline-none"
              style={{
                background: 'rgba(74,222,128,0.08)',
                border: '1.5px solid rgba(74,222,128,0.4)',
                color: '#4ade80',
                width: 140,
              }}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => code.trim() && navigate(`/room/${code.trim()}`)}
              className="px-4 py-3 rounded-xl font-bold text-sm"
              style={{ background: '#4ade80', color: '#030d06' }}
            >
              <ArrowRight size={14} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Scroll indicator ────────────────────────────────────────── */
function ScrollDown({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 absolute bottom-6 left-1/2 -translate-x-1/2"
      style={{ color: '#2d6b35' }}
    >
      <span className="text-[9px] font-bold tracking-[0.2em] uppercase">Explore</span>
      <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
        <ChevronDown size={16} />
      </motion.div>
    </motion.button>
  );
}

/* ── Features section ────────────────────────────────────────── */
function FeaturesSection() {
  const feats = [
    { icon: '⚡', title: 'Under 50ms Latency', desc: 'Strokes appear across the world in real time.' },
    { icon: '🤖', title: '6 AI Creative Agents', desc: 'Brainstorm, refine, and generate ideas with AI.' },
    { icon: '🔒', title: 'Private Rooms', desc: 'Invite-only or password-protected sessions.' },
    { icon: '♾️', title: 'Infinite Canvas', desc: 'Zoom and pan with absolutely no boundaries.' },
    { icon: '☁️', title: 'Auto-Save', desc: 'Your work syncs to the cloud automatically.' },
    { icon: '📱', title: 'Works on Mobile', desc: 'Touch-optimized drawing on any device.' },
  ];

  return (
    <section className="relative z-20 py-24 px-6" style={{ background: '#030d06' }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span
            className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-5"
            style={{ background: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}
          >
            <Sparkles size={10} /> Everything You Need
          </span>
          <h2
            className="text-5xl md:text-6xl font-black"
            style={{ color: '#e8f5e9', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}
          >
            Built for{' '}
            <span style={{ color: '#4ade80' }}>Creative Minds</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {feats.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(74,222,128,0.04)',
                border: '1px solid rgba(74,222,128,0.1)',
              }}
            >
              <span className="text-3xl mb-3 block">{f.icon}</span>
              <p className="font-black text-base mb-1.5" style={{ color: '#e8f5e9' }}>{f.title}</p>
              <p className="text-sm" style={{ color: '#4d7a52' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA section ─────────────────────────────────────────────── */
function CTASection() {
  const navigate = useNavigate();
  return (
    <section
      className="relative py-32 px-6 text-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #030d06 0%, #051a09 60%, #0a2e12 100%)' }}
    >
      {/* Ring decorations */}
      {[140, 280, 420].map((r, i) => (
        <div key={i} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{ width: r, height: r, border: '1px solid rgba(74,222,128,0.08)' }} />
      ))}

      <div className="relative z-10 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="text-6xl mb-6">🌿</div>
          <h2
            className="text-5xl md:text-7xl font-black mb-6"
            style={{ color: '#e8f5e9', fontFamily: 'var(--font-display)', lineHeight: 1.05 }}
          >
            Ready to<br />
            <span style={{ color: '#4ade80' }}>Play Together?</span>
          </h2>
          <p className="text-lg mb-10" style={{ color: '#4d7a52' }}>
            Free forever. No download. No signup needed to jump in.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/draw')}
              className="flex items-center gap-2.5 px-10 py-4 rounded-2xl font-black text-base"
              style={{
                background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                color: '#030d06',
                boxShadow: '0 8px 32px #4ade8050',
              }}
            >
              <Pencil size={16} /> Start Drawing Free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/games')}
              className="flex items-center gap-2.5 px-10 py-4 rounded-2xl font-bold text-base"
              style={{
                background: 'transparent',
                color: '#4ade80',
                border: '1.5px solid rgba(74,222,128,0.3)',
              }}
            >
              Browse Games <ArrowRight size={15} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── MAIN ────────────────────────────────────────────────────── */
export default function Home() {
  const navigate   = useNavigate();
  const [active, setActive] = useState(0);
  const scrollRef  = useRef<HTMLDivElement>(null);

  // Auto-cycle active card
  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % GAMES.length), 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ background: '#030d06', minHeight: '100vh', color: '#e8f5e9' }}>

      {/* ── Hero section with 3D forest ── */}
      <section className="relative" style={{ height: '100dvh', minHeight: 600, overflow: 'hidden' }}>

        {/* 3D Canvas background */}
        <div className="absolute inset-0 z-0">
          <Suspense fallback={
            <div className="w-full h-full"
              style={{ background: 'radial-gradient(ellipse at 50% 80%, #0f3320 0%, #030d06 70%)' }} />
          }>
            <ForestScene />
          </Suspense>
        </div>

        {/* Gradient overlay: dark top (for text), transparent middle, dark bottom */}
        <div className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(3,13,6,0.88) 0%, rgba(3,13,6,0.3) 35%, rgba(3,13,6,0.2) 60%, rgba(3,13,6,0.85) 100%)',
          }}
        />

        {/* Falling leaves */}
        <Leaves />

        {/* Navbar — force dark text override via CSS variable trick */}
        <div className="absolute top-0 left-0 right-0 z-30">
          <Navbar />
        </div>

        {/* Hero content */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 pt-16">

          {/* Badge */}
          <motion.span
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-6"
            style={{
              background: 'rgba(74,222,128,0.1)',
              color: '#4ade80',
              border: '1px solid rgba(74,222,128,0.25)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Multiplayer · Free to Play · No Download
          </motion.span>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="text-center font-black leading-[1.0] mb-4"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3rem, 9vw, 6.5rem)',
              color: '#e8f5e9',
              textShadow: '0 4px 40px rgba(0,0,0,0.8)',
            }}
          >
            Play &amp; Draw
            <br />
            <span style={{
              color: '#4ade80',
              textShadow: '0 0 60px rgba(74,222,128,0.4)',
            }}>
              Together
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="text-center text-base md:text-lg mb-8 max-w-md"
            style={{ color: '#4d7a52' }}
          >
            Multiplayer drawing games, infinite canvas, AI tools — all in one forest hideout.
          </motion.p>

          {/* Game cards row */}
          <div
            className="flex gap-3 overflow-x-auto pb-2 mb-8"
            style={{
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
              paddingLeft: 'max(1rem, calc(50vw - 460px))',
              paddingRight: 'max(1rem, calc(50vw - 460px))',
              maxWidth: '100vw',
            }}
          >
            {GAMES.map((g, i) => (
              <GameCard
                key={g.id}
                game={g}
                index={i}
                active={active === i}
                onClick={() => { setActive(i); navigate(g.route); }}
              />
            ))}
          </div>

          {/* Quick join */}
          <QuickJoin />
        </div>

        <ScrollDown onClick={() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' })} />
      </section>

      {/* ── Features & CTA below the fold ── */}
      <div ref={scrollRef}>
        <FeaturesSection />
        <CTASection />
      </div>

      {/* Footer bar */}
      <footer
        className="py-6 text-center text-xs"
        style={{ background: '#020a04', color: '#2d5c35', borderTop: '1px solid #0f2a14' }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#4ade80' }}>
          Point Club
        </span>
        {' · '}
        Made with 🌿 for creators everywhere
      </footer>
    </div>
  );
}
