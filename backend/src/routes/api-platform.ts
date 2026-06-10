import { Router, type Request, type Response, type NextFunction } from 'express';
import { supabaseAdmin } from '../db';
import crypto from 'crypto';

const router = Router();

// ── API Key auth middleware ────────────────────────────────────
export async function requireApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  const key = req.headers['x-api-key'] as string | undefined
    ?? req.query.api_key as string | undefined;
  if (!key) { res.status(401).json({ error: 'API key required' }); return; }
  if (!supabaseAdmin) { next(); return; } // dev mode pass-through

  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const { data } = await supabaseAdmin.from('api_keys')
    .select('user_id, scopes, is_active, expires_at')
    .eq('key_hash', keyHash).single();

  const k = data as { user_id: string; scopes: string[]; is_active: boolean; expires_at: string | null } | null;
  if (!k || !k.is_active) { res.status(401).json({ error: 'Invalid or inactive API key' }); return; }
  if (k.expires_at && new Date(k.expires_at) < new Date()) { res.status(401).json({ error: 'API key expired' }); return; }

  (req as Request & { apiUserId: string; apiScopes: string[] }).apiUserId = k.user_id;
  (req as Request & { apiUserId: string; apiScopes: string[] }).apiScopes = k.scopes;

  // Update last_used
  void supabaseAdmin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('key_hash', keyHash);
  next();
}

// ── Developer Dashboard routes (authenticated via Supabase) ───

async function getAuthUser(req: Request): Promise<string | null> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !supabaseAdmin) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user?.id ?? null;
}

// List API keys
router.get('/keys', async (req, res) => {
  const uid = await getAuthUser(req);
  if (!uid || !supabaseAdmin) { res.json({ keys: [] }); return; }
  const { data } = await supabaseAdmin.from('api_keys')
    .select('id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_at')
    .eq('user_id', uid).order('created_at', { ascending: false });
  res.json({ keys: data ?? [] });
});

// Create API key
router.post('/keys', async (req, res) => {
  const uid = await getAuthUser(req);
  if (!uid || !supabaseAdmin) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { name, scopes = ['read:drawings', 'read:profile'], expiresInDays } = req.body as {
    name: string; scopes?: string[]; expiresInDays?: number;
  };
  if (!name) { res.status(400).json({ error: 'Name required' }); return; }

  // Generate key: pc_live_[32 random hex chars]
  const rawKey  = `pc_live_${crypto.randomBytes(16).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const prefix  = rawKey.slice(0, 12);
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
    : null;

  const { data, error } = await supabaseAdmin.from('api_keys').insert({
    user_id: uid, name, key_hash: keyHash, key_prefix: prefix, scopes, expires_at: expiresAt,
  }).select('id, name, key_prefix, scopes, created_at').single();
  if (error) { res.status(400).json({ error: error.message }); return; }

  // Return the raw key ONCE — never again stored
  res.json({ key: rawKey, ...data });
});

// Revoke API key
router.delete('/keys/:id', async (req, res) => {
  const uid = await getAuthUser(req);
  if (!uid || !supabaseAdmin) { res.status(401).json({ error: 'Unauthorized' }); return; }
  await supabaseAdmin.from('api_keys').update({ is_active: false }).eq('id', req.params.id).eq('user_id', uid);
  res.json({ ok: true });
});

// ── Webhook subscriptions ─────────────────────────────────────
router.get('/webhooks', async (req, res) => {
  const uid = await getAuthUser(req);
  if (!uid || !supabaseAdmin) { res.json({ webhooks: [] }); return; }
  const { data } = await supabaseAdmin.from('webhook_subscriptions')
    .select('id, url, events, is_active, last_fired, created_at').eq('user_id', uid);
  res.json({ webhooks: data ?? [] });
});

router.post('/webhooks', async (req, res) => {
  const uid = await getAuthUser(req);
  if (!uid || !supabaseAdmin) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { url, events } = req.body as { url: string; events: string[] };
  if (!url || !events?.length) { res.status(400).json({ error: 'url and events required' }); return; }
  const secret = `whsec_${crypto.randomBytes(16).toString('hex')}`;
  const { data } = await supabaseAdmin.from('webhook_subscriptions').insert({
    user_id: uid, url, events, secret,
  }).select().single();
  res.json({ ...data, secret }); // return secret once
});

router.delete('/webhooks/:id', async (req, res) => {
  const uid = await getAuthUser(req);
  if (!uid || !supabaseAdmin) { res.status(401).json({ error: 'Unauthorized' }); return; }
  await supabaseAdmin.from('webhook_subscriptions').delete().eq('id', req.params.id).eq('user_id', uid);
  res.json({ ok: true });
});

// ── Public API v1 (requires API key) ─────────────────────────

// GET /api/v1/me
router.get('/v1/me', requireApiKey, async (req, res) => {
  if (!supabaseAdmin) { res.json({}); return; }
  const uid = (req as Request & { apiUserId: string }).apiUserId;
  const { data } = await supabaseAdmin.from('profiles')
    .select('id, username, avatar_url, bio, level, xp, follower_count, total_drawings, created_at')
    .eq('id', uid).single();
  res.json(data);
});

// GET /api/v1/drawings
router.get('/v1/drawings', requireApiKey, async (req, res) => {
  if (!supabaseAdmin) { res.json({ drawings: [] }); return; }
  const uid   = (req as Request & { apiUserId: string }).apiUserId;
  const limit = Math.min(parseInt(req.query.limit as string ?? '20'), 100);
  const { data } = await supabaseAdmin.from('drawings')
    .select('id, title, thumbnail_url, like_count, is_public, created_at, updated_at')
    .eq('user_id', uid).order('created_at', { ascending: false }).limit(limit);
  res.json({ drawings: data ?? [] });
});

// GET /api/v1/gallery
router.get('/v1/gallery', requireApiKey, async (req, res) => {
  if (!supabaseAdmin) { res.json({ drawings: [] }); return; }
  const limit = Math.min(parseInt(req.query.limit as string ?? '20'), 100);
  const { data } = await supabaseAdmin.from('drawings')
    .select('id, title, thumbnail_url, like_count, view_count, user_id, tags, published_at')
    .eq('is_public', true).order('like_count', { ascending: false }).limit(limit);
  res.json({ drawings: data ?? [] });
});

// Available scopes documentation
router.get('/scopes', (_req, res) => {
  res.json({
    scopes: [
      { id: 'read:drawings',   desc: 'Read your drawings and metadata' },
      { id: 'write:drawings',  desc: 'Create and update drawings' },
      { id: 'read:profile',    desc: 'Read your profile information' },
      { id: 'write:profile',   desc: 'Update your profile' },
      { id: 'read:community',  desc: 'Read community data' },
      { id: 'read:analytics',  desc: 'Read your creator analytics' },
    ],
    webhook_events: [
      'drawing.created', 'drawing.published', 'drawing.liked',
      'follower.new', 'challenge.completed', 'game.won',
      'subscription.created', 'subscription.canceled',
      'tip.received', 'marketplace.sold',
    ],
  });
});

export default router;
