import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Star, Upload, CheckCircle, Loader2, Pencil, Trophy } from 'lucide-react';
import { getTodaysChallenge, submitChallengeEntry, getChallengeEntries, hasCompletedToday, type DailyChallenge, type ChallengeEntry } from '@/lib/services/challenges.service';
import { awardXP } from '@/lib/services/games.service';
import { useAuth } from '@/contexts/AuthContext';
import Canvas from '@/drawing/components/Canvas';
import type { CanvasHandle } from '@/drawing/types';
import type { Stroke, ToolSettings } from '@/drawing/types';
import { useToasts } from '@/drawing/hooks/useToasts';
import ToastContainer from '@/drawing/components/ToastContainer';

const DIFF_COLOR: Record<string, string> = {
  easy:   'bg-mint/30 text-emerald-600',
  medium: 'bg-peach/40 text-orange-500',
  hard:   'bg-coral/20 text-coral-dark',
  expert: 'bg-lavender-light text-lavender-dark',
};

export default function ChallengesPage() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const { toasts, addToast, removeToast } = useToasts();
  const canvasRef   = useRef<CanvasHandle>(null);

  const [challenge,  setChallenge]  = useState<DailyChallenge | null>(null);
  const [entries,    setEntries]    = useState<ChallengeEntry[]>([]);
  const [completed,  setCompleted]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [strokes,    setStrokes]    = useState<Stroke[]>([]);
  const [settings,   setSettings]   = useState<ToolSettings>({ tool: 'pencil', color: '#1a1a1a', width: 3 });
  const [tab,        setTab]        = useState<'draw' | 'entries'>('draw');

  const handleStroke = useCallback((s: Stroke) => setStrokes(p => [...p, s]), []);

  useEffect(() => {
    getTodaysChallenge().then(async c => {
      setChallenge(c);
      if (user) setCompleted(await hasCompletedToday(c.id));
      getChallengeEntries(c.id).then(setEntries);
      setLoading(false);
    });
  }, [user]);

  const handleSubmit = async () => {
    if (!challenge || !user) { navigate('/login'); return; }
    const snapshot = canvasRef.current?.exportImage();
    if (!snapshot && strokes.length === 0) { addToast('Draw something first!', 'info'); return; }
    setSubmitting(true);
    try {
      await submitChallengeEntry(challenge.id, snapshot ?? '');
      await awardXP(user.id, 'challenge', challenge.xp_reward, `Daily challenge: ${challenge.prompt}`);
      setCompleted(true);
      addToast(`+${challenge.xp_reward} XP earned! Great work!`, 'success');
      // Reload entries
      getChallengeEntries(challenge.id).then(setEntries);
    } catch {
      addToast('Submission failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <Loader2 size={24} className="text-lavender-dark animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-cream-dark sticky top-0 z-20 shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium">← Dashboard</Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-peach to-coral flex items-center justify-center">
                <Zap size={13} className="text-white" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-gray-800">Daily Challenge</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Star size={14} className="text-orange-400 fill-orange-400" />
            Resets at midnight
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 w-full">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main area */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {challenge && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-cream-dark p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-lavender-dark mb-1">Today's Prompt</p>
                    <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl font-bold text-gray-800">
                      {challenge.prompt}
                    </h2>
                    {challenge.theme && (
                      <p className="text-sm text-gray-400 mt-1">Theme: <span className="text-gray-600">{challenge.theme}</span></p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${DIFF_COLOR[challenge.difficulty]}`}>
                      {challenge.difficulty}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-orange-500 font-bold">
                      <Star size={11} className="fill-orange-400" /> +{challenge.xp_reward} XP
                    </div>
                  </div>
                </div>
                {completed && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold bg-mint/20 rounded-xl px-4 py-2 mt-2">
                    <CheckCircle size={15} /> You completed today's challenge!
                  </div>
                )}
              </motion.div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-white rounded-2xl p-1 border border-cream-dark">
              {(['draw', 'entries'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${
                    tab === t ? 'bg-lavender text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {t === 'draw' ? <><Pencil size={13} /> Draw</> : <><Trophy size={13} /> Entries ({entries.length})</>}
                </button>
              ))}
            </div>

            {tab === 'draw' ? (
              <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden" style={{ height: 420 }}>
                {/* Tool strip */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-cream-dark">
                  {['#1a1a1a','#e63946','#2a9d8f','#e9c46a','#7b2d8b','#3a86ff'].map(c => (
                    <button key={c} onClick={() => setSettings(s => ({ ...s, color: c }))}
                      className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${settings.color === c ? 'border-gray-800 scale-110' : 'border-white'}`}
                      style={{ background: c }} />
                  ))}
                  <div className="w-px h-5 bg-cream-dark" />
                  {[2, 4, 8, 12].map(w => (
                    <button key={w} onClick={() => setSettings(s => ({ ...s, width: w }))}
                      className={`flex items-center justify-center w-7 h-7 rounded-lg hover:bg-cream transition-colors ${settings.width === w ? 'bg-lavender-light' : ''}`}>
                      <div className="rounded-full bg-gray-700" style={{ width: w * 1.5, height: w * 1.5 }} />
                    </button>
                  ))}
                  <div className="flex-1" />
                  <button onClick={() => { canvasRef.current?.clearDrawing(); setStrokes([]); }}
                    className="text-[10px] text-gray-400 hover:text-coral-dark font-semibold px-2 py-1 rounded-lg hover:bg-cream transition-colors">
                    Clear
                  </button>
                </div>

                <div className="relative" style={{ height: 380 }}>
                  <Canvas ref={canvasRef} toolSettings={settings} strokes={strokes} onStrokeComplete={handleStroke} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-cream-dark p-12 text-center text-gray-400">
                    <Trophy size={32} className="mx-auto mb-3 opacity-30" />
                    <p>No entries yet — be the first!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {entries.map((e, i) => (
                      <motion.div key={e.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-cream-dark overflow-hidden">
                        {e.canvas_snapshot
                          ? <img src={e.canvas_snapshot} alt="" className="w-full aspect-square object-cover" />
                          : <div className="w-full aspect-square bg-cream flex items-center justify-center text-3xl">🎨</div>
                        }
                        <div className="px-3 py-2 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-gray-600 truncate">
                            {e.author?.username ?? 'Anonymous'}
                          </span>
                          <span className="text-[10px] text-gray-400">♥ {e.like_count}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            {tab === 'draw' && !completed && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={submitting || strokes.length === 0}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-lavender to-lavender-dark text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {submitting ? 'Submitting…' : 'Submit Entry'}
              </motion.button>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-cream-dark p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">How Challenges Work</h3>
              <div className="space-y-3 text-[11px] text-gray-500 leading-relaxed">
                <p>📅 A new prompt appears every day at midnight.</p>
                <p>⭐ Submit your drawing to earn XP rewards.</p>
                <p>🏆 Top entries appear on the leaderboard.</p>
                <p>🎨 All styles welcome — abstract, realistic, silly!</p>
                <p>💜 Browse entries from the community in the Entries tab.</p>
              </div>
            </div>

            {!user && (
              <div className="bg-lavender-light rounded-2xl p-5 text-center">
                <p className="text-sm font-bold text-lavender-dark mb-2">Sign in to earn XP</p>
                <p className="text-xs text-lavender-dark/70 mb-4">Track your progress and appear on leaderboards.</p>
                <Link to="/login">
                  <motion.button whileHover={{ scale: 1.03 }}
                    className="w-full py-2 rounded-xl bg-lavender text-white text-sm font-bold hover:bg-lavender-dark transition-colors">
                    Sign In
                  </motion.button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
