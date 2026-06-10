import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { ToolSettings } from '../types';

const PRESET_COLORS = ['#1a1a1a', '#e63946', '#4895ef', '#52b788', '#f9c74f', '#9b5de5', '#ff6b6b', '#ffffff'];
const PRESET_WIDTHS = [
  { value: 2,  dot: 6  },
  { value: 5,  dot: 10 },
  { value: 12, dot: 16 },
  { value: 24, dot: 22 },
];

interface Props {
  settings: ToolSettings;
  onSettingsChange: (p: Partial<ToolSettings>) => void;
}

export default function FloatingPalette({ settings, onSettingsChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: 16, y: 16 });
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input')) return;
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    e.preventDefault();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPos({
      x: dragStart.current.px + e.clientX - dragStart.current.mx,
      y: dragStart.current.py + e.clientY - dragStart.current.my,
    });
  };

  const onMouseUp = () => setDragging(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="absolute z-30 select-none"
      style={{ left: pos.x, top: pos.y, cursor: dragging ? 'grabbing' : 'grab' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255,255,255,0.8)',
        }}
      >
        {/* Color presets */}
        <div className="flex items-center gap-1.5">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => onSettingsChange({ color: c })}
              title={c}
              className="rounded-full transition-transform hover:scale-110 shrink-0"
              style={{
                width: 22, height: 22,
                background: c,
                border: c === settings.color
                  ? '2.5px solid #4361ee'
                  : c === '#ffffff' ? '1.5px solid #ddd' : '2px solid transparent',
                boxShadow: c === settings.color ? '0 0 0 2px rgba(67,97,238,0.25)' : undefined,
              }}
            />
          ))}

          {/* Custom color picker */}
          <button
            onClick={() => inputRef.current?.click()}
            className="rounded-full shrink-0 flex items-center justify-center hover:scale-110 transition-transform relative overflow-hidden"
            style={{ width: 22, height: 22, border: '1.5px solid #ddd' }}
            title="Custom color"
          >
            <div className="w-full h-full" style={{
              background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
            }} />
            <input
              ref={inputRef}
              type="color"
              value={settings.color}
              onChange={e => onSettingsChange({ color: e.target.value })}
              className="sr-only"
            />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 rounded-full" style={{ background: '#e0e0e0' }} />

        {/* Stroke widths */}
        <div className="flex items-center gap-2">
          {PRESET_WIDTHS.map(({ value, dot }) => (
            <button
              key={value}
              onClick={() => onSettingsChange({ width: value })}
              title={`${value}px`}
              className="flex items-center justify-center transition-transform hover:scale-110 shrink-0"
              style={{ width: 28, height: 28 }}
            >
              <div
                className="rounded-full transition-all"
                style={{
                  width: dot, height: dot,
                  background: settings.width === value ? settings.color : '#888',
                  boxShadow: settings.width === value ? `0 0 0 2.5px ${settings.color}44` : undefined,
                }}
              />
            </button>
          ))}
        </div>

        {/* Current color swatch */}
        <div
          className="w-6 h-6 rounded-lg border border-gray-200 shrink-0"
          style={{ background: settings.color }}
          title={settings.color}
        />
      </div>
    </motion.div>
  );
}
