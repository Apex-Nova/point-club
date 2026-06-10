import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import type { NotificationRow } from '@/lib/services/social.service';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/services/social.service';
import { useAuth } from '@/contexts/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const socket = useSocket();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setNotifications(await getNotifications());
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Real-time push via Socket.IO
  useEffect(() => {
    if (!socket) return;
    const handler = (notif: NotificationRow) => {
      setNotifications(prev => [notif, ...prev]);
    };
    socket.on('notification:push', handler);
    return () => { socket.off('notification:push', handler); };
  }, [socket]);

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await markNotificationRead(id);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await markAllNotificationsRead();
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return { notifications, unreadCount, loading, markRead, markAllRead, dismiss, refresh: load };
}
