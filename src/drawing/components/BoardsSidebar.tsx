import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, Check, X, ChevronRight, LayoutGrid } from 'lucide-react';
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
  const [expanded,  setExpanded]  = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [hoverId,   setHoverId]   = useState<string | null>(null);

  const startEdit = (b: Board, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(b.id);
    setEditValue(b.name);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) onRename(editingId, editValue.trim());
    setEditingId(null);
  };

  // ── Collapsed rail ──────────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <div
        className="flex flex-col h-full shrink-0 select-none items-center py-3 gap-2"
        style={{ width: 52, background: '#1e1e1e', borderRight: '1px solid #2e2e2e' }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(true)}
          title="Show boards"
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <LayoutGrid size={14} style={{ color: '#666' }} />
        </button>

        <div className="w-6 h-px" style={{ background: '#2e2e2e' }} />

        {/* Board thumbnails */}
        <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto w-full px-2" style={{ scrollbarWidth: 'none' }}>
          {boards.map(b => (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              title={b.name}
              className="shrink-0 rounded-lg overflow-hidden transition-all"
              style={{
                width: 36, height: 36,
                background: '#2a2a2a',
                border: b.id === activeBoardId ? '2px solid #4361ee' : '2px solid transparent',
                boxShadow: b.id === activeBoardId ? '0 0 0 1px #4361ee40' : undefined,
              }}
            >
              {b.thumbnail
                ? <img src={b.thumbnail} alt={b.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[9px] font-bold" style={{ color: '#555' }}>
                      {b.name[0]?.toUpperCase()}
                    </span>
                  </div>
              }
            </button>
          ))}
        </div>

        {/* New board */}
        <button
          onClick={onNew}
          title="New board"
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
        >
          <Plus size={14} style={{ color: '#555' }} />
        </button>
      </div>
    );
  }

  // ── Expanded panel ──────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ width: 52 }}
      animate={{ width: 200 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="flex flex-col h-full shrink-0 select-none overflow-hidden"
      style={{ background: '#1e1e1e', borderRight: '1px solid #2e2e2e' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-4 pb-3 shrink-0">
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#555' }}>
          Boards
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onNew}
            title="New board"
            className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Plus size={12} style={{ color: '#4361ee' }} />
          </button>
          <button
            onClick={() => setExpanded(false)}
            title="Collapse"
            className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={12} style={{ color: '#555' }} />
          </button>
        </div>
      </div>

      {/* Board list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence initial={false}>
          {boards.length === 0 && (
            <div className="text-center py-10 px-4">
              <p className="text-xs" style={{ color: '#444' }}>No boards yet</p>
              <p className="text-[10px] mt-1" style={{ color: '#333' }}>Click + to start</p>
            </div>
          )}

          {boards.map(board => (
            <motion.div
              key={board.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              onMouseEnter={() => setHoverId(board.id)}
              onMouseLeave={() => setHoverId(null)}
              onClick={() => { onSelect(board.id); setExpanded(false); }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl cursor-pointer transition-colors"
              style={{
                background: board.id === activeBoardId
                  ? 'rgba(67,97,238,0.15)'
                  : hoverId === board.id ? '#262626' : 'transparent',
              }}
            >
              {/* Thumbnail */}
              <div
                className="shrink-0 rounded-md overflow-hidden"
                style={{ width: 28, height: 28, background: '#2a2a2a',
                  border: board.id === activeBoardId ? '1.5px solid #4361ee50' : '1.5px solid transparent' }}
              >
                {board.thumbnail
                  ? <img src={board.thumbnail} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[9px] font-bold" style={{ color: '#555' }}>
                        {board.name[0]?.toUpperCase()}
                      </span>
                    </div>
                }
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
                    className="w-full bg-transparent text-[11px] outline-none border-b pb-0.5"
                    style={{ color: '#e0e0e0', borderColor: '#4361ee' }}
                  />
                ) : (
                  <p className="text-[11px] font-medium truncate"
                    style={{ color: board.id === activeBoardId ? '#e0e0e0' : '#888' }}>
                    {board.name}
                  </p>
                )}
              </div>

              {/* Hover actions */}
              {hoverId === board.id && editingId !== board.id && (
                <div className="flex gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={e => startEdit(board, e)}
                    className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors">
                    <Pencil size={9} style={{ color: '#666' }} />
                  </button>
                  <button onClick={() => onDelete(board.id)}
                    className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-red-500/20 transition-colors">
                    <Trash2 size={9} style={{ color: '#c00' }} />
                  </button>
                </div>
              )}

              {editingId === board.id && (
                <div className="flex gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={commitEdit}
                    className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-white/10">
                    <Check size={9} style={{ color: '#52b788' }} />
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-white/10">
                    <X size={9} style={{ color: '#666' }} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
