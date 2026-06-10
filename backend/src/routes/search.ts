import { Router } from 'express';
import { supabaseAdmin } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  const { q, type, limit = '12' } = req.query as { q?: string; type?: string; limit?: string };
  if (!q || q.trim().length < 2) { res.json({ results: [] }); return; }

  const query      = q.trim();
  const maxResults = Math.min(parseInt(limit), 50);

  if (!supabaseAdmin) {
    res.json({ results: [] }); return;
  }

  try {
    const results: SearchResult[] = [];

    // Users
    if (!type || type === 'user') {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id, username, avatar_url, bio, follower_count, level')
        .ilike('username', `%${query}%`)
        .limit(maxResults);
      (data ?? []).forEach((p: Record<string, unknown>) => results.push({
        id:          p.id as string,
        type:        'user',
        title:       (p.username as string) ?? 'Anonymous',
        description: (p.bio as string) ?? undefined,
        image:       (p.avatar_url as string) ?? undefined,
        url:         `/profile/${p.username as string}`,
        score:       (p.follower_count as number) ?? 0,
      }));
    }

    // Drawings (public)
    if (!type || type === 'drawing') {
      const { data } = await supabaseAdmin
        .from('drawings')
        .select('id, title, thumbnail_url, like_count, user_id')
        .eq('is_public', true)
        .ilike('title', `%${query}%`)
        .limit(maxResults);
      (data ?? []).forEach((d: Record<string, unknown>) => results.push({
        id:    d.id as string,
        type:  'drawing',
        title: d.title as string,
        image: (d.thumbnail_url as string) ?? undefined,
        url:   `/gallery`,
        score: (d.like_count as number) ?? 0,
      }));
    }

    // Communities
    if (!type || type === 'community') {
      const { data } = await supabaseAdmin
        .from('communities')
        .select('id, slug, name, description, avatar_url, member_count')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_private', false)
        .limit(maxResults);
      (data ?? []).forEach((c: Record<string, unknown>) => results.push({
        id:          c.id as string,
        type:        'community',
        title:       c.name as string,
        description: (c.description as string) ?? undefined,
        image:       (c.avatar_url as string) ?? undefined,
        url:         `/communities/${c.slug as string}`,
        score:       (c.member_count as number) ?? 0,
      }));
    }

    // Sort by score desc
    results.sort((a, b) => b.score - a.score);
    res.json({ results: results.slice(0, maxResults) });
  } catch (err) {
    console.error('[search]', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

interface SearchResult {
  id:          string;
  type:        'user' | 'drawing' | 'community' | 'room';
  title:       string;
  description?: string;
  image?:       string;
  url:         string;
  score:       number;
}

export default router;
