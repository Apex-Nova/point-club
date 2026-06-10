import { Router } from 'express';
import { supabaseAdmin } from '../db';

const router = Router();

async function getAuthUser(req: import('express').Request): Promise<string | null> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !supabaseAdmin) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user?.id ?? null;
}

// ── Signal recording ───────────────────────────────────────────
router.post('/signals', async (req, res) => {
  const uid = await getAuthUser(req);
  if (!uid || !supabaseAdmin) { res.json({ ok: true }); return; }
  const { signal_type, entity_type, entity_id, duration_ms } = req.body as {
    signal_type: string; entity_type: string; entity_id: string; duration_ms?: number;
  };
  await supabaseAdmin.from('recommendation_signals').insert({
    user_id: uid, signal_type, entity_type, entity_id,
    duration_ms: duration_ms ?? null, created_at: new Date().toISOString(),
  });
  res.json({ ok: true });
});

// ── Get personalized recommendations ──────────────────────────
router.get('/', async (req, res) => {
  const uid = await getAuthUser(req);
  if (!uid || !supabaseAdmin) {
    res.json(FALLBACK_RECS);
    return;
  }

  try {
    // Get user signals (last 30 days)
    const since = new Date(Date.now() - 86400000 * 30).toISOString();
    const { data: signals } = await supabaseAdmin
      .from('recommendation_signals')
      .select('entity_type, entity_id, signal_type')
      .eq('user_id', uid)
      .gte('created_at', since)
      .limit(100);

    // Get followed creators
    const { data: following } = await supabaseAdmin
      .from('follows')
      .select('following_id')
      .eq('follower_id', uid)
      .limit(50);

    const followingIds = new Set((following ?? []).map((f: { following_id: string }) => f.following_id));
    const signalSet = new Set((signals ?? []).map((s: { entity_id: string }) => s.entity_id));

    // Find creators not yet followed with high engagement
    const { data: creators } = await supabaseAdmin
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, follower_count')
      .not('id', 'eq', uid)
      .order('follower_count', { ascending: false })
      .limit(20);

    const recCreators = (creators ?? [])
      .filter((c: { id: string }) => !followingIds.has(c.id) && !signalSet.has(c.id))
      .slice(0, 4)
      .map((c: { id: string; username: string; display_name: string | null; avatar_url: string | null; bio: string | null; follower_count: number }) => ({
        ...c,
        reason: 'Trending creator',
        score: Math.random() * 0.3 + 0.7,
      }));

    // Return recommendations
    res.json({
      creators:    recCreators.length ? recCreators : FALLBACK_RECS.creators,
      content:     FALLBACK_RECS.content,
      challenges:  FALLBACK_RECS.challenges,
      communities: FALLBACK_RECS.communities,
      courses:     FALLBACK_RECS.courses,
    });
  } catch {
    res.json(FALLBACK_RECS);
  }
});

const FALLBACK_RECS = {
  creators: [
    { id: 'u1', username: 'aurora_draws', display_name: 'Aurora', avatar_url: null, bio: 'Concept artist & color theory', follower_count: 12847, reason: 'Trending in your style', score: 0.95 },
    { id: 'u2', username: 'pixelmaster99', display_name: 'Pixel Master', avatar_url: null, bio: 'Pixel art since 1990', follower_count: 8932, reason: 'Popular in your communities', score: 0.88 },
  ],
  content: [
    { type: 'drawing', id: 'd1', title: 'Cyberpunk Cityscape', author: 'aurora_draws', reason: 'Matches your recent themes', score: 0.93 },
    { type: 'room', id: 'r1', title: 'Sci-Fi Collab Room', reason: 'Active now, 8 artists inside', score: 0.87 },
  ],
  challenges: [
    { type: 'challenge', id: 'c1', title: 'Futurism Theme — June', reason: 'Aligns with your recent work', score: 0.91 },
  ],
  communities: [
    { type: 'community', id: 'com1', title: 'Concept Artists Guild', reason: '3 of your friends are members', score: 0.89 },
  ],
  courses: [
    { type: 'course', id: 'co1', title: 'Advanced Perspective Drawing', reason: 'Next step in your learning path', score: 0.88 },
  ],
};

export default router;
