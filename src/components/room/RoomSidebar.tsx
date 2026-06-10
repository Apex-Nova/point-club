import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Circle, Copy, Check, Share2 } from 'lucide-react';
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

function Avatar({ p, isMe }: { p: Participant; isMe: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-default transition-colors hover:bg-white/5"
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow"
        style={{ background: p.color }}
      >
        {p.username[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: isMe ? '#fff' : '#ccc' }}>
          {p.username}{isMe && <span style={{ color: '#666' }}> (you)</span>}
        </p>
        <div className="flex items-center gap-1">
          <Circle
            size={5}
            className={p.status === 'active' ? 'fill-emerald-400 text-emerald-400' : 'fill-gray-500 text-gray-500'}
          />
          <span className="text-[9px]" style={{ color: '#555' }}>{p.status}</span>
        </div>
      </div>
      {p.isOwner && <Crown size={10} style={{ color: '#f9c74f' }} />}
    </motion.div>
  );
}

export default function RoomSidebar({ room, participants, myUserId, connectionStatus, activity, onInvite }: Props) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!room?.id) return;
    await navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="flex flex-col h-full shrink-0 select-none"
      style={{ width: 200, background: '#242424', borderRight: '1px solid #333' }}
    >
      {/* Room info */}
      <div className="px-3 pt-4 pb-3 border-b" style={{ borderColor: '#333' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#888' }}>
            Live Room
          </span>
          <ConnectionStatusBadge status={connectionStatus} />
        </div>

        {/* Room name */}
        <p className="text-sm font-bold truncate mb-2" style={{ color: '#e0e0e0', fontFamily: 'var(--font-display)' }}>
          {room?.name ?? 'Connecting…'}
        </p>

        {/* Room code */}
        {room?.id && (
          <button
            onClick={copyCode}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors hover:bg-white/10 text-left"
            style={{ background: '#2e2e2e' }}
            title="Click to copy room code"
          >
            {copied
              ? <Check size={11} style={{ color: '#52b788' }} />
              : <Copy size={11} style={{ color: '#666' }} />}
            <span className="text-[10px] font-mono font-bold truncate" style={{ color: '#999' }}>
              {room.id}
            </span>
          </button>
        )}
      </div>

      {/* Invite button */}
      <div className="px-3 py-2 border-b" style={{ borderColor: '#333' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onInvite}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
          style={{ background: '#4361ee' }}
        >
          <Share2 size={11} />
          Invite Friends
        </motion.button>
      </div>

      {/* Participants */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: '#555' }}>
            In Room · {participants.length}
          </p>
        </div>
        <AnimatePresence mode="popLayout">
          {participants.map(p => (
            <Avatar key={p.socketId} p={p} isMe={p.userId === myUserId} />
          ))}
          {participants.length === 0 && (
            <p className="text-xs text-center mt-6 px-3" style={{ color: '#444' }}>Just you here…</p>
          )}
        </AnimatePresence>

        {/* Recent activity */}
        {activity.length > 0 && (
          <>
            <div className="px-3 pt-3 pb-1">
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#444' }}>Activity</p>
            </div>
            {activity.slice(0, 5).map(ev => (
              <div key={ev.id} className="px-3 py-1">
                <p className="text-[9px] leading-relaxed" style={{ color: '#555' }}>
                  <span style={{ color: '#777' }}>{ev.username}</span> {ev.action}
                </p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t" style={{ borderColor: '#333' }}>
        <p className="text-[10px] font-bold" style={{ color: '#444', fontFamily: 'var(--font-display)' }}>Point Club</p>
        <p className="text-[9px]" style={{ color: '#333' }}>Live Canvas</p>
      </div>
    </div>
  );
}
