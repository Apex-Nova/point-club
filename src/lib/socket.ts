import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string ?? 'http://localhost:3001';

export type AppSocket = Socket;

export function createRoomSocket(token?: string): AppSocket {
  return io(SOCKET_URL, {
    auth:                    { token },
    reconnection:            true,
    reconnectionAttempts:    Infinity,
    reconnectionDelay:       500,
    reconnectionDelayMax:    5000,
    randomizationFactor:     0.5,
    timeout:                 10_000,
    transports:              ['websocket', 'polling'],
    withCredentials:         true,
    autoConnect:             false,  // connect manually after joining room
  });
}
