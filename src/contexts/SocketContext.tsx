import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { createRoomSocket } from '@/lib/socket';
import { useAuth } from './AuthContext';

// Stable guest ID across page refreshes
function getGuestId(): string {
  const key = 'pc_guest_id';
  let id = sessionStorage.getItem(key);
  if (!id) { id = `guest_${Math.random().toString(36).slice(2, 10)}`; sessionStorage.setItem(key, id); }
  return id;
}

interface SocketContextValue {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const userId   = user?.id ?? getGuestId();
    const username = user?.user_metadata?.full_name
      ?? user?.email?.split('@')[0]
      ?? `Guest_${userId.slice(-4)}`;

    const sock = createRoomSocket();

    sock.on('connect', () => {
      sock.emit('user:auth', { userId, username });
    });

    sock.connect();
    setSocket(sock);

    return () => {
      sock.disconnect();
      setSocket(null);
    };
  }, [user?.id]); // reconnect with new identity when auth changes

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): Socket | null {
  return useContext(SocketContext).socket;
}
