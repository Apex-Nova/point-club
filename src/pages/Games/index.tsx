import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Globe, Lock, Hash } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGameRoom } from '@/hooks/useGameRoom';
import type { GameType } from '@/lib/services/games.service';
import BattleRoom from '@/components/games/BattleRoom';
import GuessGame from '@/components/games/GuessGame';
import WaitingRoom from '@/components/games/WaitingRoom';

const PLAYER_COLORS = [
  '#7c3aed','#e63946','#2a9d8f','#f4a261','#118ab2',
  '#f72585','#06d6a0','#ffb703','#8338ec','#3a86ff',
];

// ── 3D Isometric Cube Icon ────────────────────────────────────────
function Cube3D({
  top, left, right, size = 56,
}: { top: string; left: string; right: string; size?: number }) {
  const s = size;
  const h = s * 0.5;   // face height
  const w = s;         // face width

  return (
    <div style={{ width: s, height: s * 1.15, position: 'relative' }}>
      {/* Top face */}
      <div style={{
        position: 'absolute',
        width: w, height: h,
        background: top,
        top: 0, left: 0,
        transform: 'skewX(-30deg) scaleY(0.864)',
        transformOrigin: 'bottom left',
        borderRadius: '4px 4px 0 0',
      }} />
      {/* Left face */}
      <div style={{
        position: 'absolute',
        width: w * 0.5, height: h * 1.73,
        background: left,
        bottom: 0, left: 0,
        transform: 'skewY(30deg)',
        transformOrigin: 'top left',
        borderRadius: '0 0 0 4px',
      }} />
      {/* Right face */}
      <div style={{
        position: 'absolute',
        width: w * 0.5, height: h * 1.73,
        background: right,
        bottom: 0, right: 0,
        transform: 'skewY(-30deg)',
        transformOrigin: 'top right',
        borderRadius: '0 0 4px 0',
      }} />
    </div>
  );
}

// ── Working games config ──────────────────────────────────────────
const GAMES = [
  {
    id: 'guess' as GameType,
    label: 'Draw & Guess',
    sub: 'Scribble.io style',
    desc: 'One player draws while everyone else races to type the word. Faster = more points!',
    cube: { top: '#a78bfa', left: '#7c3aed', right: '#5b21b6' },
    accent: '#7c3aed',
    glow: 'rgba(124,58,237,0.4)',
    icon: '🎨',
  },
  {
    id: 'battle' as GameType,
    label: 'Scribble Battle',
    sub: 'Vote for the best',
    desc: 'Everyone draws the same prompt, then votes for the best drawing. May the best artist win!',
    cube: { top: '#fb7185', left: '#e11d48', right: '#9f1239' },
    accent: '#e11d48',
    glow: 'rgba(225,29,72,0.4)',
    icon: '⚔️',
  },
] as const;

