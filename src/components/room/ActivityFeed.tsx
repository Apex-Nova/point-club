import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserMinus, Pencil, Eraser, Trash2, CornerUpLeft } from 'lucide-react';
import type { ActivityEvent } from '@/types/room';

const icons: Record<ActivityEvent['type'], { icon: React.ElementType; color: string }> = {
  join:  { icon: UserPlus,   color: 'text-emerald-500' },
  leave: { icon: UserMinus,  color: 'text-orange-400'  },
  draw:  { icon: Pencil,     color: 'text-lavender-dark' },
  erase: { icon: Eraser,     color: 'text-coral'        },
  clear: { icon: Trash2,     color: 'text-coral-dark'   },
  undo:  { icon: CornerUpLeft, color: 'text-gray-400'   },
};

const labels: Record<ActivityEvent['type'], string> = {
  join:  'joined the room',
  leave: 'left the room',
  draw:  'started drawing',
  erase: 'erased content',
  clear: 'cleared canvas',
  undo:  'undid a stroke',
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

export default function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="flex flex-col bg-white border-t border-cream-dark flex-1 overflow-hidden min-h-0">
      <div className="px-3 py-2 border-b border-cream-dark">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Activity</h3>
      </div>
      <div className="flex-1 overflow-y-auto py-2 flex flex-col-reverse min-h-0">
        <AnimatePresence initial={false}>
          {events.map(ev => {
            const { icon: Icon, color } = icons[ev.type];
            return (
              <motion.div
                key={ev.id}
                layout
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 px-3 py-1.5"
              >
                <Icon size={12} className={`${color} mt-0.5 shrink-0`} />
                <span className="text-[11px] text-gray-500 leading-snug">
                  <span className="font-semibold text-gray-700">{ev.username}</span>{' '}
                  {labels[ev.type]}
                </span>
                <span className="text-[10px] text-gray-300 ml-auto shrink-0">{timeAgo(ev.timestamp)}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {events.length === 0 && (
          <p className="text-[11px] text-gray-300 text-center py-4">No activity yet</p>
        )}
      </div>
    </div>
  );
}
