import { Router } from 'express';
import { supabaseAdmin } from '../db';

const router = Router();

async function getAuthUser(req: import('express').Request): Promise<string | null> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !supabaseAdmin) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user?.id ?? null;
}

// List workflows
router.get('/workflows', async (req, res) => {
  const uid = await getAuthUser(req);
  if (!uid || !supabaseAdmin) { res.json({ workflows: [] }); return; }
  const { data } = await supabaseAdmin
    .from('automation_workflows')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  res.json({ workflows: data ?? [] });
});

// Create workflow
router.post('/workflows', async (req, res) => {
  const uid = await getAuthUser(req);
  if (!uid || !supabaseAdmin) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { name, description, trigger, actions, is_active = true } = req.body as {
    name: string; description?: string; trigger: object; actions: object[]; is_active?: boolean;
  };
  const { data, error } = await supabaseAdmin.from('automation_workflows').insert({
    user_id: uid, name, description, trigger, actions, is_active,
  }).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ workflow: data });
});

// Update workflow
router.patch('/workflows/:id', async (req, res) => {
  const uid = await getAuthUser(req);
  if (!uid || !supabaseAdmin) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { is_active, name, description, trigger, actions } = req.body as {
    is_active?: boolean; name?: string; description?: string; trigger?: object; actions?: object[];
  };
  const updates: Record<string, unknown> = {};
  if (is_active !== undefined) updates.is_active = is_active;
  if (name)        updates.name = name;
  if (description) updates.description = description;
  if (trigger)     updates.trigger = trigger;
  if (actions)     updates.actions = actions;

  const { error } = await supabaseAdmin.from('automation_workflows')
    .update(updates).eq('id', req.params.id).eq('user_id', uid);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true });
});

// Delete workflow
router.delete('/workflows/:id', async (req, res) => {
  const uid = await getAuthUser(req);
  if (!uid || !supabaseAdmin) { res.status(401).json({ error: 'Unauthorized' }); return; }
  await supabaseAdmin.from('automation_workflows').delete().eq('id', req.params.id).eq('user_id', uid);
  res.json({ success: true });
});

// Manual trigger / test run
router.post('/workflows/:id/run', async (req, res) => {
  const uid = await getAuthUser(req);
  if (!uid || !supabaseAdmin) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { data: workflow } = await supabaseAdmin.from('automation_workflows')
    .select('*').eq('id', req.params.id).eq('user_id', uid).single();
  if (!workflow) { res.status(404).json({ error: 'Workflow not found' }); return; }

  // Create a run record
  const { data: run } = await supabaseAdmin.from('automation_runs').insert({
    workflow_id:  req.params.id,
    status:       'running',
    trigger_data: { manual: true, triggered_by: uid },
    started_at:   new Date().toISOString(),
  }).select().single();

  // Simulate execution
  setTimeout(async () => {
    if (!supabaseAdmin || !run) return;
    await supabaseAdmin.from('automation_runs').update({
      status:       'success',
      output:       { message: 'Workflow executed successfully', actions_run: (workflow.actions as object[]).length },
      completed_at: new Date().toISOString(),
    }).eq('id', (run as { id: string }).id);

    await supabaseAdmin.from('automation_workflows').update({
      run_count:   (workflow.run_count as number) + 1,
      last_run_at: new Date().toISOString(),
    }).eq('id', req.params.id);
  }, 500);

  res.json({ run });
});

// Get workflow runs
router.get('/workflows/:id/runs', async (req, res) => {
  const uid = await getAuthUser(req);
  if (!uid || !supabaseAdmin) { res.json({ runs: [] }); return; }
  const { data } = await supabaseAdmin.from('automation_runs')
    .select('*').eq('workflow_id', req.params.id)
    .order('started_at', { ascending: false }).limit(20);
  res.json({ runs: data ?? [] });
});

export default router;
