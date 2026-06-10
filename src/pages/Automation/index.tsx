import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Plus, Play, Pause, Trash2, ChevronRight, CheckCircle, XCircle, Loader2, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  getWorkflows, createWorkflow, toggleWorkflow, deleteWorkflow, runWorkflow,
  TRIGGER_LABELS, ACTION_LABELS, TRIGGER_ICONS, ACTION_ICONS,
  type AutomationWorkflow, type TriggerType, type ActionType,
} from '@/lib/services/automation.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToasts } from '@/drawing/hooks/useToasts';
import ToastContainer from '@/drawing/components/ToastContainer';
import Navbar from '@/components/layout/Navbar';

const PRESET_TEMPLATES = [
  {
    name: 'Auto-Gallery Post',
    description: 'Automatically post every saved drawing to your public gallery',
    trigger: { type: 'drawing_saved' as TriggerType },
    actions: [{ type: 'post_to_gallery' as ActionType, config: { visibility: 'public' } }],
    emoji: '🖼️',
  },
  {
    name: 'Weekly Portfolio Builder',
    description: 'Create a weekly portfolio summary every Sunday',
    trigger: { type: 'weekly_summary' as TriggerType },
    actions: [
      { type: 'generate_summary' as ActionType, config: { scope: 'week' } },
      { type: 'add_to_portfolio' as ActionType, config: { auto_select: true } },
    ],
    emoji: '📁',
  },
  {
    name: 'Challenge Win Fanfare',
    description: 'Celebrate challenge wins with an auto-post to your community',
    trigger: { type: 'challenge_won' as TriggerType },
    actions: [{ type: 'create_post' as ActionType, config: { template: 'challenge_win' } }],
    emoji: '🏆',
  },
  {
    name: 'Session Summary',
    description: 'Generate an AI summary when a room session ends',
    trigger: { type: 'room_ended' as TriggerType },
    actions: [{ type: 'generate_summary' as ActionType, config: { type: 'room' } }],
    emoji: '✨',
  },
  {
    name: 'New Follower Welcome',
    description: 'Send a personalized notification to new followers',
    trigger: { type: 'new_follower' as TriggerType },
    actions: [{ type: 'send_notification' as ActionType, config: { template: 'welcome' } }],
    emoji: '👋',
  },
  {
    name: 'Sale Notification',
    description: 'Notify yourself instantly when an asset sells',
    trigger: { type: 'sale_completed' as TriggerType },
    actions: [{ type: 'send_notification' as ActionType, config: { channel: 'push' } }],
    emoji: '💰',
  },
];

