import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

// ── Supabase client for mobile ────────────────────────────────
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: false,
  },
});

// ── Socket.IO client ─────────────────────────────────────────
const SOCKET_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export function createSocket(token?: string) {
  return io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: false,
  });
}

// ── REST API helper ───────────────────────────────────────────
const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${API_BASE}${path}`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
  });
  return res.json() as Promise<T>;
}
