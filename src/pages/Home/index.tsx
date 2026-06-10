import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Pencil, Users, Shuffle, Lock, Maximize2, Lightbulb, Save,
  DoorOpen, UserPlus, Bot, Swords, HelpCircle, Globe,
  Sparkles, ChevronDown, ChevronUp, ArrowRight,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
// usePlatformStats available for future community/stats slides
// import { usePlatformStats } from '@/hooks/usePlatformStats';

/* ── Slide transition variants ──────────────────────────── */
const VARIANTS = {
  enter: (dir: number) => ({
    y: dir > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (dir: number) => ({
    y: dir > 0 ? '-8%' : '8%',
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.48, ease: [0.4, 0, 0.2, 1] },
  }),
};

const stagger = (i: number) => ({
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as number[] },
  },
});

/* ── Scroll hint ────────────────────────────────────────── */
function ScrollHint({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
      onClick={onClick}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 hover:text-lavender-dark transition-colors group"
    >
      <span className="text-[10px] font-bold tracking-widest uppercase group-hover:text-lavender-dark">{label}</span>
      <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
        <ChevronDown size={18} />
      </motion.div>
    </motion.button>
  );
}

/* ══════════════════════════════════════════════════════════
   SLIDE 1 — HERO
══════════════════════════════════════════════════════════ */
function HeroSlide({ onNext }: { onNext: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="h-full flex items-center justify-center px-6 pt-16 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #f5f2ff 0%, #fdf6f4 50%, #f2f9ff 100%)' }}
    >
      {/* Soft radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 42%, rgb(139 120 224 / 0.12) 0%, transparent 70%),' +
            'radial-gradient(ellipse 45% 35% at 20% 75%, rgb(242 112 89 / 0.07) 0%, transparent 65%),' +
            'radial-gradient(ellipse 40% 30% at 82% 22%, rgb(125 211 178 / 0.08) 0%, transparent 60%)',
        }}
      />

      {/* ── Subtle doodles ── */}
      {/* top-left arch */}
      <svg className="absolute top-14 left-10 opacity-[0.15] pointer-events-none" width="80" height="50" viewBox="0 0 80 50">
        <path d="M5 45 Q 40 -5 75 45" fill="none" stroke="#8b78e0" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
      {/* top-right star outline */}
      <svg className="absolute top-20 right-16 opacity-[0.18] pointer-events-none" width="36" height="36" viewBox="0 0 36 36">
        <path d="M18 2 L21 13 L32 13 L23 20 L26 31 L18 24 L10 31 L13 20 L4 13 L15 13 Z" fill="none" stroke="#f27059" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
      {/* right side dot grid */}
      <svg className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.18] pointer-events-none" width="28" height="100" viewBox="0 0 28 100">
        {[[7,10],[21,10],[7,30],[21,30],[7,50],[21,50],[7,70],[21,70],[7,90],[21,90]].map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy} r="3" fill={['#8b78e0','#f9c784','#7dd3b2','#87c5e8','#f27059','#8b78e0','#f9c784','#7dd3b2','#87c5e8','#f27059'][i]}/>
        ))}
      </svg>
      {/* left side dot grid */}
      <svg className="absolute left-8 top-1/2 -translate-y-1/2 opacity-[0.18] pointer-events-none" width="28" height="100" viewBox="0 0 28 100">
        {[[7,10],[21,10],[7,30],[21,30],[7,50],[21,50],[7,70],[21,70],[7,90],[21,90]].map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy} r="3" fill={['#f27059','#8b78e0','#f9c784','#7dd3b2','#87c5e8','#f27059','#8b78e0','#f9c784','#7dd3b2','#87c5e8'][i]}/>
        ))}
      </svg>
      {/* bottom-left wavy line */}
      <svg className="absolute bottom-20 left-16 opacity-[0.14] pointer-events-none" width="100" height="30" viewBox="0 0 100 30">
        <path d="M0 15 Q 12 5 25 15 Q 37 25 50 15 Q 62 5 75 15 Q 87 25 100 15" fill="none" stroke="#7dd3b2" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      {/* bottom-right diamond */}
      <svg className="absolute bottom-24 right-20 opacity-[0.14] pointer-events-none" width="30" height="30" viewBox="0 0 30 30">
        <polygon points="15,2 28,15 15,28 2,15" fill="none" stroke="#f9c784" strokeWidth="2"/>
      </svg>
      {/* top-center tiny sparkle */}
      <svg className="absolute top-10 left-1/2 -translate-x-1/2 opacity-[0.12] pointer-events-none" width="20" height="20" viewBox="0 0 20 20">
        <path d="M10 1 L11.5 8.5 L19 10 L11.5 11.5 L10 19 L8.5 11.5 L1 10 L8.5 8.5 Z" fill="#8b78e0"/>
      </svg>

      {/* ── Main content ── */}
      <div className="max-w-2xl mx-auto w-full flex flex-col items-center text-center gap-6 relative z-10">

        <motion.span variants={stagger(0)} initial="hidden" animate="visible"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-lavender/30 text-lavender-dark text-[11px] font-bold uppercase tracking-widest shadow-sm backdrop-blur-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
          Now in Beta · Free to Start
          <Sparkles size={10} />
        </motion.span>

        <motion.h1 variants={stagger(1)} initial="hidden" animate="visible"
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.06] tracking-tight text-gray-900"
        >
          Draw Together.<br />
          <span className="text-lavender-dark">Think Together.</span>
        </motion.h1>

        <motion.p variants={stagger(2)} initial="hidden" animate="visible"
          className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-lg"
        >
          A collaborative canvas for creative minds — real-time drawing, AI tools, games, and community. All in one place.
        </motion.p>

        <motion.div variants={stagger(3)} initial="hidden" animate="visible"
          className="flex flex-wrap gap-3 justify-center"
        >
          <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/draw')}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-lavender text-white font-bold text-base shadow-[0_4px_20px_rgb(139_120_224/0.40)] hover:bg-lavender-dark transition-colors"
          >
            <Pencil size={16} /> Start Drawing Free
          </motion.button>
          <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={onNext}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-white/70 border border-[#ddd6cd] text-gray-700 font-semibold text-base hover:border-lavender hover:text-lavender-dark transition-colors shadow-[0_2px_12px_rgb(0_0_0/0.06)] backdrop-blur-sm"
          >
            Explore Features <ArrowRight size={15} />
          </motion.button>
        </motion.div>
      </div>

      <ScrollHint label="Features" onClick={onNext} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SLIDE 2 — FEATURES
══════════════════════════════════════════════════════════ */
const FEATURES = [
  { icon: Users,     title: 'Multiplayer Drawing',       sub: 'Up to 20 people, one canvas',          accent: '#8b78e0', bg: 'bg-lavender-light' },
  { icon: Lightbulb, title: 'AI Brainstorming',          sub: '6 specialized creative AI agents',      accent: '#f27059', bg: 'bg-coral/15'       },
  { icon: Maximize2, title: 'Infinite Canvas',           sub: 'Pan & zoom with no boundaries',         accent: '#7dd3b2', bg: 'bg-mint/25'         },
  { icon: Lock,      title: 'Private Rooms',             sub: 'Password or invite-only access',        accent: '#87c5e8', bg: 'bg-sky/25'          },
  { icon: Shuffle,   title: 'Creative Matchmaking',      sub: 'Instant pairing with like-minded artists', accent: '#f9c784', bg: 'bg-peach/40'    },
  { icon: Save,      title: 'Auto-Save & Sync',          sub: 'Cloud-synced, works offline too',       accent: '#8b78e0', bg: 'bg-lavender-light'  },
];

function FeaturesSlide({ onNext }: { onNext: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 pt-16 bg-[#f2eeff] relative">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full bg-lavender-light text-lavender-dark shadow-sm mb-5">
            Everything You Need
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)' }}
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight"
          >
            Built for Creatives
          </h2>
          <div className="h-[3px] w-12 rounded-full bg-gradient-to-r from-lavender to-coral mx-auto" />
        </motion.div>

        {/* Feature grid — 3 cols, 2 rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 28, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.06 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="group bg-white rounded-2xl p-6 border border-[#e4ddd3] shadow-[0_4px_20px_rgb(0_0_0/0.09)] hover:shadow-[0_14px_40px_rgb(0_0_0/0.13)] hover:-translate-y-1.5 transition-all duration-300 cursor-default"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110`}
                    style={{ boxShadow: `0 4px 14px ${f.accent}35` }}
                  >
                    <Icon size={20} style={{ color: f.accent }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm leading-snug mb-1">{f.title}</p>
                    <p className="text-[12px] text-gray-500 leading-snug">{f.sub}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

      <ScrollHint label="How It Works" onClick={onNext} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SLIDE 3 — HOW IT WORKS
══════════════════════════════════════════════════════════ */
const STEPS = [
  {
    number: '01', icon: DoorOpen, title: 'Create a Room',
    description: 'Start a new canvas in seconds. Name your room, choose a theme, set it public or private.',
    tip: 'Takes ~10 seconds', color: 'bg-lavender', glow: 'rgb(139 120 224 / 0.28)', accent: '#8b78e0',
  },
  {
    number: '02', icon: UserPlus, title: 'Invite Friends',
    description: 'Share a simple link. Collaborators join instantly — no account required.',
    tip: 'No download needed', color: 'bg-coral', glow: 'rgb(242 112 89 / 0.28)', accent: '#f27059',
  },
  {
    number: '03', icon: Pencil, title: 'Draw Together',
    description: 'See every stroke in real time. Voice, AI agents, and smart tools included.',
    tip: 'Live, under 50ms', color: 'bg-mint', glow: 'rgb(125 211 178 / 0.28)', accent: '#7dd3b2',
  },
];

function HowItWorksSlide({ onNext }: { onNext: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 pt-16 bg-[#f6fffe] relative">
      <div className="max-w-5xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full bg-mint/25 text-emerald-700 shadow-sm mb-4">
            Simple as 1-2-3
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)' }}
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-4"
          >
            How It Works
          </h2>
          <div className="h-[3px] w-12 rounded-full bg-gradient-to-r from-lavender to-coral mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.title}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.12 + i * 0.14 }}
                className="bg-white rounded-3xl p-9 border border-[#e4ddd3] shadow-[0_4px_20px_rgb(0_0_0/0.09)] flex flex-col items-center text-center relative"
              >
                <span
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest px-3 py-1 rounded-full text-white"
                  style={{ background: step.accent }}
                >
                  {step.number}
                </span>
                <div
                  className={`w-18 h-18 rounded-3xl ${step.color} flex items-center justify-center mb-6`}
                  style={{ boxShadow: `0 12px 36px ${step.glow}`, width: '4.5rem', height: '4.5rem' }}
                >
                  <Icon size={30} className="text-white" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)' }}
                  className="text-2xl font-bold text-gray-900 mb-3"
                >
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">{step.description}</p>
                <span
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: `${step.accent}18`, color: step.accent }}
                >
                  ✓ {step.tip}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <ScrollHint label="Platform" onClick={onNext} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SLIDE 4 — PLATFORM FEATURES
══════════════════════════════════════════════════════════ */
const PLATFORM = [
  { icon: Bot,         title: 'AI Drawing Assistant', desc: '6 specialized AI creative agents',       accent: '#8b78e0', bg: 'bg-lavender-light', status: 'live'   },
  { icon: Swords,      title: 'Scribble Battles',      desc: 'Fast-paced drawing competitions',        accent: '#f27059', bg: 'bg-coral/12',       status: 'live'   },
  { icon: HelpCircle,  title: 'Guess The Drawing',     desc: 'Classic drawing game, reimagined',       accent: '#7dd3b2', bg: 'bg-mint/20',         status: 'live'   },
  { icon: Globe,       title: 'Infinite World Canvas', desc: 'One shared community canvas, forever',   accent: '#87c5e8', bg: 'bg-sky/20',          status: 'live'   },
];

function PlatformSlide({ onNext }: { onNext: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 pt-16 bg-[#fff9f8] relative">
      <div className="max-w-5xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full bg-peach/35 text-orange-600 shadow-sm mb-4">
            What's Inside
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)' }}
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-4"
          >
            Platform Features
          </h2>
          <div className="h-[3px] w-12 rounded-full bg-gradient-to-r from-lavender to-coral mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PLATFORM.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
                className="bg-white rounded-2xl p-7 border border-[#e4ddd3] shadow-[0_4px_20px_rgb(0_0_0/0.09)] flex items-center gap-5"
                style={{ borderTop: `3px solid ${item.accent}` }}
              >
                <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center shrink-0`}
                  style={{ boxShadow: `0 6px 18px ${item.accent}35` }}
                >
                  <Icon size={26} style={{ color: item.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 style={{ fontFamily: 'var(--font-display)' }}
                      className="text-xl font-bold text-gray-900 leading-snug"
                    >
                      {item.title}
                    </h3>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                      ✓ Live
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <ScrollHint label="Get Started" onClick={onNext} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SLIDE 6 — GET STARTED
══════════════════════════════════════════════════════════ */
function GetStartedSlide() {
  const navigate = useNavigate();
  return (
    <div
      className="h-full flex flex-col items-center justify-center px-6 pt-16 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #6b57c8 0%, #8b78e0 40%, #b8a9f0 100%)' }}
    >
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/8 blur-sm" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white/6" />
      <div className="absolute top-16 right-24 w-28 h-28 rounded-full bg-coral/20" />
      <div className="absolute top-8 right-12 opacity-15">
        <svg width="56" height="56" viewBox="0 0 56 56">
          <path d="M28 2 Q 32 18 52 28 Q 32 38 28 54 Q 24 38 4 28 Q 24 18 28 2Z" fill="white" />
        </svg>
      </div>

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <Sparkles size={14} className="text-white/70" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/70">
            Free Forever · No Credit Card
          </span>
          <Sparkles size={14} className="text-white/70" />
        </motion.div>

        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-[1.05]"
        >
          Ready to Draw<br />Together?
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-xl text-white/80 mb-10 max-w-lg mx-auto leading-relaxed"
        >
          Start creating in seconds. No setup, no friction — just you and a blank canvas.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/draw')}
            className="flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-white text-lavender-dark font-bold text-base hover:bg-cream transition-colors shadow-[0_6px_24px_rgb(0_0_0/0.25)]"
          >
            <Pencil size={18} /> Start Drawing Free
          </motion.button>
          <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            className="flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-white/15 text-white font-semibold text-base hover:bg-white/25 transition-colors border border-white/30"
          >
            Sign In <ArrowRight size={16} />
          </motion.button>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/40 text-xs font-medium"
      >
        <ChevronUp size={14} /> Scroll up to go back
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SLIDE REGISTRY
══════════════════════════════════════════════════════════ */
const SLIDE_LABELS = [
  'Intro',
  'Features',
  'How It Works',
  'Platform',
  'Get Started',
];

/* ══════════════════════════════════════════════════════════
   MAIN HOME PAGE
══════════════════════════════════════════════════════════ */
export default function Home() {
  const [slide, setSlide] = useState(0);
  const [dir, setDir]     = useState(1);
  const lockRef           = useRef(false);
  const touchRef          = useRef(0);

  const goTo = useCallback((next: number) => {
    if (lockRef.current) return;
    const clamped = Math.max(0, Math.min(SLIDE_LABELS.length - 1, next));
    if (clamped === slide) return;
    lockRef.current = true;
    setDir(clamped > slide ? 1 : -1);
    setSlide(clamped);
    setTimeout(() => { lockRef.current = false; }, 880);
  }, [slide]);

  const onNext = useCallback(() => goTo(slide + 1), [goTo, slide]);

  // Wheel
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 15) return;
      goTo(e.deltaY > 0 ? slide + 1 : slide - 1);
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [goTo, slide]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(slide + 1); }
      if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); goTo(slide - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, slide]);

  // Touch swipe
  useEffect(() => {
    const onStart = (e: TouchEvent) => { touchRef.current = e.touches[0].clientY; };
    const onEnd   = (e: TouchEvent) => {
      const diff = touchRef.current - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 60) goTo(diff > 0 ? slide + 1 : slide - 1);
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend',   onEnd,   { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend',   onEnd);
    };
  }, [goTo, slide]);

  const renderSlide = () => {
    switch (slide) {
      case 0: return <HeroSlide       onNext={onNext} />;
      case 1: return <FeaturesSlide   onNext={onNext} />;
      case 2: return <HowItWorksSlide onNext={onNext} />;
      case 3: return <PlatformSlide   onNext={onNext} />;
      case 4: return <GetStartedSlide />;
      default: return <HeroSlide onNext={onNext} />;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Navbar />

      {/* Slides */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={slide}
          custom={dir}
          variants={VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 overflow-hidden"
        >
          {renderSlide()}
        </motion.div>
      </AnimatePresence>

      {/* Right-side progress dots */}
      <nav
        aria-label="Slide navigation"
        className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3"
      >
        {SLIDE_LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => goTo(i)}
            title={label}
            className="group relative flex items-center justify-end"
          >
            <span className="absolute right-7 opacity-0 group-hover:opacity-100 text-[11px] font-semibold text-gray-700 bg-white rounded-lg px-2.5 py-1 shadow-md whitespace-nowrap transition-all duration-200 translate-x-1 group-hover:translate-x-0">
              {label}
            </span>
            <motion.div
              animate={{
                width:  i === slide ? 10 : 8,
                height: i === slide ? 10 : 8,
                backgroundColor: i === slide ? '#8b78e0' : '#d1c9c1',
              }}
              transition={{ duration: 0.25 }}
              className="rounded-full"
              style={{
                boxShadow: i === slide ? '0 0 0 3px rgba(139,120,224,0.25)' : 'none',
              }}
            />
          </button>
        ))}
      </nav>

      {/* Slide counter */}
      <div className="fixed bottom-6 right-6 z-50 font-mono text-xs font-bold text-gray-400 tabular-nums select-none">
        {String(slide + 1).padStart(2, '0')} / {String(SLIDE_LABELS.length).padStart(2, '0')}
      </div>

      {/* Left slide title indicator */}
      <motion.div
        key={`label-${slide}`}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.4 }}
        className="fixed bottom-6 left-6 z-50 text-xs font-bold text-gray-400 uppercase tracking-widest select-none"
      >
        {SLIDE_LABELS[slide]}
      </motion.div>
    </div>
  );
}
