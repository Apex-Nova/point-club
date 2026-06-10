import type { Server, Socket } from 'socket.io';
import { supabaseAdmin } from '../db';
import { generateActivityId } from '../rooms/roomUtils';

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  content: string;
  mentions: string[];
  reactions: Record<string, string[]>;
  is_pinned: boolean;
  created_at: string;
}

export function registerChatHandlers(io: Server, socket: Socket) {
  const uid  = () => socket.data.userId  as string | undefined;
  const uname = () => socket.data.username as string;
  const room  = () => socket.data.currentRoomId as string | undefined;

  socket.on('chat:send', async ({ content, mentions = [] }: { content: string; mentions: string[] }) => {
    const roomId = room();
    const userId = uid();
    if (!roomId || !userId) return;
    if (typeof content !== 'string' || !content.trim() || content.length > 2000) return;

    const msg: ChatMessage = {
      id:        generateActivityId(),
      room_id:   roomId,
      user_id:   userId,
      username:  uname() || 'Anonymous',
      content:   content.trim(),
      mentions,
      reactions: {},
      is_pinned: false,
      created_at: new Date().toISOString(),
    };

    // Persist
    void supabaseAdmin?.from('room_messages').insert({
      id: msg.id, room_id: msg.room_id, user_id: msg.user_id,
      username: msg.username, content: msg.content,
      mentions: msg.mentions as unknown as Record<string, unknown>,
    });

    io.to(roomId).emit('chat:message', msg);

    // Mention notifications
    for (const targetId of mentions) {
      io.to(`user:${targetId}`).emit('notification:push', {
        type: 'mention', title: 'You were mentioned',
        message: `${msg.username} mentioned you in a room`,
        data: { roomId, messageId: msg.id }, created_at: msg.created_at,
      });
    }
  });

  socket.on('chat:typing', ({ isTyping }: { isTyping: boolean }) => {
    const roomId = room();
    if (!roomId) return;
    socket.to(roomId).emit('chat:typing', { userId: uid(), username: uname(), isTyping });
  });

  socket.on('chat:history', async () => {
    const roomId = room();
    if (!roomId || !supabaseAdmin) { socket.emit('chat:history', { messages: [] }); return; }
    const { data } = await supabaseAdmin
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100);
    socket.emit('chat:history', { messages: data ?? [] });
  });

  socket.on('chat:react', ({ messageId, emoji }: { messageId: string; emoji: string }) => {
    const roomId = room();
    if (!roomId) return;
    io.to(roomId).emit('chat:reaction', { messageId, emoji, userId: uid(), username: uname() });
  });
}
