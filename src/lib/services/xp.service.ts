import { supabase } from '../supabase';

export interface XPProfile {
  xp:    number;
  level: number;
}

export interface Mission {
  id:           string;
  title:        string;
  description:  string;
  type:         string;
  xp_reward:    number;
  badge_reward: string | null;
  progress?:    number;
  completed_at?: string | null;
}

// XP needed to reach a given level: level^2 * 100
export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100;
}

export function levelFromXP(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
}

// Progress within current level: 0–1
export function levelProgress(xp: number): number {
  const level     = levelFromXP(xp);
  const current   = xpForLevel(level);
  const next      = xpForLevel(level + 1);
  return (xp - current) / (next - current);
}

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Sketcher', 5: 'Doodler', 10: 'Artist', 20: 'Creative',
  30: 'Master', 50: 'Legend', 75: 'Grandmaster', 100: 'Icon',
};

export function getLevelTitle(level: number): string {
  const thresholds = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a);
  for (const t of thresholds) if (level >= t) return LEVEL_TITLES[t];
  return 'Sketcher';
}

export async function getXPProfile(userId: string): Promise<XPProfile> {
  const { data } = await supabase.from('profiles').select('xp, level').eq('id', userId).single();
  return { xp: (data as { xp: number; level: number })?.xp ?? 0, level: (data as { xp: number; level: number })?.level ?? 1 };
}

export async function getMissions(userId: string): Promise<Mission[]> {
  const { data: catalog }   = await supabase.from('missions').select('*');
  const { data: userMissions } = await supabase.from('user_missions').select('*').eq('user_id', userId);
  return (catalog ?? []).map((m: Record<string, unknown>) => {
    const um = (userMissions ?? []).find((u: Record<string, unknown>) => u.mission_id === m.id) as Record<string, unknown> | undefined;
    return { ...m, progress: (um?.progress as number) ?? 0, completed_at: (um?.completed_at as string) ?? null } as Mission;
  });
}
