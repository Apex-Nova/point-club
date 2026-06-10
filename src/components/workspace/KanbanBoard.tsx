import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MoreHorizontal, AlertCircle, Clock, CheckCircle2, Eye } from 'lucide-react';
import { updateTask, createTask, deleteTask, type Task, type TaskStatus } from '@/lib/services/workspaces.service';
import { useToasts } from '@/drawing/hooks/useToasts';

const COLUMNS: { id: TaskStatus; label: string; color: string; icon: React.ElementType }[] = [
  { id: 'todo',        label: 'To Do',       color: 'bg-gray-100',       icon: Clock },
  { id: 'in_progress', label: 'In Progress', color: 'bg-sky/10',          icon: MoreHorizontal },
  { id: 'review',      label: 'Review',      color: 'bg-peach/20',        icon: Eye },
  { id: 'done',        label: 'Done',        color: 'bg-mint/20',         icon: CheckCircle2 },
];

const PRIORITY_COLOR: Record<string, string> = {
  low:    'bg-gray-100 text-gray-500',
  medium: 'bg-sky/20 text-sky-600',
  high:   'bg-peach/30 text-orange-500',
  urgent: 'bg-coral/20 text-coral-dark',
};

interface Props {
  projectId: string;
  tasks:     Task[];
  onTasksChange: (tasks: Task[]) => void;
}

function TaskCard({ task, onMove, onDelete }: {
  task: Task;
  onMove: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl border border-cream-dark p-3 shadow-sm hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-semibold text-gray-700 leading-snug flex-1">{task.title}</p>
        <div className="relative">
          <button onClick={() => setShowMenu(v => !v)}
            className="w-5 h-5 flex items-center justify-center rounded-md text-gray-300 hover:text-gray-500 hover:bg-cream opacity-0 group-hover:opacity-100 transition-all">
            <MoreHorizontal size={12} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="absolute right-0 top-6 w-36 bg-white rounded-xl border border-cream-dark shadow-xl py-1 z-20">
                {COLUMNS.filter(c => c.id !== task.status).map(c => (
                  <button key={c.id} onClick={() => { onMove(task.id, c.id); setShowMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:bg-cream transition-colors">
                    Move to {c.label}
                  </button>
                ))}
                <hr className="my-1 border-cream-dark" />
                <button onClick={() => onDelete(task.id)}
                  className="w-full text-left px-3 py-1.5 text-xs text-coral-dark hover:bg-coral/10 transition-colors flex items-center gap-1.5">
                  <Trash2 size={10} /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {task.description && (
        <p className="text-[10px] text-gray-400 leading-snug mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${PRIORITY_COLOR[task.priority]}`}>
          {task.priority}
        </span>
        {task.due_date && (
          <span className="flex items-center gap-0.5 text-[9px] text-gray-400">
            <Clock size={8} /> {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
        {task.tags?.slice(0, 2).map(tag => (
          <span key={tag} className="text-[9px] bg-lavender-light text-lavender-dark px-1.5 py-0.5 rounded-full">{tag}</span>
        ))}
      </div>

      {task.assignee && (
        <div className="mt-2 flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-lavender-light flex items-center justify-center text-[8px] font-bold text-lavender-dark">
            {(task.assignee.username ?? '?')[0].toUpperCase()}
          </div>
          <span className="text-[9px] text-gray-400">{task.assignee.username}</span>
        </div>
      )}
    </motion.div>
  );
}

export default function KanbanBoard({ projectId, tasks, onTasksChange }: Props) {
  const { addToast } = useToasts();
  const [adding, setAdding] = useState<TaskStatus | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const handleMove = useCallback(async (id: string, status: TaskStatus) => {
    onTasksChange(tasks.map(t => t.id === id ? { ...t, status } : t));
    try { await updateTask(id, { status }); }
    catch { addToast('Failed to update task', 'error'); }
  }, [tasks, onTasksChange, addToast]);

  const handleDelete = useCallback(async (id: string) => {
    onTasksChange(tasks.filter(t => t.id !== id));
    try { await deleteTask(id); }
    catch { addToast('Failed to delete task', 'error'); }
  }, [tasks, onTasksChange, addToast]);

  const handleAdd = async (status: TaskStatus) => {
    if (!newTitle.trim()) return;
    try {
      const task = await createTask(projectId, { title: newTitle.trim(), status });
      onTasksChange([...tasks, task]);
      setNewTitle('');
      setAdding(null);
    } catch {
      addToast('Failed to create task', 'error');
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-0">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        const Icon     = col.icon;
        return (
          <div key={col.id} className="flex flex-col shrink-0 w-64">
            {/* Column header */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${col.color} mb-2`}>
              <div className="flex items-center gap-2">
                <Icon size={12} className="text-gray-500" />
                <span className="text-xs font-bold text-gray-600">{col.label}</span>
                <span className="w-4 h-4 rounded-full bg-white/60 flex items-center justify-center text-[9px] font-bold text-gray-500">
                  {colTasks.length}
                </span>
              </div>
              <button onClick={() => { setAdding(col.id); setNewTitle(''); }}
                className="w-5 h-5 flex items-center justify-center rounded-md text-gray-400 hover:bg-white/50 hover:text-gray-600 transition-colors">
                <Plus size={12} />
              </button>
            </div>

            {/* Add task input */}
            <AnimatePresence>
              {adding === col.id && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-2">
                  <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') void handleAdd(col.id); if (e.key === 'Escape') setAdding(null); }}
                    placeholder="Task title…"
                    className="w-full px-3 py-2 rounded-xl border-2 border-lavender outline-none text-xs text-gray-700 bg-white" />
                  <div className="flex gap-1.5 mt-1.5">
                    <button onClick={() => void handleAdd(col.id)}
                      className="flex-1 py-1 rounded-lg bg-lavender text-white text-[10px] font-semibold hover:bg-lavender-dark transition-colors">
                      Add
                    </button>
                    <button onClick={() => setAdding(null)}
                      className="flex-1 py-1 rounded-lg bg-cream text-gray-500 text-[10px] font-semibold hover:bg-cream-dark transition-colors">
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tasks */}
            <div className="flex flex-col gap-2 flex-1">
              <AnimatePresence mode="popLayout">
                {colTasks.map(task => (
                  <TaskCard key={task.id} task={task} onMove={handleMove} onDelete={handleDelete} />
                ))}
              </AnimatePresence>
              {colTasks.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-cream-dark p-4 text-center">
                  <p className="text-[10px] text-gray-300">Drop tasks here</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
