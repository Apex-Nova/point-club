import { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Timer, Trophy, ThumbsUp, Send } from 'lucide-react';
import type { GameRoomState } from '@/hooks/useGameRoom';
import Canvas from '@/drawing/components/Canvas';
import type { CanvasHandle } from '@/drawing/types';
import type { Stroke, ToolSettings } from '@/drawing/types';

const TOOL: ToolSettings = { tool: 'pencil', color: '#1a1a1a', width: 3 };

interface Props {
  gameState:     GameRoomState;
  myUserId:      string;
  onSubmitDrawing: (data?: string) => void;
  onCastVote:    (targetUserId: string) => void;
}

export default function BattleRoom({ gameState, myUserId, onSubmitDrawing, onCastVote }: Props) {
  const canvasRef  = useRef<CanvasHandle>(null);
  const [strokes,  setStrokes]  = useState<Stroke[]>([]);
  const [settings, setSettings] = useState<ToolSettings>(TOOL);
  const [submitted, setSubmitted] = useState(false);
  const [voted,    setVoted]     = useState<string | null>(null);

  const handleStroke = useCallback((s: Stroke) => setStrokes(prev => [...prev, s]), []);

  const submit = () => {
    const data = canvasRef.current?.exportImage();
    onSubmitDrawing(data ?? undefined);
    setSubmitted(true);
  };

  const vote = (uid: string) => {
    if (voted) return;
    onCastVote(uid);
    setVoted(uid);
  };

  // ── Countdown ────────────────────────────────────────────────
  if (gameState.phase === 'countdown') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <p className="text-sm font-bold uppercase tracking-wider text-gray-500">Get ready to draw</p>
        <motion.div
          key={gameState.countdown}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="text-8xl font-black text-lavender-dark"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {gameState.countdown === 0 ? 'GO!' : gameState.countdown}
        </motion.div>
        {gameState.prompt && (
          <div className="text-center px-6">
            <p className="text-xs text-gray-400 mb-1">Your prompt</p>
            <p className="text-xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-display)' }}>
              "{gameState.prompt}"
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Drawing phase ────────────────────────────────────────────
  if (gameState.phase === 'drawing') {
    const pct = Math.round((gameState.timeLeft / gameState.roundTimeS) * 100);
    const urgent = gameState.timeLeft <= 15;
    return (
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-cream-dark shrink-0">
          <div className="flex items-center gap-2">
            <Swords size={14} className="text-coral" />
            <span className="text-xs font-bold text-gray-700">Round {gameState.round}/{gameState.maxRounds}</span>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Prompt</p>
            <p className="text-sm font-bold text-gray-800">"{gameState.prompt}"</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Timer size={13} className={urgent ? 'text-coral animate-pulse' : 'text-gray-400'} />
            <span className={`text-sm font-bold tabular-nums ${urgent ? 'text-coral' : 'text-gray-700'}`}>
              {gameState.timeLeft}s
            </span>
          </div>
        </div>
        {/* Timer bar */}
        <div className="h-1 bg-cream-dark shrink-0">
          <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
            className={`h-full ${urgent ? 'bg-coral' : 'bg-lavender'}`} />
        </div>

        {/* Canvas */}
        <div className="relative flex-1 min-h-0">
          <Canvas ref={canvasRef} toolSettings={settings} strokes={strokes} onStrokeComplete={handleStroke} />
        </div>

        {/* Tool strip + submit */}
        <div className="flex items-center gap-2 px-3 py-2 border-t border-cream-dark shrink-0">
          {['#1a1a1a','#e63946','#2a9d8f','#e9c46a','#7b2d8b','#ffffff'].map(c => (
            <button key={c} onClick={() => setSettings(s => ({ ...s, color: c }))}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${settings.color === c ? 'border-gray-700 scale-110' : 'border-white'}`}
              style={{ background: c }} />
          ))}
          <div className="flex-1" />
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={submit}
            disabled={submitted || strokes.length === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-coral text-white text-xs font-bold hover:bg-coral-dark transition-colors disabled:opacity-50">
            <Send size={11} /> {submitted ? 'Submitted!' : 'Submit'}
          </motion.button>
        </div>
      </div>
    );
  }

  // ── Voting phase ─────────────────────────────────────────────
  if (gameState.phase === 'voting') {
    return (
      <div className="p-6">
        <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-bold text-gray-800 mb-2 text-center">
          Vote for the Best!
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">Tap a drawing to vote</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {gameState.submissions.map(sub => (
            <motion.button key={sub.userId} whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }}
              onClick={() => vote(sub.userId)}
              disabled={!!voted || sub.userId === myUserId}
              className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                voted === sub.userId ? 'border-lavender shadow-lg' : 'border-cream-dark hover:border-lavender/50'
              } ${sub.userId === myUserId ? 'opacity-60 cursor-default' : ''}`}>
              {sub.canvasData
                ? <img src={sub.canvasData} alt={sub.username} className="w-full aspect-square object-cover" />
                : <div className="w-full aspect-square bg-cream flex items-center justify-center text-3xl">🎨</div>
              }
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-white truncate">{sub.username}</span>
                <span className="flex items-center gap-0.5 text-[10px] text-white">
                  <ThumbsUp size={9} /> {sub.votes}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────
  if (gameState.phase === 'results' || gameState.phase === 'finished') {
    const isFinished = gameState.phase === 'finished';
    return (
      <div className="flex flex-col items-center p-8 gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-peach to-coral flex items-center justify-center">
          <Trophy size={28} className="text-white" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-800">
          {isFinished ? 'Game Over!' : `Round ${gameState.round} Results`}
        </h2>

        <div className="w-full max-w-sm space-y-2">
          {(isFinished ? gameState.leaderboard : gameState.leaderboard).map((p, i) => (
            <motion.div key={p.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${i === 0 ? 'bg-gradient-to-r from-peach/30 to-coral/20 border-2 border-coral/30' : 'bg-cream'}`}>
              <span className="text-lg font-black text-gray-400 w-6 text-center">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`}
              </span>
              <span className="flex-1 text-sm font-semibold text-gray-700">
                {p.username}{p.userId === myUserId && ' (you)'}
              </span>
              <span className="text-sm font-bold text-lavender-dark">{p.score} pts</span>
            </motion.div>
          ))}
        </div>

        {!isFinished && (
          <p className="text-xs text-gray-400">Next round starting soon…</p>
        )}
      </div>
    );
  }

  return null;
}
