import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Minus, ArrowRight, Square, Circle, Type, Trash2, Lock, Unlock } from 'lucide-react';
import type { Socket } from 'socket.io-client';

export type WBElementType = 'sticky' | 'shape' | 'arrow' | 'text' | 'mindmap_node';

export interface WBElement {
  id:         string;
  type:       WBElementType;
  data:       Record<string, unknown>;   // {text, color, etc.}
  position:   { x: number; y: number };
  size:       { w: number; h: number };
  style:      { bg?: string; border?: string; textColor?: string };
  z_index:    number;
  created_by?: string;
  locked_by?:  string | null;
}

const STICKY_COLORS = ['#fef08a','#bbf7d0','#bfdbfe','#fecdd3','#e9d5ff','#fed7aa','#ffffff'];
const SHAPE_TYPES   = [
  { id: 'sticky',      icon: StickyNote, label: 'Sticky Note' },
  { id: 'text',        icon: Type,       label: 'Text' },
  { id: 'shape',       icon: Square,     label: 'Rectangle' },
  { id: 'arrow',       icon: ArrowRight, label: 'Arrow' },
  { id: 'mindmap_node',icon: Circle,     label: 'Mind Map' },
];

interface Props {
  socket:   Socket | null;
  elements: WBElement[];
  myUserId: string | undefined;
  onElementsChange: (elements: WBElement[]) => void;
}

