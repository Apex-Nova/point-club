import { Router, type Request, type Response, type NextFunction } from 'express';
import { supabaseAdmin } from '../db';

const router = Router();

// ── Admin auth middleware ─────────────────────────────────────
async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !supabaseAdmin) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { data: profile } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!(profile as { is_admin: boolean } | null)?.is_admin) { res.status(403).json({ error: 'Forbidden' }); return; }
  next();
}

// Apply to all admin routes
router.use(requireAdmin);

// ── Platform stats ────────────────────────────────────────────
router.get('/stats', async (_req, res) => {
  if (!supabaseAdmin) { res.json({}); return; }
  const [users, drawings, games, challenges, tips] = await Promise.all([
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('drawings').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('game_participants').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('challenge_entries').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('tips').select('amount_cents'),
  ]);
  const totalRevenue = ((tips.data ?? []) as { amount_cents: number }[]).reduce((s, t) => s + t.amount_cents, 0);
  res.json({
    totalUsers:      users.count    ?? 0,
    totalDrawings:   drawings.count ?? 0,
    gamesPlayed:     games.count    ?? 0,
    challengeEntries: challenges.count ?? 0,
    totalRevenueCents: totalRevenue,
  });
});

// ── Users ─────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  if (!supabaseAdmin) { res.json({ users: [] }); return; }
  const { page = '0', search } = req.query as { page?: string; search?: string };
  const from = parseInt(page) * 20;
  let q = supabaseAdmin.from('profiles').select('id, username, email, premium_tier, xp, level, is_admin, created_at').range(from, from + 19);
  if (search) q = q.ilike('username', `%${search}%`);
  const { data } = await q.order('created_at', { ascending: false });
  res.json({ users: data ?? [] });
});

router.post('/users/:id/ban', async (req, res) => {
  if (!supabaseAdmin) { res.json({ ok: true }); return; }
  await supabaseAdmin.auth.admin.updateUserById(req.params.id, { ban_duration: '876600h' });
  await logAudit(req, 'ban_user', 'user', req.params.id);
  res.json({ ok: true });
});

router.post('/users/:id/unban', async (req, res) => {
  if (!supabaseAdmin) { res.json({ ok: true }); return; }
  await supabaseAdmin.auth.admin.updateUserById(req.params.id, { ban_duration: 'none' });
  await logAudit(req, 'unban_user', 'user', req.params.id);
  res.json({ ok: true });
});

router.post('/users/:id/make-admin', async (req, res) => {
  if (!supabaseAdmin) { res.json({ ok: true }); return; }
  await supabaseAdmin.from('profiles').update({ is_admin: true }).eq('id', req.params.id);
  res.json({ ok: true });
});

// ── Reports ───────────────────────────────────────────────────
router.get('/reports', async (_req, res) => {
  if (!supabaseAdmin) { res.json({ reports: [] }); return; }
  const { data } = await supabaseAdmin
    .from('reports')
    .select('*, reporter:profiles!reporter_id(username)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50);
  res.json({ reports: data ?? [] });
});

router.post('/reports/:id/resolve', async (req, res) => {
  if (!supabaseAdmin) { res.json({ ok: true }); return; }
  const { action } = req.body as { action: 'dismiss' | 'remove' };
  await supabaseAdmin.from('reports').update({ status: action === 'dismiss' ? 'dismissed' : 'reviewed' }).eq('id', req.params.id);
  await logAudit(req, `report_${action}`, 'report', req.params.id);
  res.json({ ok: true });
});

// ── Content moderation ────────────────────────────────────────
router.delete('/drawings/:id', async (req, res) => {
  if (!supabaseAdmin) { res.json({ ok: true }); return; }
  await supabaseAdmin.from('drawings').update({ is_public: false }).eq('id', req.params.id);
  await logAudit(req, 'remove_drawing', 'drawing', req.params.id);
  res.json({ ok: true });
});

// ── Challenges management ─────────────────────────────────────
router.post('/challenges', async (req, res) => {
  if (!supabaseAdmin) { res.json({ ok: true }); return; }
  const { date, prompt, theme, difficulty, xp_reward } = req.body as {
    date: string; prompt: string; theme?: string; difficulty: string; xp_reward: number;
  };
  const { data, error } = await supabaseAdmin.from('daily_challenges').upsert({
    date, prompt, theme, difficulty, xp_reward,
  }, { onConflict: 'date' }).select().single();
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json(data);
});

// ── Revenue ───────────────────────────────────────────────────
router.get('/revenue', async (_req, res) => {
  if (!supabaseAdmin) { res.json({ events: [] }); return; }
  const { data } = await supabaseAdmin
    .from('subscription_events')
    .select('*, user:profiles!user_id(username)')
    .order('created_at', { ascending: false })
    .limit(50);
  res.json({ events: data ?? [] });
});

// ── Audit log helper ──────────────────────────────────────────
async function logAudit(req: Request, action: string, targetType: string, targetId: string) {
  if (!supabaseAdmin) return;
  void supabaseAdmin.from('audit_logs').insert({
    action, target_type: targetType, target_id: targetId,
    ip_address: req.ip, user_agent: req.headers['user-agent'],
  });
}

export default router;
