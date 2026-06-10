import { supabase } from '../supabase';

export interface FullProfile {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  drawing_interests: string[] | null;
  social_links: Record<string, string> | null;
  privacy_settings: Record<string, unknown> | null;
  total_drawings: number;
  rooms_created: number;
  follower_count: number;
  following_count: number;
  friend_count: number;
  created_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  earned_at?: string;
}

export async function getProfileByUsername(username: string): Promise<FullProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();
  if (error) return null;
  return data as unknown as FullProfile;
}

export async function getProfileById(id: string): Promise<FullProfile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
  return data as unknown as FullProfile | null;
}

export async function updateProfile(patch: Partial<FullProfile>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
  if (error) throw error;
}

export async function uploadAvatar(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const ext  = file.name.split('.').pop() ?? 'jpg';
  const path = `avatars/${user.id}.${ext}`;
  const { error } = await supabase.storage.from('thumbnails').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('thumbnails').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  const { data } = await supabase
    .from('user_achievements')
    .select('earned_at, achievement:achievements(id,title,description,icon,points)')
    .eq('user_id', userId);
  if (!data) return [];
  return data.map(r => ({ ...(r.achievement as unknown as Achievement), earned_at: r.earned_at }));
}

export async function awardAchievement(userId: string, achievementId: string) {
  await supabase.from('user_achievements').insert({ user_id: userId, achievement_id: achievementId })
    .then().catch(() => {}); // ignore duplicate
}

// Seed default achievements if not present
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_drawing',  title: 'First Stroke',       description: 'Created your first drawing',    icon: '✏️', points: 10 },
  { id: 'first_friend',   title: 'New Friend',          description: 'Added your first friend',       icon: '🤝', points: 10 },
  { id: 'first_room',     title: 'Room Creator',        description: 'Created your first room',       icon: '🚪', points: 20 },
  { id: '10_drawings',    title: 'Sketch Artist',       description: 'Created 10 drawings',           icon: '🎨', points: 25 },
  { id: '100_drawings',   title: 'Creative Master',     description: 'Created 100 drawings',          icon: '🏆', points: 100 },
  { id: 'collaborator',   title: 'Collaborator',        description: 'Drew with 5 different people',  icon: '👥', points: 30 },
  { id: 'early_adopter',  title: 'Early Adopter',       description: 'Joined during the beta phase',  icon: '⭐', points: 50 },
  { id: 'community_fav',  title: 'Community Favorite',  description: 'Gained 100 followers',          icon: '💜', points: 75 },
];
