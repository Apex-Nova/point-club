import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pencil, Users, Share2, ArrowLeft, Copy, Check } from 'lucide-react';
import type { Room, Participant, ConnectionStatus } from '@/types/room';
import ConnectionStatusBadge from './ConnectionStatus';

interface Props {
  room: Room | null;
  participants: Participant[];
  connectionStatus: ConnectionStatus;
  onInvite: () => void;
  onSettings?: () => void;
}

export default function RoomHeader({ room, participants, connectionStatus, onInvite }: Props) {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roomUrl = room ? `${window.location.origin}/room/${room.id}` : '';

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-4 h-12 bg-white border-b border-cream-dark shrink-0 z-30"
    >
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <Link to="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors text-sm font-medium shrink-0">
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <div className="w-px h-5 bg-cream-dark" />
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-lavender flex items-center justify-center shrink-0">
            <Pencil size={12} className="text-white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)' }} className="text-sm font-bold text-gray-700 hidden sm:block">
            {room?.name ?? 'Loading…'}
          </span>
        </div>
      </div>

      {/* Center — room code */}
      <button
        onClick={copyRoomCode}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cream border border-cream-dark hover:border-lavender transition-colors"
        title="Click to copy room code"
      >
        {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} className="text-gray-400" />}
        <span className="text-xs font-mono font-bold text-gray-600">{room?.id ?? '…'}</span>
      </button>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0">
        <ConnectionStatusBadge status={connectionStatus} />

        {/* Online count */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-cream text-xs font-medium text-gray-600">
          <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
          <Users size={12} />
          {participants.length}
        </div>

        {/* Share */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => { void navigator.clipboard.writeText(roomUrl); onInvite(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lavender-light text-lavender-dark text-xs font-semibold hover:bg-lavender hover:text-white transition-colors"
        >
          <Share2 size={13} />
          <span className="hidden sm:inline">Invite</span>
        </motion.button>
      </div>
    </motion.header>
  );
}
