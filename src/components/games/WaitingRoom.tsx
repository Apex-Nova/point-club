import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, ArrowLeft, Crown, Users, Minus, Plus } from 'lucide-react';
import type { GameRoomState } from '@/hooks/useGameRoom';

interface Props {
  gameState:    GameRoomState;
  myUserId:     string;
  playerColors: string[];
  onStartGame:  () => void;
  onLeave:      () => void;
  onSetRounds?: (n: number) => void;
}

const MODE_LABEL: Record<string, string> = {
  guess: 'Draw & Guess', battle: 'Scribble Battle', blind: 'Blind Draw', story: 'Story Mode',
};

export default function WaitingRoom({ gameState, myUserId, playerColors, onStartGame, onLeave, onSetRounds }: Props) {
  const [copied, setCopied] = useState(false);
  const isHost = gameState.hostId === myUserId;

  const copyCode = () => {
    navigator.clipboard.writeText(gameState.roomCode ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const changeRounds = (delta: number) => {
    const next = Math.min(10, Math.max(1, gameState.maxRounds + delta));
    onSetRounds?.(next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex flex-col items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">

        <button onClick={onLeave}
          className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> Leave lobby
        </button>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur space-y-6">
          {/* Mode + host badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-400 uppercase tracking-wider bg-violet-500/20 px-3 py-1 rounded-full">
              {MODE_LABEL[gameState.type ?? 'guess'] ?? gameState.type}
            </span>
            {isHost && (
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <Crown size={11} /> Host
              </span>
            )}
          </div>

          {/* Room code */}
          <div className="text-center">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Room Code</p>
            <button onClick={copyCode}
              className="group flex items-center gap-3 mx-auto bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl px-6 py-3 transition-colors">
              <span className="font-mono text-3xl font-black text-white tracking-[0.2em]">{gameState.roomCode}</span>
              <span className="text-white/40 group-hover:text-white transition-colors">
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </span>
            </button>
            <p className="text-[11px] text-white/30 mt-2">Share this code with friends</p>
          </div>

          {/* Rounds setting */}
          <div className="bg-white/5 rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Rounds</p>
            <div className="flex items-center gap-4">
              {isHost ? (
                <>
                  <button onClick={() => changeRounds(-1)} disabled={gameState.maxRounds <= 1}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-30 flex items-center justify-center text-white transition-colors">
                    <Minus size={14} />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-white font-black text-3xl">{gameState.maxRounds}</span>
                    <p className="text-white/30 text-[10px] mt-0.5">
                      {gameState.maxRounds === 1 ? '1 round' : `${gameState.maxRounds} rounds`}
                      {' · '}each player draws once per round
                    </p>
                  </div>
                  <button onClick={() => changeRounds(1)} disabled={gameState.maxRounds >= 10}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-30 flex items-center justify-center text-white transition-colors">
                    <Plus size={14} />
                  </button>
                </>
              ) : (
                <p className="text-white text-center w-full">
                  <span className="font-black text-2xl">{gameState.maxRounds}</span>
                  <span className="text-white/40 text-sm ml-2">rounds</span>
                </p>
              )}
            </div>
          </div>

          {/* Players */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-white/50 text-xs font-semibold uppercase tracking-wider">
                <Users size={12} /> Players
              </div>
              <span className="text-xs text-white/30">{gameState.players.length} / 8</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {gameState.players.map((p, i) => (
                <motion.div key={p.userId}
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2.5 bg-white/5 rounded-xl px-3 py-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: playerColors[i % playerColors.length] }}>
                    {p.username[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{p.username}</p>
                    <p className="text-[10px] text-white/30">
                      {p.userId === myUserId ? 'You' : p.userId === gameState.hostId ? 'Host' : 'Player'}
                    </p>
                  </div>
                </motion.div>
              ))}
              {Array.from({ length: Math.max(0, 4 - gameState.players.length) }).map((_, i) => (
                <div key={`empty-${i}`}
                  className="flex items-center gap-2.5 bg-white/[0.03] border border-dashed border-white/10 rounded-xl px-3 py-2.5">
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/15 shrink-0" />
                  <p className="text-xs text-white/20">Waiting…</p>
                </div>
              ))}
            </div>
          </div>

          {/* Start / wait */}
          {isHost ? (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={onStartGame}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-900/50">
              Start Game →
            </motion.button>
          ) : (
            <div className="text-center py-2">
              <motion.div className="flex items-center justify-center gap-2 text-white/40 text-sm"
                animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}>
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                Waiting for host to start…
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
