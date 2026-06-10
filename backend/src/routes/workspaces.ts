import { Router } from 'express';
import { supabaseAdmin } from '../db';
import crypto from 'crypto';

const router = Router();

// ── Auth helper ────────────────────────────────────────────────
async function getUserId(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader || !supabaseAdmin) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user?.id ?? null;
}

// ── Workspaces CRUD ────────────────────────────────────────────
router.get('/', async (req, res) => {
  const userId = await getUserId(req.headers.authorization);
  if (!userId || !supabaseAdmin) { res.json({ workspaces: [] }); return; }
  const { data } = await supabaseAdmin
    .from('workspaces')
    .select('*, members:workspace_members(user_id,role)')
    .or(`owner_id.eq.${userId},workspace_members.user_id.eq.${userId}`);
  res.json({ workspaces: data ?? [] });
});

router.post('/', async (req, res) => {
  const userId = await getUserId(req.headers.authorization);
  if (!userId || !supabaseAdmin) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { name, description } = req.body as { name: string; description?: string };
  if (!name?.trim()) { res.status(400).json({ error: 'Name required' }); return; }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  const { data, error } = await supabaseAdmin.from('workspaces').insert({
    name: name.trim(), slug, description, owner_id: userId,
  }).select().single();
  if (error) { res.status(400).json({ error: error.message }); return; }
  // Owner joins as admin
  await supabaseAdmin.from('workspace_members').insert({ workspace_id: (data as { id: string }).id, user_id: userId, role: 'owner' });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  if (!supabaseAdmin) { res.status(404).json({ error: 'Not found' }); return; }
  const { data } = await supabaseAdmin.from('workspaces')
    .select('*, members:workspace_members(user_id,role,profiles(username,avatar_url))')
    .eq('id', req.params.id).single();
  res.json(data);
});

// ── Projects ───────────────────────────────────────────────────
router.get('/:id/projects', async (req, res) => {
  if (!supabaseAdmin) { res.json({ projects: [] }); return; }
  const { data } = await supabaseAdmin.from('projects')
    .select('*, tasks(id,status)')
    .eq('workspace_id', req.params.id)
    .order('created_at', { ascending: false });
  res.json({ projects: data ?? [] });
});

router.post('/:id/projects', async (req, res) => {
  const userId = await getUserId(req.headers.authorization);
  if (!userId || !supabaseAdmin) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { name, description, cover_color, due_date } = req.body as {
    name: string; description?: string; cover_color?: string; due_date?: string;
  };
  const { data, error } = await supabaseAdmin.from('projects').insert({
    workspace_id: req.params.id, name, description, cover_color, due_date, owner_id: userId,
  }).select().single();
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json(data);
});

// ── Tasks (Kanban) ─────────────────────────────────────────────
router.get('/projects/:projectId/tasks', async (req, res) => {
  if (!supabaseAdmin) { res.json({ tasks: [] }); return; }
  const { data } = await supabaseAdmin.from('tasks')
    .select('*, assignee:profiles!assignee_id(username,avatar_url)')
    .eq('project_id', req.params.projectId)
    .order('sort_order', { ascending: true });
  res.json({ tasks: data ?? [] });
});

router.post('/projects/:projectId/tasks', async (req, res) => {
  const userId = await getUserId(req.headers.authorization);
  if (!userId || !supabaseAdmin) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { title, description, status = 'todo', priority = 'medium', assignee_id, due_date, tags } = req.body as {
    title: string; description?: string; status?: string; priority?: string;
    assignee_id?: string; due_date?: string; tags?: string[];
  };
  const { data, error } = await supabaseAdmin.from('tasks').insert({
    project_id: req.params.projectId, title, description, status, priority,
    assignee_id, due_date, tags, created_by: userId,
  }).select().single();
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json(data);
});

router.patch('/tasks/:id', async (req, res) => {
  if (!supabaseAdmin) { res.status(503).json({ error: 'Not configured' }); return; }
  const { status, title, description, priority, assignee_id, sort_order } = req.body as {
    status?: string; title?: string; description?: string;
    priority?: string; assignee_id?: string; sort_order?: number;
  };
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status !== undefined)     patch.status      = status;
  if (title !== undefined)      patch.title       = title;
  if (description !== undefined) patch.description = description;
  if (priority !== undefined)   patch.priority    = priority;
  if (assignee_id !== undefined) patch.assignee_id = assignee_id;
  if (sort_order !== undefined) patch.sort_order  = sort_order;
  const { data, error } = await supabaseAdmin.from('tasks').update(patch).eq('id', req.params.id).select().single();
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json(data);
});

router.delete('/tasks/:id', async (req, res) => {
  if (!supabaseAdmin) { res.status(503).json({ error: 'Not configured' }); return; }
  await supabaseAdmin.from('tasks').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

// ── Invites ────────────────────────────────────────────────────
router.post('/:id/invite', async (req, res) => {
  const userId = await getUserId(req.headers.authorization);
  if (!userId || !supabaseAdmin) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { email, role = 'member' } = req.body as { email: string; role?: string };
  const token = crypto.randomUUID();
  const { data } = await supabaseAdmin.from('workspace_invites').insert({
    workspace_id: req.params.id, email, role, token, invited_by: userId,
  }).select().single();
  // In prod: send invite email via Resend/SES
  res.json({ invite: data, inviteUrl: `${process.env.FRONTEND_URL}/workspace/join/${token}` });
});

export default router;
