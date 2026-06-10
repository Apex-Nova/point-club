import { supabase } from '../supabase';
import { track } from '../analytics';

const API = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

export interface CreatorStats {
  totalDrawings:    number;
  publicDrawings:   number;
  totalLikes:       number;
  totalViews:       number;
  totalFollowers:   number;
  totalTipsReceived: number;
  xp:               number;
  level:            number;
  challengesCompleted: number;
  gamesPlayed:      number;
}

export async function getCreatorStats(userId: string): Promise<CreatorStats> {
  const [drawings, followers, tips, profile, challenges] = await Promise.all([
    supabase.from('drawings').select('id, is_public, like_count, view_count').eq('user_id', userId),
    supabase.from('followers').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('tips').select('amount_cents').eq('recipient_id', userId),
    supabase.from('profiles').select('xp, level').eq('id', userId).single(),
    supabase.from('challenge_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  const dlist   = (drawings.data ?? []) as { is_public: boolean; like_count: number; view_count: number }[];
  const tipList = (tips.data ?? []) as { amount_cents: number }[];
  const p       = profile.data as { xp: number; level: number } | null;

  return {
    totalDrawings:     dlist.length,
    publicDrawings:    dlist.filter(d => d.is_public).length,
    totalLikes:        dlist.reduce((s, d) => s + d.like_count, 0),
    totalViews:        dlist.reduce((s, d) => s + d.view_count, 0),
    totalFollowers:    followers.count ?? 0,
    totalTipsReceived: tipList.reduce((s, t) => s + t.amount_cents, 0),
    xp:                p?.xp   ?? 0,
    level:             p?.level ?? 1,
    challengesCompleted: challenges.count ?? 0,
    gamesPlayed:       0,
  };
}

export async function getPlatformStats() {
  try {
    const headers: Record<string, string> = {};
    const { data: { session } } = await supabase.auth.getSession();
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
    const r = await fetch(`${API}/api/admin/stats`, { headers });
    return await r.json() as Record<string, number>;
  } catch {
    return {};
  }
}

// Thin wrapper so all app events flow through one place
export function trackEvent(event: string, props?: Record<string, unknown>) {
  track(event, props);
  // Also fire to backend for server-side analytics
  const { data: { user } } = { data: { user: null as null } };
  void fetch(`${API}/api/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, properties: props }),
    keepalive: true,
  }).catch(() => {});
  void user;
}
