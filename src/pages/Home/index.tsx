import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Swords, HelpCircle, Palette, Play } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

/* ────────────────────────────────────────────────────────────────
   Minimal landing shell — intentionally bare so the UI can be
   rebuilt from scratch. No 3D scenes, no particle decorations.
   ──────────────────────────────────────────────────────────────── */

const GAMES = [
  { id: 'canvas',    Icon: Users,      label: 'Drawing Board',        desc: 'Up to 20 friends on one infinite canvas, live.', route: '/draw',  cta: 'Open Canvas' },
  { id: 'scribble',  Icon: HelpCircle, label: 'Scribble Game',        desc: 'One draws, everyone guesses. Fastest wins.',     route: '/games', cta: 'Play Now' },
  { id: 'sandbox',   Icon: Palette,    label: 'Creative Sandbox',     desc: 'A free space to doodle with no rules.',          route: '/draw',  cta: 'Start Doodling' },
  { id: 'challenge', Icon: Swords,     label: 'Community Challenges', desc: 'Themed prompts the community votes on.',         route: '/games', cta: 'Join Challenge' },
];

function Hero({ onExplore }: { onExplore: () => void }) {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-[70vh] flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <h1 className="font-black leading-tight" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
          Create. Play. Imagine.
        </h1>
        <p className="mt-4 max-w-md text-gray-500 text-lg">
          Draw, play, and build together on a shared canvas.
        </p>
        <div className="mt-8 flex gap-3 flex-wrap justify-center">
          <button
            onClick={onExplore}
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white"
            style={{ background: '#4361ee' }}
          >
            <Play size={16} fill="#fff" /> Explore Games
          </button>
          <button
            onClick={() => navigate('/draw')}
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold border"
            style={{ borderColor: '#e0e0e0', color: '#333' }}
          >
            Open Canvas
          </button>
        </div>
      </div>
    </section>
  );
}

function GamesSection({ innerRef }: { innerRef: React.Ref<HTMLElement> }) {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <section ref={innerRef} className="px-6 py-24" style={{ background: '#fafafa' }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-center font-black mb-12" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
          Pick your adventure
        </h2>
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {GAMES.map(g => {
            const open = openId === g.id;
            const Icon = g.Icon;
            return (
              <article
                key={g.id}
                onClick={() => setOpenId(o => (o === g.id ? null : g.id))}
                className="bg-white rounded-3xl p-6 cursor-pointer border transition-all"
                style={{ borderColor: open ? '#4361ee' : '#eee', boxShadow: open ? '0 12px 32px rgba(67,97,238,0.15)' : '0 4px 14px rgba(0,0,0,0.04)' }}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#4361ee18' }}>
                    <Icon size={30} style={{ color: '#4361ee' }} />
                  </div>
                  <p className="font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>{g.label}</p>
                  {open && (
                    <>
                      <p className="text-sm text-gray-500 leading-relaxed">{g.desc}</p>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(g.route); }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white text-sm"
                        style={{ background: '#4361ee' }}
                      >
                        <Play size={13} fill="#fff" /> {g.cta}
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const gamesRef = useRef<HTMLElement>(null);
  return (
    <div style={{ background: '#fff', color: '#222' }}>
      <Hero onExplore={() => gamesRef.current?.scrollIntoView({ behavior: 'smooth' })} />
      <GamesSection innerRef={gamesRef} />
      <footer className="text-center py-12 text-sm text-gray-400">
        © {new Date().getFullYear()} Point Club
      </footer>
    </div>
  );
}
