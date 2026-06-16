import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Copy, Check, Share2, ChevronRight, Users } from 'lucide-react';
import type { Participant, ConnectionStatus, ActivityEvent } from '@/types/room';
import type { Room } from '@/types/room';
import ConnectionStatusBadge from './ConnectionStatus';

interface Props {
  room: Room | null;
  participants: Participant[];
  myUserId?: string;
  connectionStatus: ConnectionStatus;
  activity: ActivityEvent[];
  onInvite: () => void;
}

export default function RoomSidebar({ room, participants, myUserId, connectionStatus, activity, onInvite }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!room?.id) return;
    await navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Collapsed rail ──────────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <div
        className="flex flex-col items-center h-full shrink-0 select-none py-3 gap-2"
        style={{ width: 52, background: '#1e1e1e', borderRight: '1px solid #2e2e2e' }}
      >
        {/* Expand */}
        <button
          onClick={() => setExpanded(true)}
          title="Room info"
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <Users size={13} style={{ color: '#555' }} />
        </button>

        <div className="w-5 h-px" style={{ background: '#2e2e2e' }} />

        {/* Connection dot */}
        <div title={connectionStatus}>
          <ConnectionStatusBadge status={connectionStatus} compact />
        </div>

        <div className="w-5 h-px" style={{ background: '#2e2e2e' }} />

        {/* Participant avatars */}
        <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <AnimatePresence>
            {participants.map(p => (
              <motion.div
                key={p.socketId}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                title={`${p.username}${p.userId === myUserId ? ' (you)' : ''}${p.isOwner ? ' ⭐' : ''}`}
                className="relative shrink-0"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow"
                  style={{
                    background: p.color,
                    ring: p.userId === myUserId ? '2px solid #fff' : undefined,
                    outline: p.userId === myUserId ? '2px solid rgba(255,255,255,0.3)' : undefined,
                    outlineOffset: 1,
                  }}
                >
                  {p.username[0]?.toUpperCase()}
                </div>
                {p.isOwner && (
                  <div className="absolute -top-0.5 -right-0.5">
                    <Crown size={7} style={{ color: '#f9c74f' }} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Invite */}
        <button
          onClick={onInvite}
          title="Invite friends"
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
        >
          <Share2 size={13} style={{ color: '#4361ee' }} />
        </button>
      </div>
    );
  }

  // ── Expanded panel ──────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ width: 52 }}
      animate={{ width: 200 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="flex flex-col h-full shrink-0 select-none overflow-hidden"
      style={{ background: '#1e1e1e', borderRight: '1px solid #2e2e2e' }}
    >
      {/* Header */}
      <div className="px-3 pt-4 pb-3 border-b shrink-0" style={{ borderColor: '#2a2a2a' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#555' }}>Live Room</span>
          <div className="flex items-center gap-1">
            <ConnectionStatusBadge status={connectionStatus} />
            <button
              onClick={() => setExpanded(false)}
              title="Collapse"
              className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ChevronRight size={10} style={{ color: '#555' }} />
            </button>
          </div>
        </div>

        <p className="text-[13px] font-bold truncate mb-2" style={{ color: '#e0e0e0' }}>
          {room?.name ?? 'Connecting…'}
        </p>

        {room?.id && (
          <button
            onClick={copyCode}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-left"
            style={{ background: '#262626' }}
            title="Copy room code"
          >
            {copied
              ? <Check size={10} style={{ color: '#52b788' }} />
              : <Copy size={10} style={{ color: '#555' }} />}
            <span className="text-[10px] font-mono font-bold truncate" style={{ color: '#777' }}>{room.id}</span>
          </button>
        )}
      </div>

      {/* Invite */}
      <div className="px-3 py-2.5 border-b shrink-0" style={{ borderColor: '#2a2a2a' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onInvite}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-bold text-white"
          style={{ background: '#4361ee' }}
        >
          <Share2 size={10} />
          Invite Friends
        </motion.button>
      </div>

      {/* Participants */}
      <div className="flex-1 overflow-y-auto min-h-0 py-2" style={{ scrollbarWidth: 'none' }}>
        <p className="text-[8px] font-bold uppercase tracking-widest px-3 pb-1.5" style={{ color: '#444' }}>
          In Room · {participants.length}
        </p>
        <AnimatePresence mode="popLayout">
          {participants.map(p => (
            <motion.div
              key={p.socketId}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition-colors"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 shadow"
                style={{ background: p.color }}
              >
                {p.username[0]?.toUpperCase()}
              </div>
              <p className="text-[11px] font-medium truncate flex-1" style={{ color: p.userId === myUserId ? '#e0e0e0' : '#888' }}>
                {p.username}
                {p.userId === myUserId && <span style={{ color: '#444' }}> (you)</span>}
              </p>
              {p.isOwner && <Crown size={9} style={{ color: '#f9c74f' }} />}
            </motion.div>
          ))}
          {participants.length === 0 && (
            <p className="text-[10px] text-center mt-6 px-3" style={{ color: '#444' }}>Just you…</p>
          )}
        </AnimatePresence>

        {/* Activity feed */}
        {activity.length > 0 && (
          <div className="mt-3 border-t pt-2" style={{ borderColor: '#2a2a2a' }}>
            <p className="text-[8px] font-bold uppercase tracking-widest px-3 pb-1" style={{ color: '#3a3a3a' }}>Activity</p>
            {activity.slice(0, 5).map(ev => (
              <div key={ev.id} className="px-3 py-0.5">
                <p className="text-[9px] leading-relaxed" style={{ color: '#444' }}>
                  <span style={{ color: '#666' }}>{ev.username}</span> {ev.action}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
