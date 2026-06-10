import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Pencil, Copy, Trash2, ExternalLink } from 'lucide-react';
import type { Drawing } from '@/lib/database.types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)    return `${diffD}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Deterministic gradient placeholder based on drawing id
function gradientFor(id: string) {
  const palettes = [
    ['#d4ccf7', '#b8a9f0'],
    ['#fde8d0', '#f9c784'],
    ['#d0f0e4', '#7dd3b2'],
    ['#cce6f4', '#87c5e8'],
    ['#fde0db', '#f27059'],
  ];
  const idx = id.charCodeAt(0) % palettes.length;
  return `linear-gradient(135deg, ${palettes[idx][0]}, ${palettes[idx][1]})`;
}

interface Props {
  drawing: Drawing;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export default function DrawingCard({ drawing, onRename, onDelete, onDuplicate }: Props) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [editing, setEditing]     = useState(false);
  const [titleVal, setTitleVal]   = useState(drawing.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commitRename = () => {
    const trimmed = titleVal.trim();
    if (trimmed && trimmed !== drawing.title) onRename(drawing.id, trimmed);
    else setTitleVal(drawing.title);
    setEditing(false);
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group bg-white rounded-2xl border border-cream-dark overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Thumbnail */}
      <div
        className="aspect-[4/3] relative overflow-hidden"
        onClick={() => navigate(`/draw/${drawing.id}`)}
      >
        {drawing.thumbnail ? (
          <img
            src={drawing.thumbnail}
            alt={drawing.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: gradientFor(drawing.id) }}
          >
            <span className="text-4xl opacity-40">✏️</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 flex items-center gap-1.5 shadow-md">
            <ExternalLink size={12} />
            Open
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="px-3 py-3 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={titleVal}
              onChange={e => setTitleVal(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setTitleVal(drawing.title); setEditing(false); } }}
              className="w-full text-sm font-semibold text-gray-800 bg-cream rounded-lg px-2 py-0.5 outline-none border border-lavender"
            />
          ) : (
            <p
              className="text-sm font-semibold text-gray-800 truncate"
              onDoubleClick={() => setEditing(true)}
              title={drawing.title}
            >
              {drawing.title}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(drawing.updated_at)}</p>
        </div>

        {/* Three-dot menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-cream hover:text-gray-700 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal size={15} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 bottom-full mb-1 w-40 bg-white rounded-2xl shadow-xl border border-cream-dark py-1 z-10"
              >
                {[
                  { icon: ExternalLink, label: 'Open',      action: () => navigate(`/draw/${drawing.id}`) },
                  { icon: Pencil,       label: 'Rename',    action: () => setEditing(true) },
                  { icon: Copy,         label: 'Duplicate', action: () => onDuplicate(drawing.id) },
                  { icon: Trash2,       label: 'Delete',    action: () => onDelete(drawing.id), danger: true },
                ].map(({ icon: Icon, label, action, danger }) => (
                  <button
                    key={label}
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); action(); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-cream transition-colors ${danger ? 'text-coral-dark' : 'text-gray-700'}`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
