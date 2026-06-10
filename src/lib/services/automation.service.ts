import { supabase } from '../supabase';

const API = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` };
}

export type TriggerType = 'drawing_saved' | 'challenge_won' | 'weekly_summary' | 'new_follower' | 'sale_completed' | 'room_ended' | 'certification_earned' | 'custom';
export type ActionType  = 'post_to_gallery' | 'send_notification' | 'add_to_portfolio' | 'generate_summary' | 'award_xp' | 'send_email' | 'webhook' | 'create_post';

export interface WorkflowTrigger {
  type: TriggerType;
  conditions?: Record<string, unknown>;
}

export interface WorkflowAction {
  type:   ActionType;
  config: Record<string, unknown>;
}

export interface AutomationWorkflow {
  id:          string;
  name:        string;
  description: string | null;
  trigger:     WorkflowTrigger;
  actions:     WorkflowAction[];
  is_active:   boolean;
  run_count:   number;
  last_run_at: string | null;
  created_at:  string;
}

export interface AutomationRun {
  id:           string;
  workflow_id:  string;
  status:       'pending' | 'running' | 'success' | 'failed';
  trigger_data: Record<string, unknown>;
  output:       Record<string, unknown>;
  error:        string | null;
  started_at:   string;
  completed_at: string | null;
}

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  drawing_saved:        'Drawing Saved',
  challenge_won:        'Challenge Won',
  weekly_summary:       'Every Week (Sunday)',
  new_follower:         'New Follower',
  sale_completed:       'Sale Completed',
  room_ended:           'Room Session Ended',
  certification_earned: 'Certification Earned',
  custom:               'Custom Schedule',
};

export const ACTION_LABELS: Record<ActionType, string> = {
  post_to_gallery:    'Post to Gallery',
  send_notification:  'Send Notification',
  add_to_portfolio:   'Add to Portfolio',
  generate_summary:   'Generate AI Summary',
  award_xp:           'Award XP',
  send_email:         'Send Email',
  webhook:            'Trigger Webhook',
  create_post:        'Create Community Post',
};

export const TRIGGER_ICONS: Record<TriggerType, string> = {
  drawing_saved: '💾', challenge_won: '🏆', weekly_summary: '📅', new_follower: '👥',
  sale_completed: '💰', room_ended: '🚪', certification_earned: '🎓', custom: '⚙️',
};

export const ACTION_ICONS: Record<ActionType, string> = {
  post_to_gallery: '🖼️', send_notification: '🔔', add_to_portfolio: '📁',
  generate_summary: '✨', award_xp: '⚡', send_email: '📧', webhook: '🔗', create_post: '📝',
};

const MOCK_WORKFLOWS: AutomationWorkflow[] = [
  {
    id: '1', name: 'Auto-Gallery Post', description: 'Post every saved drawing to your public gallery',
    trigger: { type: 'drawing_saved', conditions: { min_strokes: 10 } },
    actions:  [{ type: 'post_to_gallery', config: { visibility: 'public' } }],
    is_active: true, run_count: 47, last_run_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: '2', name: 'Weekly Portfolio Builder', description: 'Automatically add your best work each week to your portfolio',
    trigger: { type: 'weekly_summary' },
    actions: [
      { type: 'generate_summary', config: { prompt: 'weekly highlights' } },
      { type: 'add_to_portfolio', config: { auto_select: true } },
    ],
    is_active: true, run_count: 6, last_run_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 42).toISOString(),
  },
  {
    id: '3', name: 'Challenge Win Celebration', description: 'When you win a challenge, auto-post and notify followers',
    trigger: { type: 'challenge_won' },
    actions: [
      { type: 'create_post', config: { template: 'challenge_win' } },
      { type: 'award_xp', config: { bonus: 100 } },
    ],
    is_active: false, run_count: 2, last_run_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
];

export async function getWorkflows(): Promise<AutomationWorkflow[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return MOCK_WORKFLOWS;
    const headers = await authHeaders();
    const res = await fetch(`${API}/api/automation/workflows`, { headers });
    if (!res.ok) return MOCK_WORKFLOWS;
    const d = await res.json() as { workflows: AutomationWorkflow[] };
    return d.workflows;
  } catch { return MOCK_WORKFLOWS; }
}

export async function createWorkflow(data: Omit<AutomationWorkflow, 'id' | 'run_count' | 'last_run_at' | 'created_at'>): Promise<AutomationWorkflow> {
  const headers = await authHeaders();
  const res = await fetch(`${API}/api/automation/workflows`, {
    method: 'POST', headers, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create workflow');
  return (await res.json() as { workflow: AutomationWorkflow }).workflow;
}

export async function toggleWorkflow(id: string, is_active: boolean): Promise<void> {
  const headers = await authHeaders();
  await fetch(`${API}/api/automation/workflows/${id}`, {
    method: 'PATCH', headers, body: JSON.stringify({ is_active }),
  });
}

export async function deleteWorkflow(id: string): Promise<void> {
  const headers = await authHeaders();
  await fetch(`${API}/api/automation/workflows/${id}`, { method: 'DELETE', headers });
}

export async function runWorkflow(id: string): Promise<AutomationRun> {
  const headers = await authHeaders();
  const res = await fetch(`${API}/api/automation/workflows/${id}/run`, { method: 'POST', headers });
  if (!res.ok) throw new Error('Run failed');
  return (await res.json() as { run: AutomationRun }).run;
}

export async function getWorkflowRuns(workflowId: string): Promise<AutomationRun[]> {
  try {
    const { data } = await supabase.from('automation_runs')
      .select('*').eq('workflow_id', workflowId)
      .order('started_at', { ascending: false }).limit(20);
    return (data ?? []) as AutomationRun[];
  } catch { return []; }
}
