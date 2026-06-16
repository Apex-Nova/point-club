import { Suspense, useRef, useState, forwardRef, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Swords, HelpCircle, Globe, Pencil,
  ArrowRight, Plus, DoorOpen, Play, ChevronDown,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

const DrawScene = lazy(() => import('./DrawScene'));

/* ─── tokens ──────────────────────────────────────────────── */
const INK  = '#111c0e';
const SAGE = '#3b5c35';
const PAGE = '#f6fbf2';

/* ─── colorful background blobs ──────────────────────────── */
function Blobs() {
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }} aria-hidden>
      <div style={{ position:'absolute', top:-120, left:-100, width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle, rgba(247,37,133,0.15) 0%, transparent 65%)' }}/>
      <div style={{ position:'absolute', top:-80, right:-80, width:340, height:340, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,190,11,0.2) 0%, transparent 65%)' }}/>
      <div style={{ position:'absolute', bottom:-100, left:'18%', width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle, rgba(6,214,160,0.18) 0%, transparent 65%)' }}/>
      <div style={{ position:'absolute', bottom:-80, right:-60, width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(114,9,183,0.13) 0%, transparent 65%)' }}/>
      <div style={{ position:'absolute', top:'38%', left:-80, width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle, rgba(251,86,7,0.12) 0%, transparent 65%)' }}/>
      <div style={{ position:'absolute', top:'25%', right:-60, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(58,134,255,0.14) 0%, transparent 65%)' }}/>
    </div>
  );
}

/* ─── hero section ────────────────────────────────────────── */
function Hero({ onScrollToGames }: { onScrollToGames: () => void }) {
  const navigate   = useNavigate();
  const [joining, setJoining] = useState(false);
  const [code, setCode]       = useState('');

  return (
    <section style={{ position:'relative', minHeight:'100vh', background: PAGE, overflow:'hidden' }}>
      <Blobs />

      {/* fixed navbar lives above everything */}
      <Navbar />

      {/* hero body — two columns */}
      <div style={{
        position:'relative', zIndex:10,
        maxWidth:1200, margin:'0 auto',
        padding:'140px 40px 100px',
        display:'flex', flexWrap:'wrap',
        alignItems:'center', gap:48,
      }}>

        {/* ── LEFT: copy ── */}
        <div style={{ flex:'1 1 360px', minWidth:0, maxWidth:560 }}>

          {/* eyebrow */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            fontSize:11, fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase',
            color:'#7209b7', background:'rgba(114,9,183,0.09)',
            border:'1px solid rgba(114,9,183,0.2)',
            borderRadius:99, padding:'6px 14px',
            marginBottom:24,
          }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#7209b7' }}/>
            Creative Multiplayer Games
          </div>

          {/* headline */}
          <h1 style={{
            fontFamily:'var(--font-display)',
            fontSize:'clamp(2.6rem, 5.5vw, 4.8rem)',
            fontWeight:900, lineHeight:1.05,
            color: INK, margin:'0 0 20px',
            letterSpacing:'-0.02em',
          }}>
            Draw, Play &amp;<br/>
            <span style={{ color:'#1a7a36' }}>Create Together</span>
          </h1>

          {/* sub */}
          <p style={{ fontSize:17, color: SAGE, lineHeight:1.68, margin:'0 0 32px', maxWidth:440 }}>
            Real-time multiplayer drawing games, an infinite canvas, and AI tools — all in one place. Free to start.
          </p>

          {/* CTAs */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:28 }}>
            <button
              onClick={() => navigate('/draw')}
              style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'13px 28px', borderRadius:14,
                background:'#1a7a36', color:'#fff',
                fontWeight:800, fontSize:15,
                boxShadow:'0 4px 18px rgba(26,122,54,0.32)',
                border:'none', cursor:'pointer',
              }}
            >
              <Pencil size={15}/> Start Drawing Free
            </button>
            <button
              onClick={onScrollToGames}
              style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'13px 28px', borderRadius:14,
                background:'transparent', color: INK,
                fontWeight:700, fontSize:15,
                border:'1.5px solid rgba(17,28,14,0.2)',
                cursor:'pointer',
              }}
            >
              See Games <ArrowRight size={14}/>
            </button>
          </div>

          {/* join room */}
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:28 }}>
            {!joining ? (
              <button
                onClick={() => setJoining(true)}
                style={{
                  display:'flex', alignItems:'center', gap:7,
                  fontSize:13, fontWeight:600, color: SAGE,
                  background:'rgba(26,122,54,0.07)',
                  border:'1px solid rgba(26,122,54,0.2)',
                  borderRadius:10, padding:'8px 16px', cursor:'pointer',
                }}
              >
                <DoorOpen size={14}/> Join a room
              </button>
            ) : (
              <div style={{ display:'flex', gap:8 }}>
                <input
                  autoFocus
                  placeholder="Enter room code…"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && code.trim()) navigate(`/room/${code.trim()}`);
                    if (e.key === 'Escape') { setJoining(false); setCode(''); }
                  }}
                  maxLength={8}
                  style={{
                    padding:'8px 14px', borderRadius:10, width:160,
                    border:'1.5px solid rgba(26,122,54,0.4)',
                    background:'#fff', color: INK,
                    fontFamily:'monospace', fontWeight:700,
                    fontSize:14, outline:'none',
                  }}
                />
                <button
                  onClick={() => code.trim() && navigate(`/room/${code.trim()}`)}
                  style={{
                    padding:'8px 16px', borderRadius:10,
                    background:'#1a7a36', color:'#fff',
                    fontWeight:700, fontSize:13,
                    border:'none', cursor:'pointer',
                  }}
                >
                  <Plus size={14}/>
                </button>
              </div>
            )}
          </div>

          {/* stat pills */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {[
              { v:'20+',    l:'Players per room' },
              { v:'< 50ms', l:'Latency'          },
              { v:'Free',   l:'No credit card'   },
            ].map(s => (
              <span key={s.l} style={{
                fontSize:12, fontWeight:600, color: SAGE,
                background:'rgba(26,122,54,0.07)',
                border:'1px solid rgba(26,122,54,0.16)',
                borderRadius:8, padding:'5px 12px',
              }}>
                <strong style={{ color: INK }}>{s.v}</strong> {s.l}
              </span>
            ))}
          </div>
        </div>

        {/* ── RIGHT: 3D scene ── */}
        <div style={{
          flex:'1 1 340px', minWidth:0,
          height:'clamp(360px, 48vw, 560px)',
          borderRadius:28,
          background:'rgba(26,122,54,0.04)',
          border:'1px solid rgba(26,122,54,0.1)',
          overflow:'hidden',
          position:'relative',
        }}>
          <Suspense fallback={
            <div style={{
              width:'100%', height:'100%',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <span style={{ color: SAGE, fontSize:13 }}>Loading…</span>
            </div>
          }>
            <DrawScene />
          </Suspense>
        </div>
      </div>

      {/* scroll arrow */}
      <button
        onClick={onScrollToGames}
        style={{
          position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)',
          display:'flex', flexDirection:'column', alignItems:'center', gap:6,
          color: SAGE, background:'none', border:'none', cursor:'pointer',
        }}
      >
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase' }}>
          Choose Your Game
        </span>
        <motion.div animate={{ y:[0,5,0] }} transition={{ repeat:Infinity, duration:1.7 }}>
          <ChevronDown size={18}/>
        </motion.div>
      </button>
    </section>
  );
}

