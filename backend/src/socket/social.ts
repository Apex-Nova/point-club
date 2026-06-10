import type { Server, Socket } from 'socket.io';
import { supabaseAdmin } from '../db';
import { generateActivityId } from '../rooms/roomUtils';

// Track userId → socketId for direct notification delivery
const userSocketMap = new Map<string, string>();

export function getUserSocket(userId: string): string | undefined {
  return userSocketMap.get(userId);
}

export function registerSocialHandlers(io: Server, socket: Socket) {
  // ── Authentication / presence ────────────────────────────────────────────
  socket.on('user:auth', ({ userId, username }: { userId: string; username: string }) => {
    socket.data.userId   = userId;
    socket.data.username = username;
    userSocketMap.set(userId, socket.id);

    // Join personal notification room
    socket.join(`user:${userId}`);

    // Mark online in DB
    void supabaseAdmin?.from('user_presence').upsert({
      user_id: userId, status: 'online', last_seen: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // Notify friends this user came online
    socket.emit('social:auth-ok', { userId });
  });

  socket.on('presence:update', ({ status, roomId }: { status: string; roomId?: string }) => {
    const userId = socket.data.userId as string | undefined;
    if (!userId) return;
    void supabaseAdmin?.from('user_presence').upsert({
      user_id: userId, status, current_room_id: roomId ?? null,
      last_seen: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  });

  // ── Friend request notification relay ────────────────────────────────────
  socket.on('social:friend-request', async ({ targetUserId }: { targetUserId: string }) => {
    const fromUserId = socket.data.userId as string | undefined;
    if (!fromUserId || !targetUserId) return;

    const notif = {
      id:         generateActivityId(),
      type:       'friend_request',
      title:      'Friend Request',
      message:    `${socket.data.username as string} sent you a friend request`,
      data:       { fromUserId },
      created_at: new Date().toISOString(),
    };

    // Real-time push
    io.to(`user:${targetUserId}`).emit('notification:push', notif);

    // Persist
    void supabaseAdmin?.from('notifications').insert({
      user_id: targetUserId, type: notif.type,
      title: notif.title, message: notif.message,
      data: notif.data as unknown as Record<string, unknown>,
    });
  });

  socket.on('social:friend-accept', async ({ requesterUserId }: { requesterUserId: string }) => {
    const acceptorUserId = socket.data.userId as string | undefined;
    if (!acceptorUserId) return;

    const notif = {
      id:         generateActivityId(),
      type:       'friend_accepted',
      title:      'Friend Request Accepted',
      message:    `${socket.data.username as string} accepted your friend request`,
      data:       { acceptorUserId },
      created_at: new Date().toISOString(),
    };
    io.to(`user:${requesterUserId}`).emit('notification:push', notif);
    void supabaseAdmin?.from('notifications').insert({
      user_id: requesterUserId, type: notif.type,
      title: notif.title, message: notif.message,
      data: notif.data as unknown as Record<string, unknown>,
    });
  });

  socket.on('social:room-invite', ({ targetUserId, roomId, roomName }: { targetUserId: string; roomId: string; roomName: string }) => {
    const fromUserId = socket.data.userId as string | undefined;
    if (!fromUserId) return;
    const notif = {
      id: generateActivityId(), type: 'room_invite',
      title: 'Room Invitation',
      message: `${socket.data.username as string} invited you to "${roomName}"`,
      data: { roomId, fromUserId },
      created_at: new Date().toISOString(),
    };
    io.to(`user:${targetUserId}`).emit('notification:push', notif);
    void supabaseAdmin?.from('notifications').insert({
      user_id: targetUserId, type: notif.type,
      title: notif.title, message: notif.message,
      data: notif.data as unknown as Record<string, unknown>,
    });
  });

  // ── Disconnect cleanup ────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const userId = socket.data.userId as string | undefined;
    if (!userId) return;
    userSocketMap.delete(userId);
    void supabaseAdmin?.from('user_presence').upsert({
      user_id: userId, status: 'offline',
      last_seen: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  });
}
