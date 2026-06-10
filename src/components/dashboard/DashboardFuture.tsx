import { motion } from 'framer-motion';
import { Mic, Users, Zap, MousePointer2 } from 'lucide-react';

const items = [
  { icon: Users,         title: 'Live Collaboration',  desc: 'Draw simultaneously with your team' },
  { icon: MousePointer2, title: 'Live Cursors',         desc: 'See where everyone is on the canvas' },
  { icon: Mic,           title: 'Voice Chat',           desc: 'Talk while you create together' },
  { icon: Zap,           title: 'Room Invitations',     desc: 'One-click invite links for your rooms' },
];

export default function DashboardFuture() {
  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 mb-5">
        <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-bold text-gray-700">
          Multiplayer Rooms
        </h2>
        <span className="px-2.5 py-0.5 rounded-full bg-lavender-light text-lavender-dark text-xs font-bold">
          Phase 4
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border-2 border-dashed border-cream-dark p-5 opacity-60 cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-xl bg-lavender-light flex items-center justify-center mb-3">
              <Icon size={18} className="text-lavender-dark" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">{title}</p>
            <p className="text-xs text-gray-400">{desc}</p>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-300 mt-4">
        Real-time multiplayer arrives in Phase 4 — WebSockets, presence, and live cursors
      </p>
    </section>
  );
}
