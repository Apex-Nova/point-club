import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Mic, Hash, Lock, ArrowRight, Loader2, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createRoom } from '@/lib/services/rooms.service';

export default function MultiplayerPanel() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [creating,  setCreating]  = useState(false);
  const [joining,   setJoining]   = useState(false);
  const [joinCode,  setJoinCode]  = useState('');
  const [error,     setError]     = useState('');
  const [roomType,  setRoomType]  = useState<'public' | 'private'>('public');

  // ── Create a new room ────────────────────────────────────────────────────
  async function handleCreate() {
    setError('');
    setCreating(true);
    try {
      const room = await createRoom({
        userId: user?.id,
        type:   roomType,
        name:   user?.user_metadata?.full_name
          ? `${user.user_metadata.full_name}'s Room`
          : 'Drawing Room',
      });
      navigate(`/room/${room.roomId}`);
    } catch {
      setError('Could not create room. Is the backend running?');
    } finally {
      setCreating(false);
    }
  }

  // ── Join by code ─────────────────────────────────────────────────────────
  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setError('');
    setJoining(true);
    try {
      navigate(`/room/${code}`);
    } catch {
      setError('Room not found.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="flex flex-col w-60 bg-white border-l border-cream-dark shrink-0 overflow-y-auto"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-cream-dark shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-lavender-light flex items-center justify-center">
            <Users size={11} className="text-lavender-dark" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Multiplayer
          </h3>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-5">

        {/* ── Feature pills ─────────────────────────────── */}
        <div className="flex flex-col gap-2">
          {[
            { icon: Users, label: 'Live Participants', desc: 'See who is drawing with you', color: 'bg-lavender-light', fg: 'text-lavender-dark' },
            { icon: Mic,   label: 'Voice Chat',        desc: 'Talk while you draw',        color: 'bg-mint/25',       fg: 'text-emerald-700'  },
            { icon: Hash,  label: 'Room Code',         desc: 'Share & invite instantly',   color: 'bg-peach/40',      fg: 'text-orange-600'   },
            { icon: Lock,  label: 'Private Room',      desc: 'Password-protected space',   color: 'bg-sky/20',        fg: 'text-sky-700'      },
          ].map(({ icon: Icon, label, desc, color, fg }) => (
            <div key={label}
              className="flex items-center gap-2.5 rounded-xl p-2.5 bg-cream border border-cream-dark"
            >
              <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                <Icon size={13} className={fg} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-700 leading-tight">{label}</p>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5 truncate">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-cream-dark" />

        {/* ── Room type toggle ───────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Room Type</p>
          <div className="flex rounded-xl overflow-hidden border border-cream-dark bg-cream">
            {(['public', 'private'] as const).map(t => (
              <button key={t}
                onClick={() => setRoomType(t)}
                className={`flex-1 py-2 text-[11px] font-bold transition-colors capitalize ${
                  roomType === t
                    ? 'bg-lavender text-white'
                    : 'text-gray-500 hover:text-lavender-dark'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── Create room button ─────────────────────────── */}
        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-lavender text-white text-sm font-bold shadow-[0_3px_12px_rgb(139_120_224/0.35)] hover:bg-lavender-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {creating
            ? <><Loader2 size={14} className="animate-spin" /> Creating…</>
            : <><Users size={14} /> Start a Room <ArrowRight size={13} /></>
          }
        </button>

        {/* ── Join by code ───────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Join a Room</p>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="Room code…"
              maxLength={12}
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-cream-dark bg-cream text-xs font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:border-lavender focus:bg-white transition-all uppercase tracking-wider"
            />
            <button
              onClick={handleJoin}
              disabled={!joinCode.trim() || joining}
              className="px-3 py-2 rounded-xl bg-lavender-light text-lavender-dark font-bold text-xs hover:bg-lavender hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {joining ? <Loader2 size={12} className="animate-spin" /> : <LogIn size={13} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 p-3">
            <AlertCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-500 leading-snug">{error}</p>
          </div>
        )}

        {/* ── Guest nudge ────────────────────────────────── */}
        {!user && (
          <div className="rounded-xl bg-lavender-light/60 border border-lavender/30 p-3 text-center">
            <p className="text-[11px] font-semibold text-lavender-dark leading-snug mb-1.5">
              Sign in to save rooms & progress
            </p>
            <button
              onClick={() => navigate('/login')}
              className="text-[10px] font-bold text-lavender-dark underline underline-offset-2 hover:text-lavender transition-colors"
            >
              Sign in free →
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
