import { useState, useEffect, useCallback, useRef } from 'react';
import type { Socket } from 'socket.io-client';

export interface ChatMessage {
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

export interface TypingUser {
  userId: string;
  username: string;
}

const TYPING_TIMEOUT_MS = 2500;

export function useRoomChat(socket: Socket | null, roomId: string | undefined) {
  const [messages,     setMessages]     = useState<ChatMessage[]>([]);
  const [typingUsers,  setTypingUsers]  = useState<TypingUser[]>([]);
  const [loaded,       setLoaded]       = useState(false);

  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isTypingRef  = useRef(false);
  const typingTimer  = useRef<ReturnType<typeof setTimeout>>(null);

  // Load history + subscribe to events on socket ready
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit('chat:history');

    const onHistory = ({ messages: hist }: { messages: ChatMessage[] }) => {
      setMessages(hist);
      setLoaded(true);
    };
    const onMessage = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    };
    const onTyping = ({ userId, username, isTyping }: TypingUser & { isTyping: boolean }) => {
      if (isTyping) {
        setTypingUsers(prev => prev.find(u => u.userId === userId) ? prev : [...prev, { userId, username }]);
        // Auto-clear after timeout
        const existing = typingTimers.current.get(userId);
        if (existing) clearTimeout(existing);
        typingTimers.current.set(userId, setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== userId));
        }, TYPING_TIMEOUT_MS));
      } else {
        setTypingUsers(prev => prev.filter(u => u.userId !== userId));
        clearTimeout(typingTimers.current.get(userId));
      }
    };
    const onReaction = ({ messageId, emoji, userId }: { messageId: string; emoji: string; userId: string }) => {
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        const existing = m.reactions[emoji] ?? [];
        const hasIt = existing.includes(userId);
        return {
          ...m,
          reactions: {
            ...m.reactions,
            [emoji]: hasIt ? existing.filter(u => u !== userId) : [...existing, userId],
          },
        };
      }));
    };

    socket.on('chat:history', onHistory);
    socket.on('chat:message', onMessage);
    socket.on('chat:typing',  onTyping);
    socket.on('chat:reaction', onReaction);

    return () => {
      socket.off('chat:history', onHistory);
      socket.off('chat:message', onMessage);
      socket.off('chat:typing',  onTyping);
      socket.off('chat:reaction', onReaction);
    };
  }, [socket, roomId]);

  const sendMessage = useCallback((content: string, mentions: string[] = []) => {
    if (!socket || !content.trim()) return;
    socket.emit('chat:send', { content, mentions });
    // Stop typing indicator
    if (isTypingRef.current) {
      socket.emit('chat:typing', { isTyping: false });
      isTypingRef.current = false;
    }
  }, [socket]);

  const handleInputChange = useCallback(() => {
    if (!socket) return;
    if (!isTypingRef.current) {
      socket.emit('chat:typing', { isTyping: true });
      isTypingRef.current = true;
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('chat:typing', { isTyping: false });
      isTypingRef.current = false;
    }, TYPING_TIMEOUT_MS);
  }, [socket]);

  const sendReaction = useCallback((messageId: string, emoji: string) => {
    socket?.emit('chat:react', { messageId, emoji });
  }, [socket]);

  return { messages, typingUsers, loaded, sendMessage, handleInputChange, sendReaction };
}
