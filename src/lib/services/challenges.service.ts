import { supabase } from '../supabase';

const API = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

export interface DailyChallenge {
  id:           string;
  date:         string;
  prompt:       string;
  theme:        string | null;
  difficulty:   'easy' | 'medium' | 'hard' | 'expert';
  xp_reward:    number;
  badge_reward: string | null;
}

export interface ChallengeEntry {
  id:              string;
  challenge_id:    string;
  user_id:         string;
  canvas_snapshot: string | null;
  like_count:      number;
  created_at:      string;
  author:          { username: string | null; avatar_url: string | null } | null;
}

export async function getTodaysChallenge(): Promise<DailyChallenge> {
  // Try DB first, fall back to backend deterministic picker
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase.from('daily_challenges').select('*').eq('date', today).single();
  if (data) return data as DailyChallenge;

  // Fallback from backend
  const r = await fetch(`${API}/api/challenges/today`);
  const c = await r.json() as { prompt: string; theme: string; difficulty: string };
  return {
    id: 'today', date: today,
    prompt: c.prompt, theme: c.theme,
    difficulty: c.difficulty as DailyChallenge['difficulty'],
    xp_reward: 50, badge_reward: null,
  };
}

export async function submitChallengeEntry(challengeId: string, canvasSnapshot: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase.from('challenge_entries').upsert({
    challenge_id: challengeId, user_id: user.id, canvas_snapshot: canvasSnapshot,
  }, { onConflict: 'challenge_id,user_id' });
  if (error) throw error;
}

export async function getChallengeEntries(challengeId: string): Promise<ChallengeEntry[]> {
  const { data } = await supabase
    .from('challenge_entries')
    .select('*, author:profiles!user_id(username,avatar_url)')
    .eq('challenge_id', challengeId)
    .order('like_count', { ascending: false })
    .limit(30);
  return (data ?? []) as unknown as ChallengeEntry[];
}

export async function hasCompletedToday(challengeId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('challenge_entries')
    .select('id').eq('challenge_id', challengeId).eq('user_id', user.id).maybeSingle();
  return Boolean(data);
}
