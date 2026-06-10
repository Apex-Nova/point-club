import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Star, FilePlus, X, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Board } from '../hooks/useBoards';

interface Props {
  zoom: number;
  onZoomChange: (z: number) => void;
  boards: Board[];
  activeBoardId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

const ZOOM_STEPS = [25, 50, 75, 100, 125, 150, 200, 300];

export default function BottomBar({
  zoom, onZoomChange,
  boards, activeBoardId, onSelect, onNew, onDelete,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const stepZoom = (dir: 1 | -1) => {
    const idx  = ZOOM_STEPS.findIndex(s => s >= zoom);
    const next = dir === 1
      ? ZOOM_STEPS[Math.min(idx + 1, ZOOM_STEPS.length - 1)]
      : ZOOM_STEPS[Math.max(idx - 2, 0)];
    onZoomChange(next ?? zoom);
  };

  const scrollTabs = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 160, behavior: 'smooth' });
  };

  return (
    <div
      className="shrink-0 flex items-center"
      style={{
        height: 40,
        background: '#fff',
        borderTop: '1px solid #e8e8e8',
      }}
    >
      {/* ── Zoom controls ── */}
      <div className="flex items-center gap-0.5 px-2 shrink-0" style={{ borderRight: '1px solid #ebebeb' }}>
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          onClick={() => stepZoom(-1)}
          className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="Zoom out"
        >
          <Minus size={11} className="text-gray-500" />
        </motion.button>

        <button
          onClick={() => onZoomChange(100)}
          className="min-w-[44px] px-1.5 py-0.5 rounded-md text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors tabular-nums"
          title="Reset to 100%"
        >
          {zoom}%
        </button>

        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          onClick={() => stepZoom(1)}
          className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="Zoom in"
        >
          <Plus size={11} className="text-gray-500" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => onZoomChange(100)}
          className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors ml-0.5"
          title="Fit to screen"
        >
          <Star size={10} className="text-gray-400" />
        </motion.button>
      </div>

      {/* ── Scroll left ── */}
      <button
        onClick={() => scrollTabs(-1)}
        className="w-6 h-full flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
        style={{ borderRight: '1px solid #f0f0f0' }}
      >
        <ChevronLeft size={12} className="text-gray-400" />
      </button>

      {/* ── File tabs ── */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-center gap-0.5 overflow-x-auto px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`.file-tabs::-webkit-scrollbar { display: none; }`}</style>

        <AnimatePresence initial={false}>
          {boards.map(board => {
            const active = board.id === activeBoardId;
            return (
              <motion.div
                key={board.id}
                layout
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                onMouseEnter={() => setHoverId(board.id)}
                onMouseLeave={() => setHoverId(null)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer shrink-0 transition-all select-none group"
                style={{
                  background: active ? '#4361ee12' : hoverId === board.id ? '#f5f5f5' : 'transparent',
                  border: active ? '1px solid #4361ee30' : '1px solid transparent',
                  maxWidth: 160,
                }}
                onClick={() => onSelect(board.id)}
              >
                <FileText
                  size={11}
                  style={{ color: active ? '#4361ee' : '#aaa', flexShrink: 0 }}
                />
                <span
                  className="text-xs truncate"
                  style={{
                    color: active ? '#4361ee' : '#666',
                    fontWeight: active ? 700 : 500,
                    maxWidth: 100,
                  }}
                >
                  {board.name}
                </span>

                {/* Close / delete button — show on hover */}
                {(hoverId === board.id || active) && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={e => { e.stopPropagation(); onDelete(board.id); }}
                    className="w-3.5 h-3.5 rounded flex items-center justify-center hover:bg-red-100 transition-colors shrink-0"
                    title="Close board"
                  >
                    <X size={8} style={{ color: '#bbb' }} />
                  </motion.button>
                )}
              </motion.div>
            );
          })}

          {boards.length === 0 && (
            <span className="text-xs text-gray-300 px-2 italic">No boards — click + to start</span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Scroll right ── */}
      <button
        onClick={() => scrollTabs(1)}
        className="w-6 h-full flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
        style={{ borderLeft: '1px solid #f0f0f0' }}
      >
        <ChevronRight size={12} className="text-gray-400" />
      </button>

      {/* ── New file button ── */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNew}
        className="flex items-center gap-1 px-3 h-full text-xs font-bold transition-colors shrink-0"
        style={{
          borderLeft: '1px solid #ebebeb',
          color: '#4361ee',
          background: 'transparent',
        }}
        title="New board"
      >
        <FilePlus size={13} />
        New file
      </motion.button>
    </div>
  );
}
