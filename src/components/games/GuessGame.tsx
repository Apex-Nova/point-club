import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Timer, Trash2, Eraser, Pencil, Crown, ChevronUp, X } from 'lucide-react';
import type { GameRoomState } from '@/hooks/useGameRoom';
import Canvas from '@/drawing/components/Canvas';
import type { CanvasHandle } from '@/drawing/types';
import type { Stroke, Point, ToolSettings } from '@/drawing/types';

const COLORS = [
  '#000000','#ffffff','#888888','#c0c0c0',
  '#ff0000','#ff6b00','#ffeb00','#00c800',
  '#00c8c8','#0000ff','#8000ff','#ff00ff',
  '#ff8080','#ffc080','#ffff80','#80ff80',
  '#a0d8ef','#8080ff','#c080ff','#ff80c0',
  '#400000','#804000','#808000','#004000',
  '#004040','#000040','#400040','#400020',
  '#663300','#996600','#669900','#006633',
];
const BRUSH_SIZES = [3, 6, 12, 20, 35];

interface Props {
  gameState:         GameRoomState;
  myUserId:          string;
  onSendGuess:       (guess: string) => void;
  onSelectWord?:     (word: string) => void;
  onSendStroke?:     (stroke: Stroke) => void;
  onSendLiveStroke?: (stroke: Stroke) => void;
  onClearCanvas?:    () => void;
  playerColors?:     string[];
}

// ── Word hint ────────────────────────────────────────────────────
function WordHint({ secretWord, wordLength, timeLeft, roundTimeS }: {
  secretWord: string | null; wordLength: number; timeLeft: number; roundTimeS: number;
}) {
  const chars = useMemo(() => {
    if (secretWord) return secretWord.split('');
    if (!wordLength) return [];
    const progress = 1 - timeLeft / roundTimeS;
    const blanks = Array(wordLength).fill('_') as string[];
    if (progress >= 0.4 && wordLength > 2) blanks[Math.floor(wordLength * 0.25)] = '?';
    if (progress >= 0.7 && wordLength > 3) blanks[Math.floor(wordLength * 0.65)] = '?';
    return blanks;
  }, [secretWord, wordLength, timeLeft, roundTimeS]);

  if (!chars.length) return null;
  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      {chars.map((ch, i) =>
        ch === ' ' ? <span key={i} className="w-3" /> : (
          <span key={i} className={`inline-flex items-end justify-center font-black text-sm border-b-2 min-w-[13px] pb-0.5 ${
            ch === '_' ? 'border-white/30 text-transparent w-3.5' :
            ch === '?' ? 'border-violet-400 text-violet-300 w-3.5' :
            'border-white text-white w-auto px-0.5'
          }`}>{ch}</span>
        )
      )}
    </div>
  );
}

// ── Coordinate normalisation ─────────────────────────────────────
const NORM = 1000;

function normaliseStroke(stroke: Stroke, el: HTMLElement): Stroke {
  const { width: w, height: h } = el.getBoundingClientRect();
  if (!w || !h) return stroke;
  return {
    ...stroke,
    points: stroke.points.map(p => ({ ...p, x: (p.x / w) * NORM, y: (p.y / h) * NORM })),
  };
}

function denormaliseStroke(stroke: Stroke, el: HTMLElement): Stroke {
  const { width: w, height: h } = el.getBoundingClientRect();
  if (!w || !h) return stroke;
  return {
    ...stroke,
    points: stroke.points.map(p => ({ ...p, x: (p.x / NORM) * w, y: (p.y / NORM) * h })),
  };
}

