import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, X, UserPlus, UserCheck, DoorOpen, AtSign, Star, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationRow } from '@/lib/services/social.service';

const ICONS: Record<string, React.ElementType> = {
  friend_request:  UserPlus,
  friend_accepted: UserCheck,
  room_invite:     DoorOpen,
  mention:         AtSign,
  follow:          Star,
  achievement:     Trophy,
};

const COLORS: Record<string, string> = {
  friend_request:  'bg-lavender-light text-lavender-dark',
  friend_accepted: 'bg-mint/30 text-emerald-600',
  room_invite:     'bg-sky/30 text-sky-600',
  mention:         'bg-peach/40 text-orange-500',
  follow:          'bg-lavender-light text-lavender-dark',
  achievement:     'bg-peach/40 text-orange-500',
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function NotifItem({ notif, onRead, onDismiss }: { notif: NotificationRow; onRead: () => void; onDismiss: () => void }) {
  const Icon = ICONS[notif.type] ?? Bell;
  const cls  = COLORS[notif.type] ?? 'bg-lavender-light text-lavender-dark';

  return (
    <div onClick={onRead} className={`flex items-start gap-3 px-4 py-3 hover:bg-cream transition-colors cursor-pointer relative ${!notif.is_read ? 'bg-lavender-light/20' : ''}`}>
      {!notif.is_read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-lavender-dark" />}
      <div className={`w-7 h-7 rounded-xl ${cls} flex items-center justify-center shrink-0`}>
        <Icon size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-700">{notif.title}</p>
        {notif.message && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>}
        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(notif.created_at)}</p>
      </div>
      <button onClick={e => { e.stopPropagation(); onDismiss(); }} className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 mt-0.5">
        <X size={12} />
      </button>
    </div>
  );
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setOpen(v => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-cream transition-colors text-gray-500">
        <Bell size={18} />
        {unreadCount > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-coral text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-cream-dark overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-cream-dark">
              <h3 style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-gray-800 text-sm">Notifications</h3>
              <button onClick={() => markAllRead()} className="text-[11px] text-lavender-dark font-semibold hover:underline flex items-center gap-1">
                <CheckCheck size={12} /> Mark all read
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-cream-dark">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">All caught up!</p>
                </div>
              ) : notifications.map(n => (
                <NotifItem
                  key={n.id}
                  notif={n}
                  onRead={() => { markRead(n.id); if (n.data?.roomId) { navigate(`/room/${n.data.roomId}`); setOpen(false); } }}
                  onDismiss={() => dismiss(n.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
