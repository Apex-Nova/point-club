import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import {
  getFriends, getPendingRequests, sendFriendRequest,
  respondToFriendRequest, removeFriend,
  type FriendRelation,
} from '@/lib/services/social.service';
import { useToasts } from '@/drawing/hooks/useToasts';

export function useFriends() {
  const { user } = useAuth();
  const socket = useSocket();
  const { addToast } = useToasts();

  const [friends,  setFriends]  = useState<FriendRelation[]>([]);
  const [pending,  setPending]  = useState<FriendRelation[]>([]);
  const [loading,  setLoading]  = useState(true);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [f, p] = await Promise.all([getFriends(user.id), getPendingRequests(user.id)]);
    setFriends(f);
    setPending(p);
    setLoading(false);
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  // Real-time: accept/request notifications trigger a reload
  useEffect(() => {
    if (!socket) return;
    const handler = (notif: { type: string }) => {
      if (notif.type === 'friend_request' || notif.type === 'friend_accepted') {
        reload();
      }
    };
    socket.on('notification:push', handler);
    return () => { socket.off('notification:push', handler); };
  }, [socket, reload]);

  const sendRequest = useCallback(async (addresseeId: string) => {
    try {
      const rel = await sendFriendRequest(addresseeId);
      socket?.emit('social:friend-request', { targetUserId: addresseeId });
      addToast('Friend request sent', 'success');
      return rel;
    } catch {
      addToast('Failed to send request', 'error');
    }
  }, [socket, addToast]);

  const acceptRequest = useCallback(async (requestId: string, requesterId: string) => {
    try {
      await respondToFriendRequest(requestId, true);
      socket?.emit('social:friend-accept', { requesterUserId: requesterId });
      setPending(prev => prev.filter(p => p.id !== requestId));
      addToast('Friend request accepted!', 'success');
      reload();
    } catch {
      addToast('Failed to accept request', 'error');
    }
  }, [socket, addToast, reload]);

  const rejectRequest = useCallback(async (requestId: string) => {
    await respondToFriendRequest(requestId, false);
    setPending(prev => prev.filter(p => p.id !== requestId));
  }, []);

  const removeFriendById = useCallback(async (id: string) => {
    await removeFriend(id);
    setFriends(prev => prev.filter(f => f.id !== id));
    addToast('Friend removed', 'info');
  }, [addToast]);

  return { friends, pending, loading, sendRequest, acceptRequest, rejectRequest, removeFriendById, reload };
}
