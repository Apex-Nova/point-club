import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MessageSquare, Sparkles, Users, ChevronUp } from 'lucide-react';
import type { Socket } from 'socket.io-client';
import type { Participant } from '@/types/room';
import type { VoiceChatProps } from './VoiceChat';
import VoiceChat from './VoiceChat';
import RoomChat from './RoomChat';
import AIPanel from '@/components/ai/AIPanel';
import ParticipantsSidebar from './ParticipantsSidebar';

type Tab = 'voice' | 'chat' | 'ai' | 'people';

interface Props {
  open: boolean;
  onClose: () => void;
  socket: Socket | null;
  roomId: string | undefined;
  participants: Participant[];
  myUserId: string | undefined;
  onColorPick: (hex: string) => void;
  // Voice state — lifted to RoomPage so it survives panel close/reopen
  voice: VoiceChatProps;
}

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'voice',  label: 'Voice',  Icon: Mic           },
  { id: 'chat',   label: 'Chat',   Icon: MessageSquare },
  { id: 'ai',     label: 'AI',     Icon: Sparkles      },
  { id: 'people', label: 'People', Icon: Users         },
];

export default function MobileRoomPanel({
  open, onClose, socket, roomId, participants, myUserId, onColorPick, voice,
}: Props) {
  const [tab, setTab] = useState<Tab>('voice');

  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (e.changedTouches[0].clientY - touchStartY.current > 60) onClose();
  };

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl flex flex-col"
            style={{ maxHeight: '80dvh' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-2 shrink-0">
              <span className="text-sm font-bold text-gray-700">Room Panel</span>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-cream transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-cream-dark shrink-0 px-2">
              {TABS.map(({ id, label, Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors relative ${
                    tab === id ? 'text-lavender-dark border-b-2 border-lavender-dark' : 'text-gray-400'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                  {/* Live indicator on voice tab when connected */}
                  {id === 'voice' && voice.isInVoice && (
                    <span className="absolute top-1 right-3 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content — scrollable */}
            <div className="overflow-y-auto flex-1">
              {tab === 'voice'  && <VoiceChat {...voice} />}
              {tab === 'chat'   && <RoomChat  socket={socket} roomId={roomId} />}
              {tab === 'ai'     && <AIPanel   onColorPick={onColorPick} />}
              {tab === 'people' && <ParticipantsSidebar participants={participants} myUserId={myUserId} />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Floating trigger button — only shown on mobile (md:hidden)
export function MobilePanelTrigger({
  onClick, isInVoice,
}: { onClick: () => void; isInVoice?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="md:hidden fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full bg-lavender text-white shadow-lg flex items-center justify-center"
      title="Open room panel"
    >
      <ChevronUp size={20} />
      {isInVoice && (
        <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
      )}
    </motion.button>
  );
}
