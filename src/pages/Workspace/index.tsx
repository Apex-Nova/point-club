import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Plus, Users, FolderOpen, Settings,
  ChevronRight, Loader2, Layers,
} from 'lucide-react';
import {
  getWorkspaces, createWorkspace, getProjects, getTasks,
  createProject, type Workspace, type Project, type Task,
} from '@/lib/services/workspaces.service';
import KanbanBoard from '@/components/workspace/KanbanBoard';
import Modal from '@/components/common/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useToasts } from '@/drawing/hooks/useToasts';
import ToastContainer from '@/drawing/components/ToastContainer';

const COVER_COLORS = ['#7c5cbf','#e63946','#2a9d8f','#f4a261','#457b9d','#1a1a2e'];

function WorkspaceCard({ ws, onClick }: { ws: Workspace; onClick: () => void }) {
  const memberCount = ws.members?.length ?? 0;
  return (
    <motion.div whileHover={{ y: -3 }} onClick={onClick}
      className="bg-white rounded-2xl border border-cream-dark p-5 cursor-pointer hover:shadow-lg transition-shadow">
      <div className="w-10 h-10 rounded-xl bg-lavender-light flex items-center justify-center mb-3">
        <Briefcase size={18} className="text-lavender-dark" />
      </div>
      <h3 className="text-sm font-bold text-gray-800 mb-0.5">{ws.name}</h3>
      {ws.description && <p className="text-[11px] text-gray-400 mb-3 line-clamp-2">{ws.description}</p>}
      <div className="flex items-center gap-3 text-[10px] text-gray-400">
        <span className="flex items-center gap-1"><Users size={9} /> {memberCount} members</span>
        <span className="capitalize bg-cream px-1.5 py-0.5 rounded-full font-semibold">{ws.plan}</span>
      </div>
    </motion.div>
  );
}

