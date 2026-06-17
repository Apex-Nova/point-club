import { Suspense, useRef, useState, forwardRef, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Users, Swords, HelpCircle, Pencil, Sparkles, Trophy, Palette, Heart,
  Play, ChevronDown, MessageCircle, Star,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

const CopperGolemScene = lazy(() => import('./copper/CopperGolemScene'));
const ScrollHoli       = lazy(() => import('./ScrollHoli'));

/* ── Forest tokens ───────────────────────────────────────────── */
const INK    = '#14301a';   // dark green text
const BROWN  = '#5b4128';   // dark brown text
const CHAR   = '#2c332c';   // charcoal
const LEAF   = '#2f7d3e';   // forest/grass green
const LEAF_D = '#205c2c';
const CREAM  = '#fbf6e9';
const PAGE   = '#f3f8ec';   // cream-white page
const SUN     = '#ffcf5c';  // warm yellow
const SKY     = '#7ec8e3';  // sky blue

/* ════════════════════════════════════════════════════════════
   HERO — full-bleed forest world
   ════════════════════════════════════════════════════════════ */
function Hero({ onExplore }: { onExplore: () => void }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const copyFade = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      style={{
        position: 'relative', minHeight: '100vh', overflow: 'hidden',
        background: `linear-gradient(180deg, ${SKY}33 0%, ${PAGE} 55%, ${PAGE} 100%)`,
      }}
    >
      {/* soft sun glow */}
      <div aria-hidden style={{
        position: 'absolute', top: '-12%', right: '8%', width: 420, height: 420, borderRadius: '50%',
        background: `radial-gradient(circle, ${SUN}88 0%, transparent 65%)`, pointerEvents: 'none', filter: 'blur(8px)',
      }} />

      {/* the living Copper Golem art studio fills the whole screen */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <Suspense fallback={<div style={{ width: '100%', height: '100%' }} />}>
          <CopperGolemScene />
        </Suspense>
      </div>

      <Navbar />

      {/* hero copy — centered, floats above the world */}
      <motion.div
        style={{
          position: 'relative', zIndex: 10, y: copyY, opacity: copyFade,
          maxWidth: 760, margin: '0 auto', textAlign: 'center',
          padding: '150px 28px 0', pointerEvents: 'none',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase',
            color: LEAF_D, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(6px)',
            border: `1px solid ${LEAF}33`, borderRadius: 99, padding: '7px 16px', marginBottom: 22,
            boxShadow: '0 4px 14px rgba(32,92,44,0.12)',
          }}
        >
          <Sparkles size={13} /> A creative forest playground
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
          style={{
            fontFamily: 'var(--font-display)', fontWeight: 900, lineHeight: 1.02,
            fontSize: 'clamp(2.8rem, 7vw, 5.6rem)', color: INK, margin: '0 0 18px',
            letterSpacing: '-0.02em', textShadow: '0 2px 20px rgba(251,246,233,0.8)',
          }}
        >
          Create. Play.<br />
          <span style={{ color: LEAF }}>Imagine.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6 }}
          style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: BROWN, lineHeight: 1.6, margin: '0 auto 34px', maxWidth: 480, fontWeight: 600, textShadow: '0 1px 12px rgba(251,246,233,0.9)' }}
        >
          Step into a magical forest where you draw, play, and build worlds together with friends.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }}
          style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', pointerEvents: 'auto' }}
        >
          <motion.button
            whileHover={{ y: -3, scale: 1.03 }} whileTap={{ scale: 0.96 }}
            onClick={onExplore}
            style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '15px 32px', borderRadius: 16,
              background: LEAF, color: '#fff', fontWeight: 800, fontSize: 16, border: 'none', cursor: 'pointer',
              boxShadow: `0 8px 0 ${LEAF_D}, 0 14px 28px rgba(32,92,44,0.35)`,
            }}
          >
            <Play size={16} fill="#fff" /> Explore Games
          </motion.button>
          <motion.button
            whileHover={{ y: -3, scale: 1.03 }} whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/communities')}
            style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '15px 32px', borderRadius: 16,
              background: '#fff', color: INK, fontWeight: 800, fontSize: 16, cursor: 'pointer',
              border: `2px solid ${LEAF}33`, boxShadow: '0 8px 0 rgba(20,48,26,0.10), 0 14px 28px rgba(0,0,0,0.08)',
            }}
          >
            <Users size={16} /> Join Community
          </motion.button>
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.button
        onClick={onExplore}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        style={{
          position: 'absolute', bottom: 26, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          color: LEAF_D, background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Begin the adventure
        </span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.7 }}>
          <ChevronDown size={20} />
        </motion.div>
      </motion.button>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   INTERACTIVE WORLD — meet the robot artist
   ════════════════════════════════════════════════════════════ */
