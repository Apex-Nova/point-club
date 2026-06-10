import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Swords, HelpCircle, EyeOff, BookOpen,
  Users, Lock, Globe, Plus, ArrowRight, Loader2,
} from 'lucide-react';
import type { GameType } from '@/lib/services/games.service';
import type { GameRoomState } from '@/hooks/useGameRoom';
import { useAuth } from '@/contexts/AuthContext';

const GAME_TYPES: { id: GameType; label: string; icon: React.ElementType; desc: string; color: string; minPlayers: number }[] = [
  { id: 'battle',  label: 'Scribble Battle',    icon: Swords,     desc: 'Everyone draws the same prompt. Community votes for the best!', color: 'bg-coral/20 text-coral-dark',     minPlayers: 2 },
  { id: 'guess',   label: 'Guess the Drawing',   icon: HelpCircle, desc: 'One player draws while others race to guess the word.',        color: 'bg-sky/30 text-sky-600',          minPlayers: 2 },
  { id: 'blind',   label: 'Blind Drawing',        icon: EyeOff,     desc: "Draw without seeing your canvas — reveal the chaos at the end!", color: 'bg-lavender-light text-lavender-dark', minPlayers: 1 },
  { id: 'story',   label: 'Story Mode',           icon: BookOpen,   desc: 'Pass the canvas round-robin to build a visual story together.', color: 'bg-mint/30 text-emerald-600',     minPlayers: 2 },
];

interface Props {
  gameState:    GameRoomState;
  onCreateGame: (type: GameType, opts?: object) => void;
  onJoinGame:   (gameId?: string, roomCode?: string) => void;
  onStartGame:  () => void;
  myUserId:     string;
}

export default function GameLobby({ gameState, onCreateGame, onJoinGame, onStartGame, myUserId }: Props) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<GameType>('battle');
  const [joinCode,     setJoinCode]     = useState('');
  const [isPublic,     setIsPublic]     = useState(true);
  const [creating,     setCreating]     = useState(false);
  const [view,         setView]         = useState<'choose' | 'waiting'>('choose');

  // If already in a game lobby, show waiting room
  if (gameState.gameId && gameState.phase === 'lobby') {
    const isHost = user?.id === myUserId;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="max-w-md mx-auto bg-white rounded-3xl border border-cream-dark p-8 shadow-xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-lavender-light flex items-center justify-center mx-auto mb-4">
          <Users size={24} className="text-lavender-dark" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-800 mb-1">
          Game Lobby
        </h2>
        <p className="text-sm text-gray-500 mb-1 capitalize">{gameState.type} · {isPublic ? 'Public' : 'Private'}</p>

        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="font-mono text-xl font-bold text-lavender-dark tracking-widest bg-lavender-light px-4 py-2 rounded-xl">
            {gameState.roomCode}
          </span>
        </div>

        {/* Players list */}
        <div className="bg-cream rounded-2xl p-4 mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Players ({gameState.players.length}/8)
          </p>
          <div className="space-y-1.5">
            {gameState.players.map(p => (
              <div key={p.userId} className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-6 h-6 rounded-full bg-lavender-light flex items-center justify-center text-xs font-bold text-lavender-dark">
                  {p.username[0].toUpperCase()}
                </div>
                {p.username}
                {p.userId === myUserId && <span className="text-xs text-gray-400">(you)</span>}
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={onStartGame}
            disabled={gameState.players.length < 1}
            className="w-full py-3 rounded-2xl bg-lavender text-white font-bold text-sm hover:bg-lavender-dark transition-colors disabled:opacity-50">
            Start Game →
          </motion.button>
        ) : (
          <p className="text-sm text-gray-400">Waiting for host to start…</p>
        )}
      </motion.div>
    );
  }

  void view; void setView; void creating; void setCreating;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Game type selection */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-bold text-gray-700 mb-4">
          Choose Game Mode
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GAME_TYPES.map(gt => {
            const Icon = gt.icon;
            return (
              <motion.button key={gt.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedType(gt.id)}
                className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedType === gt.id
                    ? 'border-lavender bg-lavender-light/30'
                    : 'border-cream-dark hover:border-lavender/50'
                }`}>
                <div className={`w-10 h-10 rounded-xl ${gt.color} flex items-center justify-center shrink-0`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">{gt.label}</p>
                  <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{gt.desc}</p>
                  <span className="text-[10px] text-gray-400 mt-1 inline-block">
                    Min {gt.minPlayers} player{gt.minPlayers > 1 ? 's' : ''}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Create / Join */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Create */}
        <div className="bg-white rounded-2xl border border-cream-dark p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Create Game</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <button onClick={() => setIsPublic(true)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${isPublic ? 'bg-lavender text-white' : 'bg-cream text-gray-500 hover:bg-cream-dark'}`}>
                <Globe size={11} /> Public
              </button>
              <button onClick={() => setIsPublic(false)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${!isPublic ? 'bg-lavender text-white' : 'bg-cream text-gray-500 hover:bg-cream-dark'}`}>
                <Lock size={11} /> Private
              </button>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => onCreateGame(selectedType, { isPublic })}
              className="w-full py-2.5 rounded-xl bg-lavender text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-lavender-dark transition-colors">
              <Plus size={14} /> Create {GAME_TYPES.find(g => g.id === selectedType)?.label}
            </motion.button>
          </div>
        </div>

        {/* Join */}
        <div className="bg-white rounded-2xl border border-cream-dark p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Join by Code</h3>
          <div className="space-y-3">
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ROOM CODE"
              className="w-full text-center font-mono text-lg tracking-widest px-4 py-2 rounded-xl border-2 border-cream-dark focus:border-lavender outline-none text-gray-700 bg-cream placeholder-gray-300 uppercase"
            />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => joinCode.length === 6 && onJoinGame(undefined, joinCode)}
              disabled={joinCode.length !== 6}
              className="w-full py-2.5 rounded-xl bg-coral text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-coral-dark transition-colors disabled:opacity-50">
              Join Game <ArrowRight size={14} />
            </motion.button>
          </div>
        </div>
      </div>

      {gameState.error && (
        <p className="text-sm text-coral-dark text-center font-medium">{gameState.error}</p>
      )}
    </div>
  );
}