/* ─── game data ───────────────────────────────────────────── */
const GAMES = [
  {
    id:'canvas', Icon: Users,
    label:'Draw Together',
    bg:'#e6f5ec', iconColor:'#1a7a36', border:'#b0dcbc',
    desc:'Up to 20 people on one infinite canvas. See every stroke in real time.',
    route:'/draw', cta:'Create Room',
  },
  {
    id:'guess', Icon: HelpCircle,
    label:'Guess the Drawing',
    bg:'#ede8ff', iconColor:'#6d28d9', border:'#c4b5fd',
    desc:'One draws, everyone guesses. First to get it wins the round.',
    route:'/games', cta:'Play Now',
  },
  {
    id:'battle', Icon: Swords,
    label:'Draw Battle',
    bg:'#fff0f0', iconColor:'#c8002a', border:'#fca5a5',
    desc:'Same prompt for everyone — the crowd votes for the best drawing.',
    route:'/games', cta:'Start Battle',
  },
  {
    id:'world', Icon: Globe,
    label:'World Canvas',
    bg:'#e8f2ff', iconColor:'#1d5fcc', border:'#93c5fd',
    desc:'One shared canvas that never ends. Leave your mark permanently.',
    route:'/world', cta:'Explore',
  },
  {
    id:'scribble', Icon: Pencil,
    label:'Quick Draw',
    bg:'#fffbe8', iconColor:'#b45309', border:'#fcd34d',
    desc:'Jump straight into a solo doodle session. No room, no rules.',
    route:'/draw', cta:'Start Doodling',
  },
];