function StickyNoteEl({ el, onUpdate, onDelete, onLock }: {
  el: WBElement;
  onUpdate: (id: string, patch: Partial<WBElement>) => void;
  onDelete: (id: string) => void;
  onLock:   (id: string) => void;
}) {
  const [editing, setEditing]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, ex: 0, ey: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    if (editing) return;
    setDragging(true);
    onLock(el.id);
    dragStart.current = { mx: e.clientX, my: e.clientY, ex: el.position.x, ey: el.position.y };
    const move = (ev: MouseEvent) => {
      const dx = ev.clientX - dragStart.current.mx;
      const dy = ev.clientY - dragStart.current.my;
      onUpdate(el.id, { position: { x: dragStart.current.ex + dx, y: dragStart.current.ey + dy } });
    };
    const up = () => { setDragging(false); document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  const bg    = (el.style.bg ?? '#fef08a');
  const text  = (el.data.text as string) ?? '';

  return (
    <motion.div
      style={{ position: 'absolute', left: el.position.x, top: el.position.y, width: el.size.w, height: el.size.h, background: bg, zIndex: el.z_index + 10 }}
      className={`rounded-lg shadow-md border border-black/5 flex flex-col group ${dragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
      whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
      onMouseDown={onMouseDown}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `${bg}cc` }}>
        <div className="flex gap-1">
          {STICKY_COLORS.map(c => (
            <button key={c} onClick={() => onUpdate(el.id, { style: { ...el.style, bg: c } })}
              className="w-3 h-3 rounded-full border border-black/10 hover:scale-125 transition-transform" style={{ background: c }} />
          ))}
        </div>
        <div className="flex gap-1">
          <button onClick={() => onLock(el.id)} className="text-gray-400 hover:text-gray-600">
            {el.locked_by ? <Lock size={10} /> : <Unlock size={10} />}
          </button>
          <button onClick={() => onDelete(el.id)} className="text-gray-400 hover:text-coral-dark">
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-2" onDoubleClick={() => setEditing(true)}>
        {editing ? (
          <textarea
            autoFocus
            value={text}
            onChange={e => onUpdate(el.id, { data: { ...el.data, text: e.target.value } })}
            onBlur={() => setEditing(false)}
            className="w-full h-full resize-none outline-none text-xs text-gray-700 leading-relaxed"
            style={{ background: 'transparent', fontFamily: 'inherit' }}
          />
        ) : (
          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
            {text || <span className="text-gray-400 italic">Double-click to edit</span>}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function WhiteboardMode({ socket, elements, myUserId, onElementsChange }: Props) {
  const [tool,      setTool]      = useState<WBElementType>('sticky');
  const [stickyColor, setStickyColor] = useState('#fef08a');
  const boardRef = useRef<HTMLDivElement>(null);

  const addElement = useCallback((e: React.MouseEvent) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x    = e.clientX - rect.left - 100;
    const y    = e.clientY - rect.top  - 60;

    const el: WBElement = {
      id:       crypto.randomUUID(),
      type:     tool,
      data:     { text: '' },
      position: { x, y },
      size:     tool === 'text' ? { w: 200, h: 40 } : tool === 'arrow' ? { w: 100, h: 30 } : { w: 200, h: 150 },
      style:    { bg: tool === 'sticky' ? stickyColor : '#ffffff', border: '#e2e8f0' },
      z_index:  elements.length,
    };

    const next = [...elements, el];
    onElementsChange(next);
    socket?.emit('wb:add', el);
  }, [tool, stickyColor, elements, onElementsChange, socket]);

  const handleUpdate = useCallback((id: string, patch: Partial<WBElement>) => {
    onElementsChange(elements.map(el => el.id === id ? { ...el, ...patch } as WBElement : el));
    socket?.emit('wb:update', { id, ...patch });
  }, [elements, onElementsChange, socket]);

  const handleDelete = useCallback((id: string) => {
    onElementsChange(elements.filter(el => el.id !== id));
    socket?.emit('wb:delete', { id });
  }, [elements, onElementsChange, socket]);

  const handleLock = useCallback((id: string) => {
    socket?.emit('wb:lock', { id });
  }, [socket]);

  void myUserId;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {/* Tool bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-auto z-20 bg-white/90 backdrop-blur-sm rounded-2xl border border-cream-dark shadow-lg px-3 py-2 flex items-center gap-2">
        {SHAPE_TYPES.map(({ id, icon: Icon, label }) => (
          <button key={id} title={label} onClick={() => setTool(id as WBElementType)}
            className={`p-1.5 rounded-lg transition-colors ${tool === id ? 'bg-lavender text-white' : 'text-gray-500 hover:bg-cream'}`}>
            <Icon size={14} />
          </button>
        ))}
        {tool === 'sticky' && (
          <>
            <div className="w-px h-4 bg-cream-dark" />
            {STICKY_COLORS.map(c => (
              <button key={c} onClick={() => setStickyColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${stickyColor === c ? 'border-gray-600 scale-110' : 'border-transparent'}`}
                style={{ background: c }} />
            ))}
          </>
        )}
        <div className="w-px h-4 bg-cream-dark" />
        <span className="text-[10px] text-gray-400">Click canvas to place</span>
      </div>

      {/* Click-to-place layer */}
      <div
        ref={boardRef}
        className="absolute inset-0 pointer-events-auto"
        style={{ cursor: 'crosshair', zIndex: 4 }}
        onClick={addElement}
      >
        {/* Render elements */}
        <AnimatePresence>
          {elements.map(el => {
            if (el.type === 'sticky' || el.type === 'text' || el.type === 'mindmap_node') {
              return (
                <StickyNoteEl key={el.id} el={el} onUpdate={handleUpdate} onDelete={handleDelete} onLock={handleLock} />
              );
            }
            if (el.type === 'shape') {
              return (
                <div key={el.id} onClick={e => e.stopPropagation()}
                  style={{ position: 'absolute', left: el.position.x, top: el.position.y, width: el.size.w, height: el.size.h, zIndex: el.z_index + 10 }}
                  className="rounded-xl border-2 border-gray-300 bg-white/60 backdrop-blur-sm flex items-center justify-center group">
                  <button onClick={() => handleDelete(el.id)} className="hidden group-hover:flex w-5 h-5 items-center justify-center text-gray-300 hover:text-coral-dark">
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            }
            return null;
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
