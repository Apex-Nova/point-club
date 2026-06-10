import { supabase } from '../supabase';

const API = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

export type GameType   = 'battle' | 'guess' | 'blind' | 'story';
export type GameStatus = 'lobby' | 'countdown' | 'drawing' | 'voting' | 'results' | 'finished';

export interface GameListing {
  id:          string;
  type:        GameType;
  roomCode:    string;
  playerCount: number;
  maxPlayers:  number;
  hostName:    string;
}

export interface LeaderboardEntry {
  userId:   string;
  username: string;
  score:    number;
}

export async function getRandomPrompt(): Promise<string> {
  try {
    const r = await fetch(`${API}/api/ai/prompt`);
    const d = await r.json() as { prompt: string };
    return d.prompt;
  } catch {
    return 'Draw something creative!';
  }
}

export async function getGlobalLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'all' = 'weekly') {
  const col = period === 'all' ? 'xp' : 'xp_this_week';
  const { data } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, xp, level, xp_this_week')
    .order(col, { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function awardXP(userId: string, source: string, amount: number, description?: string) {
  try {
    await fetch(`${API}/api/xp/award`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, source, amount, description }),
    });
  } catch { /* fire-and-forget */ }
}