/* ─── single game card ────────────────────────────────────── */
function GameCard({ g, delay }: { g: typeof GAMES[0]; delay: number }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const Icon = g.Icon;

  return (
    <motion.article
      initial={{ opacity:0, y:36 }}
      whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true, margin:'-40px' }}
      transition={{ duration:0.5, delay, ease:[0.22,1,0.36,1] }}
      onClick={() => setOpen(v => !v)}
      whileHover={{ y:-8, transition:{ duration:0.22 } }}
      style={{
        background: g.bg,
        border:`1.5px solid ${open ? g.iconColor : g.border}`,
        borderRadius:24,
        overflow:'hidden',
        cursor:'pointer',
        boxShadow: open ? '0 12px 40px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.06)',
        userSelect:'none',
      }}
    >
      {/* card face */}
      <div style={{ padding:'32px 24px 22px', display:'flex', flexDirection:'column', alignItems:'center', gap:14, textAlign:'center' }}>
        {/* icon box */}
        <div style={{
          width:76, height:76, borderRadius:20,
          background:'rgba(255,255,255,0.75)',
          border:`1.5px solid ${g.border}`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon size={34} style={{ color: g.iconColor }} strokeWidth={1.6}/>
        </div>

        {/* label badge */}
        <span style={{
          fontSize:10, fontWeight:800, letterSpacing:'0.16em', textTransform:'uppercase',
          color: g.iconColor,
          background:'rgba(255,255,255,0.6)',
          border:`1px solid ${g.border}`,
          borderRadius:99, padding:'4px 12px',
        }}>
          {g.label}
        </span>

        {/* hint */}
        <span style={{ fontSize:11, color: open ? g.iconColor : SAGE, fontWeight:600, opacity:0.75 }}>
          {open ? '▲ tap to close' : '▼ tap to reveal'}
        </span>
      </div>

      {/* expandable description */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height:0 }}
            animate={{ height:'auto' }}
            exit={{ height:0 }}
            transition={{ duration:0.26, ease:'easeInOut' }}
            style={{ overflow:'hidden' }}
          >
            <div style={{ padding:'4px 24px 24px', display:'flex', flexDirection:'column', gap:14 }}>
              <p style={{ fontSize:14, color: SAGE, lineHeight:1.65, textAlign:'center', margin:0 }}>
                {g.desc}
              </p>
              <button
                onClick={e => { e.stopPropagation(); navigate(g.route); }}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'10px 20px', borderRadius:12,
                  background: g.iconColor, color:'#fff',
                  fontWeight:700, fontSize:13, border:'none', cursor:'pointer', width:'100%',
                }}
              >
                <Play size={12} fill="#fff"/> {g.cta}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/* ─── games section ────────────────────────────────────────── */
const GamesSection = forwardRef<HTMLElement>((_, ref) => (
  <section
    ref={ref}
    style={{ background:'#ffffff', padding:'96px 40px 80px' }}
  >
    <div style={{ maxWidth:1100, margin:'0 auto' }}>
      {/* heading */}
      <motion.div
        initial={{ opacity:0, y:24 }}
        whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true }}
        transition={{ duration:0.55 }}
        style={{ textAlign:'center', marginBottom:56 }}
      >
        <p style={{
          fontSize:11, fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase',
          color:'#1a7a36', margin:'0 0 14px',
        }}>
          What's Inside
        </p>
        <h2 style={{
          fontFamily:'var(--font-display)',
          fontSize:'clamp(2rem, 4vw, 3.2rem)',
          fontWeight:900, color: INK, margin:0, lineHeight:1.1,
        }}>
          Choose Your Game
        </h2>
        <p style={{ fontSize:15, color: SAGE, margin:'14px auto 0', maxWidth:420 }}>
          Tap a card to see what it's about.
        </p>
      </motion.div>

      {/* card grid */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))',
        gap:22,
      }}>
        {GAMES.map((g, i) => <GameCard key={g.id} g={g} delay={i * 0.07}/>)}
      </div>
    </div>
  </section>
));
GamesSection.displayName = 'GamesSection';

