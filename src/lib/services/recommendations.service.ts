import { supabase } from '../supabase';

const API = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

export interface RecommendedCreator {
  id:            string;
  username:      string;
  display_name:  string | null;
  avatar_url:    string | null;
  bio:           string | null;
  follower_count: number;
  reason:        string;
  score:         number;
}

export interface RecommendedContent {
  type:       'drawing' | 'room' | 'challenge' | 'community' | 'course' | 'asset';
  id:         string;
  title:      string;
  thumbnail?: string;
  author?:    string;
  reason:     string;
  score:      number;
  meta?:      Record<string, unknown>;
}

export interface Recommendations {
  creators:    RecommendedCreator[];
  content:     RecommendedContent[];
  challenges:  RecommendedContent[];
  communities: RecommendedContent[];
  courses:     RecommendedContent[];
}

// Signal types for recommendation engine
export interface InteractionSignal {
  type:      'view' | 'like' | 'save' | 'follow' | 'purchase' | 'complete' | 'share' | 'skip';
  entity_type: 'drawing' | 'creator' | 'challenge' | 'course' | 'community' | 'room';
  entity_id:   string;
  duration_ms?: number;
}

export async function recordSignal(signal: InteractionSignal): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  try {
    await supabase.from('recommendation_signals').insert({
      user_id:     session.user.id,
      signal_type: signal.type,
      entity_type: signal.entity_type,
      entity_id:   signal.entity_id,
      duration_ms: signal.duration_ms ?? null,
      created_at:  new Date().toISOString(),
    });
  } catch { /* non-critical */ }
}

const FALLBACK: Recommendations = {
  creators: [
    { id: 'u1', username: 'aurora_draws', display_name: 'Aurora', avatar_url: null, bio: 'Concept artist & color theory enthusiast', follower_count: 12847, reason: 'Trending in your style', score: 0.95 },
    { id: 'u2', username: 'pixelmaster99', display_name: 'Pixel Master', avatar_url: null, bio: 'Pixel art since 1990', follower_count: 8932, reason: 'Popular in your communities', score: 0.88 },
    { id: 'u3', username: 'sketchdaily', display_name: 'Sketch Daily', avatar_url: null, bio: 'A new sketch every single day', follower_count: 23100, reason: 'Highly active creator', score: 0.82 },
    { id: 'u4', username: 'zephyr_art', display_name: 'Zephyr', avatar_url: null, bio: 'Fantasy concept art & world-building', follower_count: 5642, reason: 'Similar drawing style', score: 0.79 },
  ],
  content: [
    { type: 'drawing', id: 'd1', title: 'Cyberpunk Cityscape', author: 'aurora_draws', reason: 'Matches your recent themes', score: 0.93 },
    { type: 'room', id: 'r1', title: 'Sci-Fi Collab Room', author: 'pixelmaster99', reason: 'Active now, 8 artists inside', score: 0.87 },
    { type: 'drawing', id: 'd2', title: 'Forest Spirit Studies', author: 'zephyr_art', reason: 'Popular in nature art', score: 0.81 },
  ],
  challenges: [
    { type: 'challenge', id: 'c1', title: 'Futurism Theme — June', reason: 'Aligns with your recent work', score: 0.91 },
    { type: 'challenge', id: 'c2', title: '60-Second Sketch Sprint', reason: 'You excel at quick sketches', score: 0.84 },
  ],
  communities: [
    { type: 'community', id: 'com1', title: 'Concept Artists Guild', reason: '3 of your friends are members', score: 0.89 },
    { type: 'community', id: 'com2', title: 'Color Theory Lab', reason: 'Based on your Color Expert usage', score: 0.82 },
  ],
  courses: [
    { type: 'course', id: 'co1', title: 'Advanced Perspective Drawing', reason: 'Next step in your learning path', score: 0.88 },
    { type: 'course', id: 'co2', title: 'Character Design Masterclass', reason: 'Popular with similar artists', score: 0.80 },
  ],
};

export async function getRecommendations(): Promise<Recommendations> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return FALLBACK;
    const res = await fetch(`${API}/api/recommendations`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return FALLBACK;
    return await res.json() as Recommendations;
  } catch { return FALLBACK; }
}

export async function dismissRecommendation(entityType: string, entityId: string): Promise<void> {
  await recordSignal({ type: 'skip', entity_type: entityType as InteractionSignal['entity_type'], entity_id: entityId });
}
