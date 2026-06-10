import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shuffle, Pencil, Lightbulb, Swords, BookOpen, MessageSquare, Loader2 } from 'lucide-react';
import Modal from '@/components/common/Modal';
import { createRoom } from '@/lib/services/rooms.service';
import { useAuth } from '@/contexts/AuthContext';

const MODES = [
  { id: 'casual',       label: 'Casual Doodling',  icon: Pencil,       desc: 'Free-form drawing with a random partner',  color: 'bg-lavender-light text-lavender-dark' },
  { id: 'brainstorm',   label: 'Brainstorming',    icon: Lightbulb,    desc: 'Sketch out ideas together',                color: 'bg-peach/40 text-orange-500' },
  { id: 'battle',       label: 'Sketch Battle',    icon: Swords,       desc: 'Competitive drawing prompt challenge',     color: 'bg-coral/20 text-coral-dark' },
  { id: 'story',        label: 'Story Creation',   icon: BookOpen,     desc: 'Build a visual story together',           color: 'bg-sky/30 text-sky-600' },
  { id: 'idea',         label: 'Idea Exchange',    icon: MessageSquare,desc: 'Whiteboard-style idea sharing',            color: 'bg-mint/30 text-emerald-600' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MatchmakingModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('casual');
  const [loading,  setLoading]  = useState(false);

  const findPartner = async () => {
    setLoading(true);
    try {
      // Phase 5: create a public room for others to join (full matchmaking in Phase 6)
      const { roomId } = await createRoom({
        name:   `${MODES.find(m => m.id === selected)?.label ?? 'Creative'} Room`,
        userId: user?.id,
        type:   'public',
      });
      navigate(`/room/${roomId}`);
      onClose();
    } catch {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Find a Creative Partner" maxWidth="max-w-lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Choose your creative mode and we'll match you with someone!</p>

        <div className="grid grid-cols-1 gap-2">
          {MODES.map(mode => {
            const Icon = mode.icon;
            const isSelected = selected === mode.id;
            return (
              <motion.button
                key={mode.id}
                whileHover={{ x: 3 }}
                onClick={() => setSelected(mode.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left
                  ${isSelected ? 'border-lavender bg-lavender-light/30' : 'border-cream-dark hover:border-lavender/50'}`}
              >
                <div className={`w-9 h-9 rounded-xl ${mode.color} flex items-center justify-center shrink-0`}>
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">{mode.label}</p>
                  <p className="text-xs text-gray-400">{mode.desc}</p>
                </div>
                {isSelected && <div className="ml-auto w-4 h-4 rounded-full bg-lavender flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>}
              </motion.button>
            );
          })}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={findPartner}
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-lavender text-white font-semibold flex items-center justify-center gap-2 hover:bg-lavender-dark transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Shuffle size={16} />}
          {loading ? 'Creating Room…' : 'Find Creative Partner'}
        </motion.button>
        <p className="text-xs text-gray-400 text-center">
          Full matchmaking coming in Phase 6 — for now we create a public room for others to discover!
        </p>
      </div>
    </Modal>
  );
}