export default function WorkspacePage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { toasts, addToast, removeToast } = useToasts();

  const [workspaces,    setWorkspaces]    = useState<Workspace[]>([]);
  const [activeWS,      setActiveWS]      = useState<Workspace | null>(null);
  const [projects,      setProjects]      = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [tasks,         setTasks]         = useState<Task[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [wsModalOpen,   setWsModalOpen]   = useState(false);
  const [projModalOpen, setProjModalOpen] = useState(false);
  const [wsForm,        setWsForm]        = useState({ name: '', description: '' });
  const [projForm,      setProjForm]      = useState({ name: '', description: '', cover_color: '#7c5cbf' });
  const [creating,      setCreating]      = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getWorkspaces().then(ws => { setWorkspaces(ws); setLoading(false); });
  }, [user]);

  const selectWorkspace = async (ws: Workspace) => {
    setActiveWS(ws);
    setActiveProject(null);
    const p = await getProjects(ws.id);
    setProjects(p);
  };

  const selectProject = async (proj: Project) => {
    setActiveProject(proj);
    const t = await getTasks(proj.id);
    setTasks(t);
  };

  const handleCreateWS = async () => {
    if (!wsForm.name.trim()) return;
    setCreating(true);
    try {
      const ws = await createWorkspace(wsForm.name.trim(), wsForm.description.trim() || undefined);
      setWorkspaces(prev => [ws, ...prev]);
      setWsModalOpen(false);
      setWsForm({ name: '', description: '' });
      addToast('Workspace created!', 'success');
    } catch { addToast('Failed to create workspace', 'error'); }
    finally  { setCreating(false); }
  };

  const handleCreateProj = async () => {
    if (!activeWS || !projForm.name.trim()) return;
    setCreating(true);
    try {
      const proj = await createProject(activeWS.id, projForm);
      setProjects(prev => [proj, ...prev]);
      setProjModalOpen(false);
      setProjForm({ name: '', description: '', cover_color: '#7c5cbf' });
      addToast('Project created!', 'success');
    } catch { addToast('Failed to create project', 'error'); }
    finally  { setCreating(false); }
  };

  if (!user) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <Briefcase size={36} className="mx-auto mb-3 text-lavender-dark opacity-60" />
        <p className="text-gray-500 mb-3">Sign in to use workspaces</p>
        <Link to="/login" className="text-lavender-dark font-semibold hover:underline">Sign In →</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <div className="w-60 shrink-0 bg-white border-r border-cream-dark flex flex-col">
        <div className="px-4 py-4 border-b border-cream-dark">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-xs font-medium block mb-3">← Dashboard</Link>
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-gray-800 text-sm">Workspaces</span>
            <button onClick={() => setWsModalOpen(true)}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-lavender text-white hover:bg-lavender-dark transition-colors">
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Workspace list */}
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={18} className="text-lavender-dark animate-spin" />
            </div>
          ) : workspaces.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-gray-400">No workspaces yet</p>
              <button onClick={() => setWsModalOpen(true)} className="text-lavender-dark text-xs font-semibold hover:underline mt-1">
                Create one →
              </button>
            </div>
          ) : workspaces.map(ws => (
            <button key={ws.id} onClick={() => selectWorkspace(ws)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-cream transition-colors ${activeWS?.id === ws.id ? 'bg-lavender-light/50' : ''}`}>
              <div className="w-6 h-6 rounded-lg bg-lavender-light flex items-center justify-center shrink-0">
                <Briefcase size={11} className="text-lavender-dark" />
              </div>
              <span className="text-xs font-semibold text-gray-700 truncate">{ws.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeWS ? (
          <div className="flex-1 flex items-center justify-center p-8">
            {loading ? (
              <Loader2 size={24} className="text-lavender-dark animate-spin" />
            ) : workspaces.length === 0 ? (
              <div className="text-center max-w-sm">
                <Briefcase size={40} className="mx-auto mb-4 text-lavender-dark opacity-40" />
                <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-700 mb-2">Create your first workspace</h2>
                <p className="text-gray-400 text-sm mb-6">Organize projects, manage tasks with your team.</p>
                <motion.button whileHover={{ scale: 1.03 }} onClick={() => setWsModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-lavender text-white font-semibold text-sm hover:bg-lavender-dark transition-colors mx-auto">
                  <Plus size={16} /> Create Workspace
                </motion.button>
              </div>
            ) : (
              <div className="w-full max-w-2xl">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Select a Workspace</h2>
                <div className="grid grid-cols-2 gap-4">
                  {workspaces.map(ws => <WorkspaceCard key={ws.id} ws={ws} onClick={() => selectWorkspace(ws)} />)}
                </div>
              </div>
            )}
          </div>
        ) : !activeProject ? (
          <div className="flex-1 p-8 overflow-y-auto">
            {/* Workspace header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-800">{activeWS.name}</h1>
                {activeWS.description && <p className="text-sm text-gray-400 mt-0.5">{activeWS.description}</p>}
              </div>
              <div className="flex gap-2">
                <motion.button whileHover={{ scale: 1.03 }} onClick={() => setProjModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lavender text-white text-sm font-semibold hover:bg-lavender-dark transition-colors">
                  <Plus size={14} /> New Project
                </motion.button>
              </div>
            </div>

            {/* Projects grid */}
            {projects.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FolderOpen size={36} className="mx-auto mb-3 opacity-30" />
                <p>No projects yet</p>
                <button onClick={() => setProjModalOpen(true)} className="text-lavender-dark text-sm font-semibold hover:underline mt-2">
                  Create the first project →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((proj, i) => (
                  <motion.div key={proj.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -3 }} onClick={() => selectProject(proj)}
                    className="bg-white rounded-2xl border border-cream-dark p-5 cursor-pointer hover:shadow-lg transition-shadow">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${proj.cover_color}20` }}>
                      <Layers size={18} style={{ color: proj.cover_color }} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 mb-0.5">{proj.name}</h3>
                    {proj.description && <p className="text-[11px] text-gray-400 mb-3 line-clamp-2">{proj.description}</p>}
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span>{proj.tasks?.length ?? 0} tasks</span>
                      <span className="capitalize">{proj.status}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 p-6 flex flex-col min-h-0 overflow-hidden">
            {/* Project header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveProject(null)} className="text-gray-400 hover:text-gray-600 transition-colors">←</button>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${activeProject.cover_color}20` }}>
                  <Layers size={15} style={{ color: activeProject.cover_color }} />
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-lg font-bold text-gray-800">{activeProject.name}</h2>
              </div>
              <div className="flex gap-2">
                <button className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-cream transition-colors">
                  <Settings size={14} />
                </button>
              </div>
            </div>

            {/* Kanban */}
            <div className="flex-1 min-h-0 overflow-x-auto">
              <KanbanBoard projectId={activeProject.id} tasks={tasks} onTasksChange={setTasks} />
            </div>
          </div>
        )}
      </div>

      {/* Create workspace modal */}
      <Modal open={wsModalOpen} onClose={() => setWsModalOpen(false)} title="New Workspace">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Workspace Name</label>
            <input value={wsForm.name} onChange={e => setWsForm(f => ({ ...f, name: e.target.value }))}
              placeholder="My Creative Studio"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-cream-dark focus:border-lavender outline-none text-sm text-gray-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description (optional)</label>
            <input value={wsForm.description} onChange={e => setWsForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What is this workspace for?"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-cream-dark focus:border-lavender outline-none text-sm text-gray-700" />
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button onClick={() => setWsModalOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-cream rounded-xl">Cancel</button>
            <motion.button whileHover={{ scale: 1.02 }} onClick={handleCreateWS} disabled={creating || !wsForm.name.trim()}
              className="px-5 py-2 rounded-xl bg-lavender text-white text-sm font-semibold hover:bg-lavender-dark disabled:opacity-50 transition-colors">
              {creating ? 'Creating…' : 'Create'}
            </motion.button>
          </div>
        </div>
      </Modal>

      {/* Create project modal */}
      <Modal open={projModalOpen} onClose={() => setProjModalOpen(false)} title="New Project">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Project Name</label>
            <input value={projForm.name} onChange={e => setProjForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Website Redesign"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-cream-dark focus:border-lavender outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Cover Color</label>
            <div className="flex gap-2">
              {COVER_COLORS.map(c => (
                <button key={c} onClick={() => setProjForm(f => ({ ...f, cover_color: c }))}
                  className={`w-7 h-7 rounded-xl border-2 transition-transform hover:scale-110 ${projForm.cover_color === c ? 'border-gray-700 scale-110' : 'border-transparent'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setProjModalOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-cream rounded-xl">Cancel</button>
            <motion.button whileHover={{ scale: 1.02 }} onClick={handleCreateProj} disabled={creating || !projForm.name.trim()}
              className="px-5 py-2 rounded-xl bg-lavender text-white text-sm font-semibold hover:bg-lavender-dark disabled:opacity-50">
              {creating ? 'Creating…' : 'Create'}
            </motion.button>
          </div>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
