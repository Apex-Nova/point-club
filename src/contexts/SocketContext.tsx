import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { createRoomSocket } from '@/lib/socket';
import { useAuth } from './AuthContext';

function getGuestId(): string {
  const key = 'pc_guest_id';
  try {
    let id = sessionStorage.getItem(key);
    if (!id) { id = `guest_${Math.random().toString(36).slice(2, 10)}`; sessionStorage.setItem(key, id); }
    return id;
  } catch {
    // sessionStorage blocked in iframe (e.g. CrazyGames) — generate ephemeral ID
    return `guest_${Math.random().toString(36).slice(2, 10)}`;
  }
}

interface SocketContextValue {
  socket:    Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket,    setSocket]    = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const userId   = user?.id ?? getGuestId();
    const username = user?.user_metadata?.full_name
      ?? user?.email?.split('@')[0]
      ?? `Guest_${userId.slice(-4)}`;

    const sock = createRoomSocket();

    sock.on('connect',       () => { sock.emit('user:auth', { userId, username }); setConnected(true); });
    sock.on('disconnect',    () => setConnected(false));
    sock.on('connect_error', () => setConnected(false));

    sock.connect();
    setSocket(sock);

    return () => { sock.disconnect(); setSocket(null); setConnected(false); };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): Socket | null {
  return useContext(SocketContext).socket;
}

export function useSocketConnected(): boolean {
  return useContext(SocketContext).connected;
}