/* ─── features row ─────────────────────────────────────────── */
function Features() {
  const rows = [
    { accent:'#f72585', title:'Real-time Strokes',  body:'Under 50ms latency worldwide'    },
    { accent:'#3a86ff', title:'AI Creative Agents', body:'6 specialized AI drawing tools'  },
    { accent:'#06d6a0', title:'Infinite Canvas',    body:'Pan and zoom with no limits'      },
    { accent:'#ffbe0b', title:'Auto-Save to Cloud', body:'Your work is always safe'         },
  ];
  return (
    <section style={{ background: PAGE, padding:'64px 40px' }}>
      <div style={{
        maxWidth:1100, margin:'0 auto',
        display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(210px,1fr))', gap:18,
      }}>
        {rows.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ opacity:0, y:18 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ delay: i*0.08, duration:0.45 }}
            style={{
              background:'#fff', borderRadius:16, padding:'22px 20px',
              borderLeft:`4px solid ${r.accent}`,
              boxShadow:'0 2px 10px rgba(0,0,0,0.05)',
            }}
          >
            <p style={{ fontSize:15, fontWeight:800, color: INK, margin:'0 0 6px' }}>{r.title}</p>
            <p style={{ fontSize:13, color: SAGE, margin:0 }}>{r.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── CTA banner ────────────────────────────────────────────── */
function CTABanner() {
  const navigate = useNavigate();
  return (
    <section style={{
      background:'linear-gradient(135deg, #edf7ee 0%, #d4edda 100%)',
      padding:'80px 40px', textAlign:'center',
      borderTop:'1px solid rgba(26,122,54,0.12)',
    }}>
      <motion.div
        initial={{ opacity:0, y:22 }} whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true }} transition={{ duration:0.55 }}
        style={{ maxWidth:540, margin:'0 auto' }}
      >
        <h2 style={{
          fontFamily:'var(--font-display)',
          fontSize:'clamp(1.9rem, 4vw, 3rem)',
          fontWeight:900, color: INK, margin:'0 0 14px',
        }}>
          Ready to start playing?
        </h2>
        <p style={{ fontSize:16, color: SAGE, margin:'0 0 36px' }}>
          Free forever. No account needed to jump in.
        </p>
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <button
            onClick={() => navigate('/draw')}
            style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'13px 30px', borderRadius:14,
              background:'#1a7a36', color:'#fff',
              fontWeight:800, fontSize:15,
              boxShadow:'0 4px 18px rgba(26,122,54,0.28)',
              border:'none', cursor:'pointer',
            }}
          >
            <Pencil size={16}/> Start Drawing Free
          </button>
          <button
            onClick={() => navigate('/games')}
            style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'13px 30px', borderRadius:14,
              background:'#fff', color: INK,
              fontWeight:700, fontSize:15,
              border:'1.5px solid rgba(17,28,14,0.18)',
              cursor:'pointer',
            }}
          >
            Browse Games <ArrowRight size={15}/>
          </button>
        </div>
      </motion.div>
    </section>
  );
}

/* ─── footer ─────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{
      background:'#fff', borderTop:'1px solid rgba(0,0,0,0.07)',
      padding:'22px 40px', textAlign:'center',
      fontSize:13, color: SAGE,
    }}>
      <span style={{ fontFamily:'var(--font-display)', fontWeight:800, color: INK }}>Point Club</span>
      {' · '}Built for creators everywhere
    </footer>
  );
}

/* ─── MAIN ───────────────────────────────────────────────── */
export default function Home() {
  const gamesRef = useRef<HTMLElement>(null);

  return (
    <div style={{ background: PAGE }}>
      <Hero onScrollToGames={() => gamesRef.current?.scrollIntoView({ behavior:'smooth' })} />
      <GamesSection ref={gamesRef} />
      <Features />
      <CTABanner />
      <Footer />
    </div>
  );
}