function InteractiveWorld() {
  return (
    <section style={{ background: PAGE, padding: '110px 28px', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', top: '20%', left: '-6%', width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${SKY}44, transparent 65%)` }} />
      <div style={{ maxWidth: 980, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <motion.p
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: LEAF, margin: '0 0 14px' }}
        >
          A living world
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}
          style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', color: INK, margin: '0 0 18px', lineHeight: 1.08 }}
        >
          Meet your robot artist
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          style={{ fontSize: 17, color: BROWN, lineHeight: 1.7, maxWidth: 520, margin: '0 auto 44px' }}
        >
          He strolls through the clearing, paints little masterpieces, and waves when you say hello. Tap him in the scene above to see what happens!
        </motion.p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, maxWidth: 760, margin: '0 auto' }}>
          {[
            { icon: Heart, c: '#ff6b8a', t: 'He waves hello', d: 'Reacts to your cursor and clicks' },
            { icon: Palette, c: LEAF, t: 'He paints', d: 'Splashes of colour on his easel' },
            { icon: Sparkles, c: SUN, t: 'Holi bursts', d: 'Festival colour clouds fly out' },
          ].map((f, i) => (
            <motion.div
              key={f.t}
              initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              style={{ background: '#fff', borderRadius: 22, padding: '26px 20px', border: `1.5px solid ${LEAF}1f`, boxShadow: '0 8px 24px rgba(20,48,26,0.06)' }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 16, background: `${f.c}1f`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <f.icon size={26} style={{ color: f.c }} />
              </div>
              <p style={{ fontWeight: 800, color: INK, margin: '0 0 4px', fontSize: 16 }}>{f.t}</p>
              <p style={{ color: BROWN, margin: 0, fontSize: 13.5, lineHeight: 1.5 }}>{f.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   FEATURES — expandable 3D-ish icons
   ════════════════════════════════════════════════════════════ */
const FEATURES = [
  { id: 'draw', icon: Pencil, c: LEAF, t: 'Drawing', d: 'A boundless canvas that follows your imagination, anywhere you scroll.' },
  { id: 'multi', icon: Users, c: SKY, t: 'Multiplayer', d: 'Draw side by side with friends in real time — every stroke appears instantly.' },
  { id: 'compete', icon: Trophy, c: SUN, t: 'Competition', d: 'Battle on the same prompt and let the crowd vote for the winner.' },
  { id: 'create', icon: Palette, c: '#ff6b8a', t: 'Creativity', d: 'Brushes, colours and tools made for big ideas and tiny doodles alike.' },
  { id: 'community', icon: Heart, c: '#9b5de5', t: 'Community', d: 'A friendly place to share, cheer each other on, and grow together.' },
];

function FeatureIcon({ f, open, onToggle }: { f: typeof FEATURES[0]; open: boolean; onToggle: () => void }) {
  return (
    <motion.button
      onClick={onToggle}
      initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      whileHover={{ y: -8, rotateX: 8, rotateY: -8 }}
      whileTap={{ scale: 0.96 }}
      style={{
        flex: open ? '1 1 100%' : '1 1 150px', minWidth: 140, maxWidth: open ? 520 : 200,
        background: '#fff', border: `1.5px solid ${open ? f.c : `${f.c}33`}`, borderRadius: 24,
        padding: '24px 18px', cursor: 'pointer', textAlign: 'center', transformStyle: 'preserve-3d', perspective: 600,
        boxShadow: open ? `0 16px 40px ${f.c}33` : '0 6px 18px rgba(20,48,26,0.06)', transition: 'flex 0.3s, max-width 0.3s',
      }}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
        style={{
          width: 72, height: 72, margin: '0 auto 14px', borderRadius: 20,
          background: `linear-gradient(145deg, ${f.c}, ${f.c}bb)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 10px 22px ${f.c}55, inset 0 2px 0 rgba(255,255,255,0.4)`,
        }}
      >
        <f.icon size={34} color="#fff" strokeWidth={2} />
      </motion.div>
      <p style={{ fontWeight: 800, color: INK, margin: 0, fontSize: 16 }}>{f.t}</p>
      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', color: BROWN, fontSize: 14, lineHeight: 1.6, margin: '12px auto 0', maxWidth: 380 }}
          >
            {f.d}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function Features() {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <section style={{ background: `linear-gradient(180deg, ${PAGE}, ${CREAM})`, padding: '100px 28px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
        <motion.h2
          initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', color: INK, margin: '0 0 12px' }}
        >
          Everything to create
        </motion.h2>
        <p style={{ color: BROWN, fontSize: 16, margin: '0 auto 48px', maxWidth: 440 }}>
          Tap an icon to peek inside. The rest you discover by playing.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', alignItems: 'flex-start' }}>
          {FEATURES.map(f => (
            <FeatureIcon key={f.id} f={f} open={openId === f.id} onToggle={() => setOpenId(o => (o === f.id ? null : f.id))} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   COMMUNITY
   ════════════════════════════════════════════════════════════ */
function Community() {
  const navigate = useNavigate();
  return (
    <section style={{ background: CREAM, padding: '100px 28px', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', bottom: '-10%', right: '-6%', width: 320, height: 320, borderRadius: '50%', background: `radial-gradient(circle, ${SUN}55, transparent 65%)` }} />
      <div style={{ maxWidth: 920, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <motion.div
          initial={{ scale: 0, rotate: -20 }} whileInView={{ scale: 1, rotate: 0 }} viewport={{ once: true }}
          style={{ width: 64, height: 64, borderRadius: 20, background: '#9b5de5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 24px rgba(155,93,229,0.4)' }}
        >
          <MessageCircle size={30} color="#fff" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', color: INK, margin: '0 0 16px' }}
        >
          Better together
        </motion.h2>
        <p style={{ color: BROWN, fontSize: 17, lineHeight: 1.7, maxWidth: 520, margin: '0 auto 36px' }}>
          Thousands of young creators share drawings, cheer each other on, and team up every day. Bring your friends — there's always room by the campfire.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
          {[
            { v: '20+', l: 'Per room' },
            { v: '< 50ms', l: 'Latency' },
            { v: 'Free', l: 'To play' },
            { v: '4.9★', l: 'Loved' },
          ].map(s => (
            <div key={s.l} style={{ background: '#fff', borderRadius: 16, padding: '14px 22px', border: `1.5px solid ${LEAF}1f`, boxShadow: '0 4px 14px rgba(20,48,26,0.05)' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, color: LEAF, fontSize: 22, margin: 0 }}>{s.v}</p>
              <p style={{ color: BROWN, fontSize: 12, margin: 0 }}>{s.l}</p>
            </div>
          ))}
        </div>
        <motion.button
          whileHover={{ y: -3, scale: 1.03 }} whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/communities')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 32px', borderRadius: 16,
            background: '#9b5de5', color: '#fff', fontWeight: 800, fontSize: 16, border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 0 #7d3fd0, 0 14px 28px rgba(155,93,229,0.35)',
          }}
        >
          <Heart size={16} fill="#fff" /> Join the Community
        </motion.button>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   GAMES DISCOVERY
   ════════════════════════════════════════════════════════════ */
const GAMES = [
  { id: 'canvas', Icon: Users, label: 'Drawing Board', c: LEAF, desc: 'Up to 20 friends on one infinite canvas, live.', route: '/draw', cta: 'Create Room' },
  { id: 'scribble', Icon: HelpCircle, label: 'Scribble Game', c: SKY, desc: 'One draws, everyone guesses. Fastest wins!', route: '/games', cta: 'Play Now' },
  { id: 'sandbox', Icon: Palette, label: 'Creative Sandbox', c: SUN, desc: 'A free space to doodle with no rules at all.', route: '/draw', cta: 'Start Doodling' },
  { id: 'challenge', Icon: Swords, label: 'Community Challenges', c: '#ff6b8a', desc: 'Themed prompts the whole forest votes on.', route: '/games', cta: 'Join Challenge' },
];

function GameCard({ g, delay }: { g: typeof GAMES[0]; delay: number }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const Icon = g.Icon;
  return (
    <motion.article
      initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => setOpen(v => !v)}
      whileHover={{ y: -10, rotate: open ? 0 : -1 }}
      style={{
        background: '#fff', border: `1.5px solid ${open ? g.c : `${g.c}33`}`, borderRadius: 26, overflow: 'hidden',
        cursor: 'pointer', userSelect: 'none',
        boxShadow: open ? `0 18px 44px ${g.c}33` : '0 6px 20px rgba(20,48,26,0.07)',
      }}
    >
      <div style={{ height: 5, background: g.c }} />
      <div style={{ padding: '28px 22px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
        <motion.div
          animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2.6, delay }}
          style={{ width: 76, height: 76, borderRadius: 22, background: `linear-gradient(145deg, ${g.c}, ${g.c}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 12px 24px ${g.c}55, inset 0 2px 0 rgba(255,255,255,0.4)` }}
        >
          <Icon size={36} color="#fff" strokeWidth={1.8} />
        </motion.div>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, color: INK, fontSize: 18, margin: 0 }}>{g.label}</p>
        <span style={{ fontSize: 11, color: g.c, fontWeight: 700, opacity: 0.85 }}>
          {open ? '▲ close' : '▼ tap to reveal'}
        </span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.26 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 14, color: BROWN, lineHeight: 1.6, margin: 0 }}>{g.desc}</p>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={e => { e.stopPropagation(); navigate(g.route); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 20px', borderRadius: 13, background: g.c, color: '#fff', fontWeight: 800, fontSize: 13.5, border: 'none', cursor: 'pointer', width: '100%' }}
              >
                <Play size={13} fill="#fff" /> {g.cta}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

const GamesSection = forwardRef<HTMLElement>((_, ref) => (
  <section ref={ref} style={{ background: `linear-gradient(180deg, ${CREAM}, ${PAGE})`, padding: '100px 28px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ maxWidth: 1040, margin: '0 auto', position: 'relative' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        style={{ textAlign: 'center', marginBottom: 52 }}
      >
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: LEAF, margin: '0 0 14px' }}>
          <Star size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} /> Discover the games
        </p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', color: INK, margin: 0, lineHeight: 1.08 }}>
          Pick your adventure
        </h2>
        <p style={{ fontSize: 16, color: BROWN, margin: '14px auto 0', maxWidth: 420 }}>
          Tap a card to see what's inside, then jump right in.
        </p>
      </motion.div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 22 }}>
        {GAMES.map((g, i) => <GameCard key={g.id} g={g} delay={i * 0.07} />)}
      </div>
    </div>
  </section>
));
GamesSection.displayName = 'GamesSection';

/* ── Footer ──────────────────────────────────────────────────── */
function Footer() {
  const navigate = useNavigate();
  return (
    <footer style={{ background: INK, color: CREAM, padding: '64px 28px 40px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, margin: '0 0 10px' }}>
        Point Club
      </p>
      <p style={{ color: '#a9c9ad', fontSize: 15, margin: '0 0 28px', maxWidth: 380, marginInline: 'auto', lineHeight: 1.6 }}>
        A creative forest playground where every visit becomes an adventure.
      </p>
      <motion.button
        whileHover={{ y: -2, scale: 1.03 }} whileTap={{ scale: 0.96 }}
        onClick={() => navigate('/draw')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 14, background: SUN, color: INK, fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', marginBottom: 32 }}
      >
        <Pencil size={15} /> Start Creating Free
      </motion.button>
      <p style={{ color: '#6e8c72', fontSize: 12, margin: 0 }}>
        © {new Date().getFullYear()} Point Club · Built for creators everywhere
      </p>
    </footer>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function Home() {
  const gamesRef = useRef<HTMLElement>(null);
  return (
    <div style={{ background: PAGE, color: CHAR }}>
      <Suspense fallback={null}>
        <ScrollHoli />
      </Suspense>
      <Hero onExplore={() => gamesRef.current?.scrollIntoView({ behavior: 'smooth' })} />
      <InteractiveWorld />
      <Features />
      <Community />
      <GamesSection ref={gamesRef} />
      <Footer />
    </div>
  );
}