// ── Main page ────────────────────────────────────────────────────
export default function GamesPage() {
  const socket   = useSocket();
  const { user } = useAuth();
  const {
    state, createGame, joinGame, startGame,
    selectWord, sendLiveStroke, sendStroke, clearCanvas,
    setRounds, submitDrawing, castVote, sendGuess, leaveGame,
  } = useGameRoom(socket);

  const rootRef = useRef<HTMLDivElement>(null);

  const [selected,  setSelected]  = useState<GameType>('guess');
  const [joinCode,  setJoinCode]  = useState('');
  const [isPublic,  setIsPublic]  = useState(true);
  const [rounds,    setRoundsLocal]    = useState(3);
  const [drawTime,  setDrawTime]  = useState(80);

  const myUserId = user?.id ?? (sessionStorage.getItem('pc_guest_id') ?? '');
  const inGame   = !!state.gameId;
  const inPlay   = inGame && state.phase !== 'lobby';

  // Go fullscreen when game starts, exit when done
  useEffect(() => {
    if (inPlay) {
      rootRef.current?.requestFullscreen?.().catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [inPlay]);

  const handleLeave = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    leaveGame();
  };

  // ── Active game (full-screen) ──────────────────────────────────
  if (inPlay) {
    return (
      <div ref={rootRef} className="h-screen flex flex-col bg-[#0f0f1a] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-black/30 border-b border-white/10 shrink-0">
          <button onClick={handleLeave}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={13} /> Leave
          </button>
          <span className="font-bold text-white/80 text-sm">
            {GAMES.find(g => g.id === state.type)?.label ?? 'Game'}
          </span>
          <span className="font-mono text-xs text-white/30">{state.roomCode}</span>
        </div>
        <div className="flex-1 min-h-0">
          {(state.type === 'battle' || state.type === 'blind') && (
            <BattleRoom gameState={state} myUserId={myUserId} onSubmitDrawing={submitDrawing} onCastVote={castVote} />
          )}
          {state.type === 'guess' && (
            <GuessGame
              gameState={state} myUserId={myUserId}
              onSendGuess={sendGuess} onSelectWord={selectWord}
              onSendStroke={sendStroke} onSendLiveStroke={sendLiveStroke}
              onClearCanvas={clearCanvas} playerColors={PLAYER_COLORS}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Waiting room ───────────────────────────────────────────────
  if (inGame && state.phase === 'lobby') {
    return (
      <WaitingRoom
        gameState={state} myUserId={myUserId}
        playerColors={PLAYER_COLORS}
        onStartGame={startGame} onLeave={handleLeave}
        onSetRounds={setRounds}
      />
    );
  }

  // ── Lobby ──────────────────────────────────────────────────────
  const game = GAMES.find(g => g.id === selected)!;

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col">
      {/* Thin top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link to="/dashboard"
          className="flex items-center gap-1.5 text-white/30 hover:text-white/70 transition-colors text-sm">
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <span className="font-black text-white text-xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          🎮 Game Lobby
        </span>
        <div className="w-24" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-10">

        {/* ── Game cards ─────────────────────────────────────── */}
        <div className="flex gap-6 flex-wrap justify-center">
          {GAMES.map(g => (
            <motion.button key={g.id}
              onClick={() => setSelected(g.id)}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`relative w-72 text-left rounded-3xl border-2 p-7 flex flex-col gap-5 transition-colors overflow-hidden ${
                selected === g.id
                  ? 'border-white/30 bg-white/8'
                  : 'border-white/8 bg-white/4 hover:border-white/15 hover:bg-white/6'
              }`}
              style={{
                boxShadow: selected === g.id
                  ? `0 0 40px ${g.glow}, 0 0 0 1px ${g.accent}40`
                  : 'none',
              }}>

              {/* Glow blob behind cube */}
              <div className="absolute top-4 right-4 w-24 h-24 rounded-full blur-2xl opacity-40 pointer-events-none"
                style={{ background: g.accent }} />

              {/* 3D cube */}
              <div className="relative z-10">
                <Cube3D {...g.cube} size={64} />
              </div>

              {/* Text */}
              <div className="relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: g.accent }}>
                  {g.sub}
                </p>
                <p className="text-white font-black text-xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  {g.label}
                </p>
                <p className="text-white/40 text-xs leading-relaxed">{g.desc}</p>
              </div>

              {/* Selected ring */}
              {selected === g.id && (
                <motion.div layoutId="selected-ring"
                  className="absolute inset-0 rounded-3xl border-2 pointer-events-none"
                  style={{ borderColor: g.accent + '80' }} />
              )}
            </motion.button>
          ))}
        </div>

        {/* ── Settings + Create / Join ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-2xl bg-white/4 border border-white/8 rounded-3xl p-6 flex flex-col gap-5">

          {/* Settings row */}
          <div className="flex flex-wrap gap-6 items-start">
            {/* Visibility */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Visibility</p>
              <div className="flex gap-2">
                {[
                  { val: true,  label: 'Public',  icon: Globe },
                  { val: false, label: 'Private', icon: Lock },
                ].map(({ val, label, icon: Icon }) => (
                  <button key={String(val)} onClick={() => setIsPublic(val)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      isPublic === val
                        ? 'text-white'
                        : 'bg-white/5 text-white/30 hover:bg-white/8 hover:text-white/60'
                    }`}
                    style={isPublic === val ? { background: game.accent } : {}}>
                    <Icon size={11} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rounds */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Rounds</p>
              <div className="flex gap-1.5">
                {[2, 3, 5, 8].map(r => (
                  <button key={r} onClick={() => setRoundsLocal(r)}
                    className={`w-10 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      rounds === r ? 'text-white' : 'bg-white/5 text-white/30 hover:bg-white/8 hover:text-white/60'
                    }`}
                    style={rounds === r ? { background: game.accent } : {}}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Draw time */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Draw Time</p>
              <div className="flex gap-1.5">
                {[60, 80, 90, 120].map(t => (
                  <button key={t} onClick={() => setDrawTime(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      drawTime === t ? 'text-white' : 'bg-white/5 text-white/30 hover:bg-white/8 hover:text-white/60'
                    }`}
                    style={drawTime === t ? { background: game.accent } : {}}>
                    {t}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-white/8" />

          {/* Create + Join row */}
          <div className="flex gap-4 flex-wrap">
            {/* Create */}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => createGame(selected, { isPublic, maxRounds: rounds, roundTimeS: drawTime })}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${game.accent}, ${game.accent}cc)`,
                boxShadow: `0 8px 24px ${game.glow}`,
              }}>
              Create {game.label} <ArrowRight size={15} />
            </motion.button>

            {/* Join by code */}
            <div className="flex gap-2 items-center flex-1 min-w-0">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 flex-1">
                <Hash size={13} className="text-white/30 shrink-0" />
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="ROOM CODE"
                  className="flex-1 bg-transparent font-mono font-bold text-sm tracking-[0.2em] text-white placeholder-white/20 outline-none"
                />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => joinCode.length === 6 && joinGame(undefined, joinCode)}
                disabled={joinCode.length !== 6}
                className="px-5 py-2.5 rounded-2xl bg-white/10 text-white font-bold text-sm hover:bg-white/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                Join
              </motion.button>
            </div>
          </div>

          {state.error && (
            <p className="text-rose-400 text-xs font-medium text-center">{state.error}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