// ── Guesser canvas ───────────────────────────────────────────────
function GuesserCanvas({ remoteStrokes, liveStroke, clearTick }: {
  remoteStrokes: Stroke[]; liveStroke: Stroke | null; clearTick: number;
}) {
  const canvasRef        = useRef<CanvasHandle>(null);
  const containerRef     = useRef<HTMLDivElement>(null);
  const renderedCountRef = useRef(0);

  const deNorm = (s: Stroke) =>
    containerRef.current ? denormaliseStroke(s, containerRef.current) : s;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newStrokes = remoteStrokes.slice(renderedCountRef.current);
    newStrokes.forEach(s => canvas.appendStroke(deNorm(s)));
    renderedCountRef.current = remoteStrokes.length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteStrokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !liveStroke) return;
    canvas.redrawAll([...remoteStrokes.map(deNorm), deNorm(liveStroke)]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveStroke]);

  useEffect(() => {
    canvasRef.current?.clearDrawing();
    renderedCountRef.current = 0;
  }, [clearTick]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <Canvas
        ref={canvasRef}
        toolSettings={{ tool: 'pencil', color: '#000', width: 3 }}
        strokes={[]}
        onStrokeComplete={() => {}}
      />
      <div className="absolute inset-0" style={{ pointerEvents: 'all', cursor: 'default' }} />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function GuessGame({
  gameState, myUserId, onSendGuess, onSelectWord,
  onSendStroke, onSendLiveStroke, onClearCanvas,
  playerColors = [],
}: Props) {
  const drawerCanvasRef     = useRef<CanvasHandle>(null);
  const drawerContainerRef  = useRef<HTMLDivElement>(null);
  const chatRef             = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLInputElement>(null);
  const liveStrokeRef       = useRef<Stroke | null>(null);
  const sendTimerRef        = useRef<ReturnType<typeof setInterval> | null>(null);

  const norm = (s: Stroke) =>
    drawerContainerRef.current ? normaliseStroke(s, drawerContainerRef.current) : s;

  const [localStrokes, setLocalStrokes] = useState<Stroke[]>([]);
  const [settings,     setSettings]     = useState<ToolSettings>({ tool: 'pencil', color: '#000000', width: 6 });
  const [eraserOn,     setEraserOn]     = useState(false);
  const [guess,        setGuess]        = useState('');
  const [chatOpen,     setChatOpen]     = useState(false);

  const isDrawer   = gameState.drawerId === myUserId;
  const hasGuessed = gameState.correctGuessers.includes(myUserId);
  const urgent     = gameState.timeLeft <= 15 && gameState.phase === 'drawing';
  const unreadCount = gameState.chatMessages.length;

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [gameState.chatMessages]);

  // Reset on new round or clear
  useEffect(() => {
    setLocalStrokes([]);
    liveStrokeRef.current = null;
  }, [gameState.clearTick, gameState.round]);

  // Focus guess input
  useEffect(() => {
    if (gameState.phase === 'drawing' && !isDrawer && !hasGuessed) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [gameState.phase, isDrawer, hasGuessed]);

  // Send live stroke every 50ms while drawing
  useEffect(() => {
    if (!isDrawer) return;
    sendTimerRef.current = setInterval(() => {
      const s = liveStrokeRef.current;
      if (s && s.points.length > 1) onSendLiveStroke?.(norm(s));
    }, 50);
    return () => { if (sendTimerRef.current) clearInterval(sendTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawer, onSendLiveStroke]);

  const handlePointAdded = useCallback((_strokeId: string, point: Point) => {
    if (liveStrokeRef.current) liveStrokeRef.current.points.push(point);
  }, []);

  const handleStrokeStart = useCallback((stroke: Stroke) => {
    liveStrokeRef.current = { ...stroke, points: [...stroke.points] };
  }, []);

  const handleStrokeComplete = useCallback((s: Stroke) => {
    setLocalStrokes(prev => [...prev, s]);
    liveStrokeRef.current = null;
    onSendStroke?.(norm(s));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSendStroke]);

  const handleClear = () => {
    setLocalStrokes([]);
    drawerCanvasRef.current?.clearDrawing();
    onClearCanvas?.();
  };

  const pickColor = (c: string) => {
    setSettings(s => ({ ...s, color: c, tool: 'pencil' }));
    setEraserOn(false);
  };

  const toggleEraser = () => {
    const next = !eraserOn;
    setEraserOn(next);
    setSettings(s => ({ ...s, tool: next ? 'eraser' : 'pencil' }));
  };

  const submitGuess = () => {
    if (!guess.trim() || hasGuessed || isDrawer) return;
    onSendGuess(guess.trim());
    setGuess('');
  };

  const displaySettings: ToolSettings = eraserOn
    ? { ...settings, tool: 'eraser', color: '#ffffff', width: Math.max(settings.width * 2, 24) }
    : settings;

  // ── Word choice ────────────────────────────────────────────────
  if (gameState.phase === 'choosing') {
    return (
      <div className="h-full bg-[#1a1a2e] flex items-center justify-center p-4">
        {isDrawer && gameState.wordChoices.length > 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <p className="text-white/50 text-xs mb-2 uppercase tracking-widest font-semibold">Choose your word</p>
            <p className="text-white font-black text-2xl sm:text-3xl mb-8" style={{ fontFamily: 'var(--font-display)' }}>
              What will you draw?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {gameState.wordChoices.map((word, i) => (
                <motion.button key={word}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.97 }}
                  onClick={() => onSelectWord?.(word)}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white font-black text-lg shadow-xl capitalize">
                  {word}
                </motion.button>
              ))}
            </div>
            <p className="text-white/30 text-xs mt-6">Auto-picks in 15s if you don't choose</p>
          </motion.div>
        ) : (
          <div className="text-center">
            <motion.div className="w-12 h-12 rounded-full border-4 border-violet-500 border-t-transparent mx-auto mb-4"
              animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} />
            <p className="text-white/60 text-sm">
              <span className="font-bold text-white">{gameState.drawerName}</span> is choosing a word…
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Countdown ──────────────────────────────────────────────────
  if (gameState.phase === 'countdown') {
    return (
      <div className="h-full bg-[#1a1a2e] flex flex-col items-center justify-center gap-4">
        <motion.div key={gameState.countdown}
          initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-9xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
          {gameState.countdown === 0 ? '🎨' : gameState.countdown}
        </motion.div>
        <p className="text-white/60 text-sm">
          {isDrawer
            ? <><span className="text-violet-300 font-bold">You're drawing!</span> Get ready…</>
            : <><span className="font-bold text-white">{gameState.drawerName}</span> is about to draw. Guess fast!</>
          }
        </p>
      </div>
    );
  }

  // ── Drawing phase ──────────────────────────────────────────────
  if (gameState.phase === 'drawing') {
    const pct = Math.round((gameState.timeLeft / gameState.roundTimeS) * 100);

    return (
      <div className="h-full flex flex-col bg-[#1a1a2e] overflow-hidden">

        {/* ── Top bar (always visible) ── */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#16213e] border-b border-white/10 shrink-0">
          {/* Players mini-strip */}
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
            {gameState.players.map((p, i) => {
              const isMe      = p.userId === myUserId;
              const isDrawing = p.userId === gameState.drawerId;
              const guessed   = gameState.correctGuessers.includes(p.userId);
              const color     = playerColors[i % playerColors.length] ?? '#7c3aed';
              return (
                <div key={p.userId}
                  title={`${p.username} — ${p.score} pts`}
                  className="relative shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white border-2 transition-all ${
                    isMe ? 'border-violet-400' : isDrawing ? 'border-amber-400' : 'border-transparent'
                  } ${guessed ? 'opacity-60' : ''}`}
                    style={{ background: color }}>
                    {p.username[0]?.toUpperCase()}
                    {isDrawing && <span className="absolute -top-0.5 -right-0.5 text-[9px] leading-none">✏️</span>}
                    {guessed && !isDrawing && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <span className="text-[7px] text-white font-black">✓</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Word hint — center */}
          <div className="flex-shrink-0 flex justify-center px-2">
            <WordHint
              secretWord={isDrawer ? gameState.secretWord : null}
              wordLength={gameState.wordLength}
              timeLeft={gameState.timeLeft}
              roundTimeS={gameState.roundTimeS}
            />
          </div>

          {/* Timer + round */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-white/30 font-semibold tabular-nums hidden sm:inline">
              {gameState.round}/{gameState.maxRounds}
            </span>
            <div className={`flex items-center gap-1 font-black tabular-nums text-sm ${urgent ? 'text-rose-400' : 'text-white/80'}`}>
              <Timer size={12} className={urgent ? 'animate-pulse' : ''} />
              {gameState.timeLeft}s
            </div>
          </div>
        </div>

        {/* Timer bar */}
        <div className="h-1 bg-white/10 shrink-0">
          <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
            className={`h-full transition-colors ${pct > 60 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-400' : 'bg-rose-500'}`} />
        </div>

        {/* ── Canvas + desktop chat ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Canvas area */}
        <div className="relative flex-1 min-h-0 bg-white">
          {isDrawer ? (
            <div ref={drawerContainerRef} className="w-full h-full" style={{ touchAction: 'none' }}>
              <Canvas
                ref={drawerCanvasRef}
                toolSettings={displaySettings}
                strokes={localStrokes}
                onStrokeStart={handleStrokeStart}
                onPointAdded={handlePointAdded}
                onStrokeComplete={handleStrokeComplete}
              />
            </div>
          ) : (
            <GuesserCanvas
              remoteStrokes={gameState.remoteStrokes}
              liveStroke={gameState.liveStroke}
              clearTick={gameState.clearTick}
            />
          )}

          {/* Guessed banner */}
          <AnimatePresence>
            {hasGuessed && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-lg pointer-events-none">
                ✓ You guessed it!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat slide-up button (mobile only) */}
          {!isDrawer && (
            <button
              onClick={() => setChatOpen(true)}
              className="absolute bottom-3 right-3 sm:hidden flex items-center gap-1.5 bg-[#16213e] border border-white/10 text-white/70 text-xs font-semibold px-3 py-2 rounded-xl shadow-lg">
              <ChevronUp size={13} />
              Chat
              {unreadCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] font-black flex items-center justify-center">
                  {Math.min(unreadCount, 9)}
                </span>
              )}
            </button>
          )}
        </div>{/* end canvas */}

        {/* Desktop chat sidebar */}
        <div className="hidden sm:flex w-48 flex-col border-l border-white/10 shrink-0 bg-[#0f0f1a]">
          <div className="px-3 py-2.5 border-b border-white/10 shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
              {isDrawer ? 'Guesses' : 'Chat'}
            </p>
          </div>
          <div ref={chatRef} className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
            {gameState.chatMessages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg leading-snug ${
                  msg.correct ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold' : 'bg-white/5 text-white/60'
                }`}>
                <span className="font-bold text-white/80">{msg.username}: </span>
                {isDrawer && msg.correct ? `✓ Guessed it! +${msg.points ?? ''} pts` : msg.message}
              </motion.div>
            ))}
            {gameState.chatMessages.length === 0 && (
              <p className="text-[10px] text-white/20 text-center pt-6">
                {isDrawer ? 'Waiting for guesses…' : 'Type your guess below!'}
              </p>
            )}
          </div>
        </div>

        </div>{/* end canvas + desktop chat row */}

        {/* ── Bottom: tools (drawer) or guess input (guesser) ── */}
        {isDrawer ? (
          <div className="bg-[#16213e] border-t border-white/10 px-3 py-2.5 shrink-0 space-y-2">
            {/* Color grid */}
            <div className="flex flex-wrap gap-1">
              {COLORS.map(c => (
                <button key={c} onClick={() => pickColor(c)}
                  className={`rounded transition-all active:scale-95 ${
                    settings.color === c && !eraserOn
                      ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-[#16213e]'
                      : 'hover:scale-110'
                  }`}
                  style={{
                    width: 22, height: 22,
                    background: c,
                    border: c === '#ffffff' ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 4,
                  }}
                />
              ))}
            </div>
            {/* Brush + tools row */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                {BRUSH_SIZES.map(sz => (
                  <button key={sz}
                    onClick={() => { setSettings(s => ({ ...s, width: sz })); setEraserOn(false); }}
                    className={`flex items-center justify-center rounded-full border transition-all active:scale-95 ${
                      settings.width === sz && !eraserOn ? 'border-violet-400 bg-violet-500/30' : 'border-white/20 bg-white/5'
                    }`}
                    style={{ width: 28, height: 28 }}>
                    <span className="rounded-full bg-white" style={{ width: Math.min(sz * 0.65, 18), height: Math.min(sz * 0.65, 18) }} />
                  </button>
                ))}
              </div>
              <div className="w-px h-5 bg-white/15 shrink-0" />
              <button onClick={() => { setEraserOn(false); setSettings(s => ({ ...s, tool: 'pencil' })); }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  !eraserOn ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/50 hover:bg-white/15'
                }`}>
                <Pencil size={11} /> Draw
              </button>
              <button onClick={toggleEraser}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  eraserOn ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/50 hover:bg-white/15'
                }`}>
                <Eraser size={11} /> Erase
              </button>
              <button onClick={handleClear}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-rose-400 hover:bg-rose-500/20 transition-colors">
                <Trash2 size={11} /> Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#16213e] border-t border-white/10 p-2.5 flex gap-2 shrink-0">
            <input ref={inputRef} value={guess} onChange={e => setGuess(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitGuess()}
              placeholder={hasGuessed ? '🎉 You got it! Watch others guess…' : 'Type your guess…'}
              disabled={hasGuessed}
              className="flex-1 px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder-white/25 focus:border-violet-400 outline-none transition-colors disabled:opacity-40"
            />
            <motion.button whileTap={{ scale: 0.9 }} onClick={submitGuess}
              disabled={hasGuessed || !guess.trim()}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-30 shrink-0">
              <Send size={15} />
            </motion.button>
          </div>
        )}

        {/* ── Mobile chat sheet ── */}
        <AnimatePresence>
          {chatOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-30 sm:hidden"
                onClick={() => setChatOpen(false)} />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 h-2/3 bg-[#16213e] border-t border-white/10 rounded-t-2xl z-40 sm:hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                    {isDrawer ? 'Guesses' : 'Chat'}
                  </p>
                  <button onClick={() => setChatOpen(false)} className="text-white/40 hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
                  {gameState.chatMessages.map((msg, i) => (
                    <div key={i} className={`text-xs px-3 py-2 rounded-xl leading-snug ${
                      msg.correct ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold' : 'bg-white/5 text-white/60'
                    }`}>
                      <span className="font-bold text-white/80">{msg.username}: </span>
                      {isDrawer && msg.correct ? `✓ Guessed it! +${msg.points ?? ''} pts` : msg.message}
                    </div>
                  ))}
                  {gameState.chatMessages.length === 0 && (
                    <p className="text-sm text-white/20 text-center pt-8">No messages yet</p>
                  )}
                </div>
                {!isDrawer && (
                  <div className="p-3 border-t border-white/10 flex gap-2 shrink-0">
                    <input value={guess} onChange={e => setGuess(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submitGuess()}
                      placeholder={hasGuessed ? '🎉 You got it!' : 'Type your guess…'}
                      disabled={hasGuessed}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder-white/25 focus:border-violet-400 outline-none transition-colors disabled:opacity-40"
                    />
                    <motion.button whileTap={{ scale: 0.9 }} onClick={submitGuess}
                      disabled={hasGuessed || !guess.trim()}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-30 shrink-0">
                      <Send size={15} />
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────
  if (gameState.phase === 'results' || gameState.phase === 'finished') {
    const isFinal = gameState.phase === 'finished';
    return (
      <div className="h-full bg-[#1a1a2e] flex flex-col items-center justify-center p-6 gap-5">
        <div className="text-center">
          <p className="text-4xl mb-2">{isFinal ? '🏆' : '📊'}</p>
          <p className="text-white font-black text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
            {isFinal ? 'Game Over!' : `Round ${gameState.round} Results`}
          </p>
          {gameState.secretWord && (
            <p className="text-white/40 text-sm mt-1">
              The word was <span className="font-bold text-violet-300 capitalize">{gameState.secretWord}</span>
            </p>
          )}
        </div>
        <div className="w-full max-w-sm space-y-2">
          {gameState.leaderboard.map((p, i) => {
            const color = playerColors[gameState.players.findIndex(pl => pl.userId === p.userId) % playerColors.length] ?? '#7c3aed';
            return (
              <motion.div key={p.userId}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl ${i === 0 ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-white/5'}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                  style={{ background: color }}>
                  {p.username[0]?.toUpperCase()}
                </div>
                <span className={`flex-1 text-sm font-bold ${p.userId === myUserId ? 'text-violet-300' : 'text-white/80'}`}>
                  {i === 0 && <Crown size={12} className="text-amber-400 inline mr-1" />}
                  {p.username}{p.userId === myUserId ? ' (you)' : ''}
                </span>
                <span className="text-sm font-black text-white tabular-nums">{p.score} pts</span>
              </motion.div>
            );
          })}
        </div>
        {!isFinal && (
          <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-white/40 text-sm">Next round starting…</motion.p>
        )}
      </div>
    );
  }

  return null;
}