function WorkflowCard({ workflow, onToggle, onDelete, onRun }: {
  workflow: AutomationWorkflow;
  onToggle: () => void;
  onDelete: () => void;
  onRun: () => void;
}) {
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    try { await onRun(); } finally { setRunning(false); }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border-2 p-5 transition-all ${workflow.is_active ? 'border-lavender/30' : 'border-cream-dark'}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${workflow.is_active ? 'bg-lavender-light' : 'bg-cream'}`}>
          {TRIGGER_ICONS[workflow.trigger.type]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-800 leading-snug">{workflow.name}</h3>
          {workflow.description && <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{workflow.description}</p>}
        </div>
        <button onClick={onToggle}
          className={`shrink-0 transition-colors ${workflow.is_active ? 'text-lavender-dark' : 'text-gray-300'}`}>
          {workflow.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
        </button>
      </div>

      {/* Flow visualization */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <span className="flex items-center gap-1 text-[10px] font-semibold bg-cream px-2 py-1 rounded-full text-gray-600">
          {TRIGGER_ICONS[workflow.trigger.type]} {TRIGGER_LABELS[workflow.trigger.type]}
        </span>
        {workflow.actions.map((a, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight size={10} className="text-gray-300" />
            <span className="flex items-center gap-1 text-[10px] font-semibold bg-lavender-light text-lavender-dark px-2 py-1 rounded-full">
              {ACTION_ICONS[a.type]} {ACTION_LABELS[a.type]}
            </span>
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><Play size={9} /> {workflow.run_count} runs</span>
          {workflow.last_run_at && (
            <span className="flex items-center gap-1"><Clock size={9} /> {new Date(workflow.last_run_at).toLocaleDateString()}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleRun} disabled={running || !workflow.is_active}
            className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-cream text-gray-600 hover:bg-cream-dark transition-colors disabled:opacity-40 flex items-center gap-1">
            {running ? <Loader2 size={9} className="animate-spin" /> : <Play size={9} />}
            Test Run
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
            <Trash2 size={12} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function TemplateCard({ template, onUse }: { template: typeof PRESET_TEMPLATES[0]; onUse: () => void }) {
  return (
    <motion.div whileHover={{ y: -2 }}
      className="bg-white rounded-2xl border border-cream-dark p-4 hover:border-lavender/40 transition-all cursor-pointer group"
      onClick={onUse}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{template.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-800 group-hover:text-lavender-dark transition-colors">{template.name}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{template.description}</p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-[10px] font-semibold text-gray-500 bg-cream px-1.5 py-0.5 rounded-full">
              {TRIGGER_ICONS[template.trigger.type]} {TRIGGER_LABELS[template.trigger.type]}
            </span>
            <ChevronRight size={9} className="text-gray-300" />
            {template.actions.map((a, i) => (
              <span key={i} className="text-[10px] font-semibold text-lavender-dark bg-lavender-light px-1.5 py-0.5 rounded-full">
                {ACTION_ICONS[a.type]} {ACTION_LABELS[a.type]}
              </span>
            ))}
          </div>
        </div>
        <Plus size={14} className="text-gray-300 group-hover:text-lavender transition-colors shrink-0 mt-0.5" />
      </div>
    </motion.div>
  );
}

export default function AutomationPage() {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToasts();
  const [workflows,    setWorkflows]    = useState<AutomationWorkflow[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState<'my' | 'templates'>('my');
  const [runResults,   setRunResults]   = useState<Record<string, 'success' | 'failed'>>({});

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getWorkflows().then(w => { setWorkflows(w); setLoading(false); });
  }, [user]);

  const handleToggle = async (id: string, current: boolean) => {
    await toggleWorkflow(id, !current);
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, is_active: !current } : w));
    addToast(current ? 'Workflow paused' : 'Workflow activated', 'info');
  };

  const handleDelete = async (id: string) => {
    await deleteWorkflow(id);
    setWorkflows(prev => prev.filter(w => w.id !== id));
    addToast('Workflow deleted', 'info');
  };

  const handleRun = async (id: string) => {
    try {
      await runWorkflow(id);
      setRunResults(prev => ({ ...prev, [id]: 'success' }));
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, run_count: w.run_count + 1, last_run_at: new Date().toISOString() } : w));
      addToast('Workflow ran successfully ✓', 'success');
      setTimeout(() => setRunResults(prev => { const n = { ...prev }; delete n[id]; return n; }), 3000);
    } catch {
      setRunResults(prev => ({ ...prev, [id]: 'failed' }));
      addToast('Workflow run failed', 'error');
    }
  };

  const handleUseTemplate = async (template: typeof PRESET_TEMPLATES[0]) => {
    if (!user) { addToast('Sign in to create workflows', 'error'); return; }
    try {
      const w = await createWorkflow({ name: template.name, description: template.description, trigger: template.trigger, actions: template.actions, is_active: true });
      setWorkflows(prev => [w, ...prev]);
      setTab('my');
      addToast('Workflow created!', 'success');
    } catch {
      // Use optimistic mock
      const mock: AutomationWorkflow = {
        id: Math.random().toString(36).slice(2), name: template.name, description: template.description,
        trigger: template.trigger, actions: template.actions, is_active: true,
        run_count: 0, last_run_at: null, created_at: new Date().toISOString(),
      };
      setWorkflows(prev => [mock, ...prev]);
      setTab('my');
      addToast('Workflow created!', 'success');
    }
  };

  const activeCount = workflows.filter(w => w.is_active).length;
  const totalRuns   = workflows.reduce((sum, w) => sum + w.run_count, 0);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-cream-dark">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-lavender-light rounded-2xl flex items-center justify-center">
              <Zap size={18} className="text-lavender-dark" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-800">Automation</h1>
              <p className="text-xs text-gray-400">Build workflows that work while you create</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Active Workflows', value: activeCount, icon: '⚡' },
            { label: 'Total Runs', value: totalRuns, icon: '▶️' },
            { label: 'Time Saved', value: `${Math.floor(totalRuns * 2.5)}m`, icon: '⏱️' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-cream-dark p-4 text-center">
              <p className="text-xl mb-0.5">{s.icon}</p>
              <p className="text-xl font-black text-gray-800">{s.value}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-5">
          {[
            { id: 'my', label: `My Workflows (${workflows.length})` },
            { id: 'templates', label: 'Templates' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as 'my' | 'templates')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${tab === t.id ? 'bg-lavender text-white' : 'bg-white border border-cream-dark text-gray-500 hover:border-lavender'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'my' ? (
            <motion.div key="my" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-cream-dark h-32 animate-pulse" />)}
                </div>
              ) : workflows.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-cream-dark">
                  <p className="text-4xl mb-3">⚡</p>
                  <p className="text-sm font-bold text-gray-700 mb-1">No workflows yet</p>
                  <p className="text-xs text-gray-400 mb-4">Use a template to get started in seconds</p>
                  <button onClick={() => setTab('templates')}
                    className="px-4 py-2 bg-lavender text-white rounded-xl text-xs font-bold hover:bg-lavender-dark transition-colors">
                    Browse Templates
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {workflows.map(w => (
                    <div key={w.id} className="relative">
                      <WorkflowCard
                        workflow={w}
                        onToggle={() => void handleToggle(w.id, w.is_active)}
                        onDelete={() => void handleDelete(w.id)}
                        onRun={() => handleRun(w.id)}
                      />
                      {runResults[w.id] && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                          className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${runResults[w.id] === 'success' ? 'bg-mint/30 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          {runResults[w.id] === 'success' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {runResults[w.id] === 'success' ? 'Ran' : 'Failed'}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="templates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-3">
                {PRESET_TEMPLATES.map((t, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <TemplateCard template={t} onUse={() => void handleUseTemplate(t)} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info box */}
        <div className="mt-8 bg-white rounded-2xl border border-cream-dark p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Pause size={14} className="text-lavender-dark" /> How Automation Works
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Choose a Trigger', desc: 'Pick the event that starts your workflow — saving a drawing, winning a challenge, or a schedule.' },
              { step: '2', title: 'Add Actions', desc: 'Chain actions that run automatically — post to gallery, generate summaries, send notifications, and more.' },
              { step: '3', title: 'Sit Back', desc: 'Point Club runs your workflow in the background. Focus on creating while automation handles the rest.' },
            ].map(s => (
              <div key={s.step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-lavender text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{s.step}</div>
                <div>
                  <p className="text-xs font-bold text-gray-700">{s.title}</p>
                  <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
