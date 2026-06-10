import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Wifi, ArrowRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import SectionHeader from '@/components/ui/SectionHeader';

const activeRooms = [
  { id: '1', name: 'Abstract Vibes',        participants: 4, color: '#8b78e0', tag: 'Art',      strokes: [40, 70, 55, 80, 60, 45, 90] },
  { id: '2', name: 'Product Brainstorm',    participants: 7, color: '#f27059', tag: 'Design',   strokes: [60, 40, 80, 50, 70, 90, 55] },
  { id: '3', name: 'Doodle Club',           participants: 2, color: '#7dd3b2', tag: 'Fun',      strokes: [30, 60, 45, 75, 50, 65, 40] },
  { id: '4', name: 'Logo Workshop',         participants: 5, color: '#87c5e8', tag: 'Branding', strokes: [80, 55, 70, 40, 85, 60, 75] },
  { id: '5', name: 'Sketch Battle',         participants: 9, color: '#f9c784', tag: 'Game',     strokes: [50, 75, 60, 90, 45, 70, 55] },
  { id: '6', name: 'Mind Map Party',        participants: 3, color: '#d4ccf7', tag: 'Ideas',    strokes: [65, 45, 80, 55, 70, 40, 60] },
];

const stats = [
  { value: '2,400+', label: 'Creators Online',  icon: '🎨', bg: 'bg-lavender-light', text: 'text-lavender-dark' },
  { value: '340',    label: 'Active Rooms',      icon: '🏠', bg: 'bg-coral/15',       text: 'text-coral-dark'   },
  { value: '18k+',   label: 'Sketches Today',    icon: '✏️', bg: 'bg-mint/25',         text: 'text-emerald-700'  },
];

function MiniCanvas({ strokes, color }: { strokes: number[]; color: string }) {
  const points = strokes.map((y, i) => `${8 + i * 16},${y * 0.48}`).join(' ');
  return (
    <svg className="w-full h-10" viewBox="0 0 120 48" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <polyline points={points} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      {strokes.map((y, i) => (
        <circle key={i} cx={8 + i * 16} cy={y * 0.48} r="2.5" fill={color} opacity={0.5 + i * 0.05} />
      ))}
    </svg>
  );
}

function RoomCard({ room, index }: { room: typeof activeRooms[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const { ref, isInView } = useScrollAnimation();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-2xl border border-[#e4ddd3] shadow-[0_4px_20px_rgb(0_0_0/0.09),0_1px_6px_rgb(0_0_0/0.04)] hover:shadow-[0_16px_48px_rgb(0_0_0/0.13)] transition-all duration-300 overflow-hidden group"
      style={{ borderTop: `3px solid ${room.color}` }}
    >
      <div className="p-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-gray-900 text-base mb-1.5 group-hover:text-lavender-dark transition-colors">
              {room.name}
            </h4>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: `${room.color}20`, color: room.color }}
              >
                {room.tag}
              </span>
              <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                <Users size={11} />
                {room.participants} drawing
              </div>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold"
            style={{ background: `${room.color}20`, color: room.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: room.color }} />
            Live
          </div>
        </div>

        {/* Toggle for activity preview */}
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 text-[11px] font-bold transition-colors"
          style={{ color: room.color }}
        >
          {open ? 'Hide activity' : 'See activity'}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}>
            <ChevronDown size={12} />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-[#ece5d8]">
                <MiniCanvas strokes={room.strokes} color={room.color} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function CommunitySection() {
  const { ref, isInView } = useScrollAnimation();
  const navigate = useNavigate();

  return (
    <section id="community" className="py-32 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-20">
          <SectionHeader
            eyebrow={<><Wifi size={12} /> Live Right Now</>}
            eyebrowColor="bg-coral/15 text-coral-dark"
            title={<>The Community<br />is Drawing</>}
            subtitle="Hundreds of creative sessions happening this very moment. Jump into any public room or start your own."
          />
        </div>

        {/* Stats bar */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-3 gap-4 mb-12"
        >
          {stats.map(s => (
            <div
              key={s.label}
              className={`${s.bg} rounded-2xl px-6 py-8 text-center border border-[#e4ddd3] shadow-[0_4px_20px_rgb(0_0_0/0.07),0_1px_6px_rgb(0_0_0/0.03)]`}
            >
              <div className="text-3xl mb-2">{s.icon}</div>
              <p style={{ fontFamily: 'var(--font-display)' }} className={`text-4xl font-bold mb-1 ${s.text}`}>{s.value}</p>
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Room cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {activeRooms.map((room, i) => (
            <RoomCard key={room.id} room={room} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/discover')}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white border border-cream-dark text-gray-700 font-semibold text-sm hover:border-lavender hover:text-lavender-dark transition-all shadow-[0_2px_8px_rgb(0_0_0/0.07)] hover:shadow-[0_6px_20px_rgb(0_0_0/0.10)]"
          >
            Browse All Rooms
            <ArrowRight size={15} />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
