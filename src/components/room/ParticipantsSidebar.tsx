import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Circle } from 'lucide-react';
import type { Participant } from '@/types/room';

interface Props {
  participants: Participant[];
  myUserId?: string;
}

function ParticipantRow({ p, isMe }: { p: Participant; isMe: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-cream transition-colors"
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
        style={{ background: p.color }}
      >
        {p.username[0].toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-700 truncate">
          {p.username}
          {isMe && <span className="ml-1 text-gray-400">(you)</span>}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <Circle
            size={6}
            className={p.status === 'active' ? 'fill-emerald-400 text-emerald-400' : 'fill-gray-300 text-gray-300'}
          />
          <span className="text-[10px] text-gray-400">{p.status}</span>
        </div>
      </div>

      {p.isOwner && <Crown size={12} className="text-peach shrink-0" />}
    </motion.div>
  );
}

export default function ParticipantsSidebar({ participants, myUserId }: Props) {
  return (
    <div className="flex flex-col bg-white border-l border-cream-dark w-52 shrink-0 overflow-hidden">
      <div className="px-3 py-3 border-b border-cream-dark">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
          In Room · {participants.length}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto py-2 min-h-0">
        <AnimatePresence mode="popLayout">
          {participants.map(p => (
            <ParticipantRow key={p.socketId} p={p} isMe={p.userId === myUserId} />
          ))}
        </AnimatePresence>
        {participants.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-8 px-3">Just you here…</p>
        )}
      </div>
    </div>
  );
}
