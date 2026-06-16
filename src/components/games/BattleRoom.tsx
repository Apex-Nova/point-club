import { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Timer, Trophy, ThumbsUp, Send, Eraser, Trash2 } from 'lucide-react';
import type { GameRoomState } from '@/hooks/useGameRoom';
import Canvas from '@/drawing/components/Canvas';
import type { CanvasHandle } from '@/drawing/types';
import type { Stroke, ToolSettings } from '@/drawing/types';

const COLORS = [
  '#000000','#ffffff','#888888',
  '#e63946','#f4a261','#2a9d8f',
  '#4361ee','#9b5de5','#06d6a0',
];
const TOOL: ToolSettings = { tool: 'pencil', color: '#000000', width: 4 };

interface Props {
  gameState:     GameRoomState;
  myUserId:      string;
  onSubmitDrawing: (data?: string) => void;
  onCastVote:    (targetUserId: string) => void;
}

export default function BattleRoom({ gameState, myUserId, onSubmitDrawing, onCastVote }: Props) {
  const canvasRef  = useRef<CanvasHandle>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const [settings, setSettings] = useState<ToolSettings>(TOOL);
  const [eraserOn, setEraserOn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [voted,    setVoted]     = useState<string | null>(null);

  const handleStroke = useCallback((s: Stroke) => {
    strokesRef.current = [...strokesRef.current, s];
  }, []);

  const handleClear = () => {
    strokesRef.current = [];
    canvasRef.current?.clearDrawing();
  };

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

  const displaySettings: ToolSettings = eraserOn
    ? { ...settings, tool: 'eraser', color: '#ffffff', width: Math.max(settings.width * 2, 20) }
    : settings;

  // ── Countdown ────────────────────────────────────────────────
  if (gameState.phase === 'countdown') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 bg-[#1a1a2e]">
        <p className="text-xs font-bold uppercase tracking-widest text-white/40">Get ready to draw</p>
        <motion.div
          key={gameState.countdown}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="text-8xl font-black text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {gameState.countdown === 0 ? 'GO!' : gameState.countdown}
        </motion.div>
        {gameState.prompt && (
          <div className="text-center px-6">
            <p className="text-xs text-white/30 mb-1">Your prompt</p>
            <p className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
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
      <div className="flex flex-col h-full bg-[#1a1a2e]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#16213e] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Swords size={13} className="text-rose-400" />
            <span className="text-xs font-bold text-white/60">Round {gameState.round}/{gameState.maxRounds}</span>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-white/30">Prompt</p>
            <p className="text-sm font-bold text-white">"{gameState.prompt}"</p>
          </div>
          <div className={`flex items-center gap-1.5 font-bold tabular-nums text-sm ${urgent ? 'text-rose-400' : 'text-white/70'}`}>
            <Timer size={13} className={urgent ? 'animate-pulse' : ''} />
            {gameState.timeLeft}s
          </div>
        </div>
        {/* Timer bar */}
        <div className="h-1 bg-white/10 shrink-0">
          <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
            className={`h-full ${pct > 60 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-400' : 'bg-rose-500'}`} />
        </div>

        {/* Canvas */}
        <div className="relative flex-1 min-h-0 bg-white" style={{ touchAction: 'none' }}>
          <Canvas
            ref={canvasRef}
            toolSettings={displaySettings}
            strokes={[]}
            onStrokeComplete={handleStroke}
          />
        </div>

        {/* Tool strip */}
        <div className="bg-[#16213e] border-t border-white/10 px-3 py-2.5 flex items-center gap-2 shrink-0 flex-wrap">
          {/* Colors */}
          <div className="flex items-center gap-1.5">
            {COLORS.map(c => (
              <button key={c} onClick={() => { setSettings(s => ({ ...s, color: c })); setEraserOn(false); }}
                className={`rounded-full border-2 transition-all active:scale-95 ${
                  settings.color === c && !eraserOn
                    ? 'border-white scale-125'
                    : 'border-transparent hover:scale-110'
                }`}
                style={{
                  width: 24, height: 24, background: c,
                  outline: c === '#ffffff' ? '1px solid rgba(255,255,255,0.2)' : undefined,
                }} />
            ))}
          </div>
          <div className="w-px h-5 bg-white/15 shrink-0" />
          {/* Eraser */}
          <button onClick={() => setEraserOn(e => !e)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              eraserOn ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/50 hover:bg-white/15'
            }`}>
            <Eraser size={11} /> Erase
          </button>
          {/* Clear */}
          <button onClick={handleClear}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-rose-400 hover:bg-rose-500/20 transition-colors">
            <Trash2 size={11} /> Clear
          </button>
          <div className="flex-1" />
          {/* Submit */}
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={submit}
            disabled={submitted}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold shadow-lg shadow-violet-900/50 disabled:opacity-50 transition-all">
            <Send size={11} /> {submitted ? 'Submitted!' : 'Submit Drawing'}
          </motion.button>
        </div>
      </div>
    );
  }

  // ── Voting phase ─────────────────────────────────────────────
  if (gameState.phase === 'voting') {
    return (
      <div className="h-full bg-[#1a1a2e] flex flex-col items-center justify-center p-6">
        <p className="text-white font-black text-xl mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          Vote for the Best!
        </p>
        <p className="text-sm text-white/40 mb-6">Tap a drawing to vote</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-xl">
          {gameState.submissions.map(sub => (
            <motion.button key={sub.userId} whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }}
              onClick={() => vote(sub.userId)}
              disabled={!!voted || sub.userId === myUserId}
              className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                voted === sub.userId
                  ? 'border-violet-400 shadow-lg shadow-violet-900/50'
                  : 'border-white/10 hover:border-white/30'
              } ${sub.userId === myUserId ? 'opacity-50 cursor-default' : ''}`}>
              {sub.canvasData
                ? <img src={sub.canvasData} alt={sub.username} className="w-full aspect-square object-cover bg-white" />
                : <div className="w-full aspect-square bg-white/10 flex items-center justify-center text-3xl">🎨</div>
              }
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 py-2 flex items-center justify-between">
                <span className="text-[11px] font-bold text-white truncate">{sub.username}</span>
                <span className="flex items-center gap-0.5 text-[10px] text-white/70">
                  <ThumbsUp size={9} /> {sub.votes}
                </span>
              </div>
              {sub.userId === myUserId && (
                <div className="absolute top-2 left-2 bg-violet-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  YOU
                </div>
              )}
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
      <div className="h-full bg-[#1a1a2e] flex flex-col items-center justify-center p-8 gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
          <Trophy size={28} className="text-white" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-black text-white">
          {isFinished ? 'Game Over!' : `Round ${gameState.round} Results`}
        </h2>

        <div className="w-full max-w-sm space-y-2">
          {gameState.leaderboard.map((p, i) => (
            <motion.div key={p.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                i === 0 ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-white/5'
              }`}>
              <span className="text-lg font-black w-6 text-center">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`}
              </span>
              <span className="flex-1 text-sm font-semibold text-white/80">
                {p.username}{p.userId === myUserId && <span className="text-violet-400 ml-1">(you)</span>}
              </span>
              <span className="text-sm font-black text-white tabular-nums">{p.score} pts</span>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {!isFinished && (
            <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-white/40 text-sm">Next round starting…</motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
