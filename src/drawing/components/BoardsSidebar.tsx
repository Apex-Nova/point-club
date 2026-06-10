import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import type { Board } from '../hooks/useBoards';

interface Props {
  boards: Board[];
  activeBoardId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export default function BoardsSidebar({ boards, activeBoardId, onSelect, onNew, onDelete, onRename }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [hoverId, setHoverId]     = useState<string | null>(null);

  const startEdit = (b: Board) => {
    setEditingId(b.id);
    setEditValue(b.name);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) onRename(editingId, editValue.trim());
    setEditingId(null);
  };

  return (
    <div
      className="flex flex-col h-full shrink-0 select-none"
      style={{ width: 200, background: '#242424', borderRight: '1px solid #333' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#888' }}>
          Saved Boards
        </span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNew}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-xs font-semibold"
          style={{ background: '#4361ee' }}
        >
          <Plus size={12} />
          New
        </motion.button>
      </div>

      {/* Board list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        <AnimatePresence initial={false}>
          {boards.length === 0 && (
            <div className="text-center py-8" style={{ color: '#555' }}>
              <Monitor size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">No boards yet</p>
              <p className="text-xs opacity-60">Click + New to start</p>
            </div>
          )}

          {boards.map(board => (
            <motion.div
              key={board.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onMouseEnter={() => setHoverId(board.id)}
              onMouseLeave={() => setHoverId(null)}
              onClick={() => onSelect(board.id)}
              className="flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer transition-colors group"
              style={{
                background: board.id === activeBoardId
                  ? 'rgba(67,97,238,0.2)'
                  : hoverId === board.id ? '#2e2e2e' : 'transparent',
              }}
            >
              {/* Thumbnail or icon */}
              <div
                className="shrink-0 rounded-lg flex items-center justify-center overflow-hidden"
                style={{ width: 32, height: 32, background: '#333' }}
              >
                {board.thumbnail ? (
                  <img src={board.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Monitor size={14} style={{ color: '#666' }} />
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                {editingId === board.id ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitEdit();
                      if (e.key === 'Escape') setEditingId(null);
                      e.stopPropagation();
                    }}
                    onBlur={commitEdit}
                    onClick={e => e.stopPropagation()}
                    className="w-full bg-transparent text-xs outline-none border-b border-blue-400 pb-0.5"
                    style={{ color: '#e0e0e0' }}
                  />
                ) : (
                  <p className="text-xs font-medium truncate" style={{ color: board.id === activeBoardId ? '#fff' : '#bbb' }}>
                    {board.name}
                  </p>
                )}
                <p className="text-[10px]" style={{ color: '#555' }}>
                  {new Date(board.updatedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions — show on hover */}
              {hoverId === board.id && editingId !== board.id && (
                <div className="flex gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => startEdit(board)}
                    className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                    title="Rename"
                  >
                    <Pencil size={11} style={{ color: '#888' }} />
                  </button>
                  <button
                    onClick={() => onDelete(board.id)}
                    className="p-1 rounded-lg hover:bg-red-500/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={11} style={{ color: '#e05' }} />
                  </button>
                </div>
              )}

              {editingId === board.id && (
                <div className="flex gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={commitEdit} className="p-1 rounded-lg hover:bg-white/10">
                    <Check size={11} style={{ color: '#4caf50' }} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1 rounded-lg hover:bg-white/10">
                    <X size={11} style={{ color: '#888' }} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer branding */}
      <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: '#333' }}>
        <p className="text-[10px] font-bold" style={{ color: '#444', fontFamily: 'var(--font-display)' }}>
          Point Club
        </p>
        <p className="text-[9px]" style={{ color: '#383838' }}>Drawing Studio</p>
      </div>
    </div>
  );
}
