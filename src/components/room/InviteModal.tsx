import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Link2, Share2 } from 'lucide-react';
import Modal from '@/components/common/Modal';
import type { Room } from '@/types/room';

interface Props {
  open: boolean;
  onClose: () => void;
  room: Room | null;
}

export default function InviteModal({ open, onClose, room }: Props) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const roomUrl  = room ? `${window.location.origin}/room/${room.id}` : '';
  const roomCode = room?.id ?? '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(roomUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const nativeShare = () => {
    if (navigator.share) {
      navigator.share({ title: room?.name ?? 'Point Club Room', url: roomUrl });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Invite to Room">
      <div className="space-y-4">
        {/* Room URL */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Room Link</label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-cream border border-cream-dark text-sm font-mono text-gray-600 truncate">
              <Link2 size={13} className="text-gray-400 shrink-0" />
              <span className="truncate">{roomUrl}</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={copyLink}
              className="px-3 py-2.5 rounded-xl bg-lavender-light text-lavender-dark hover:bg-lavender hover:text-white transition-colors text-sm font-semibold flex items-center gap-1.5 shrink-0"
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              {copiedLink ? 'Copied!' : 'Copy'}
            </motion.button>
          </div>
        </div>

        {/* Room code */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Room Code</label>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-lavender-light border border-lavender">
            <span className="text-2xl font-mono font-bold tracking-widest text-lavender-dark">{roomCode}</span>
            <motion.button whileTap={{ scale: 0.95 }} onClick={copyCode}
              className="text-lavender-dark hover:text-lavender transition-colors">
              {copiedCode ? <Check size={18} /> : <Copy size={18} />}
            </motion.button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Share this code — anyone can type it on the dashboard to join.</p>
        </div>

        {/* Native share */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={nativeShare}
            className="w-full py-2.5 rounded-xl border-2 border-cream-dark text-sm font-semibold text-gray-600 hover:border-lavender transition-colors flex items-center justify-center gap-2"
          >
            <Share2 size={15} />
            Share via…
          </motion.button>
        )}
      </div>
    </Modal>
  );
}
