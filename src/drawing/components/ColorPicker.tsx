import { useRef } from 'react';
import { motion } from 'framer-motion';

const PRESETS = [
  '#1a1a1a', '#4a4a4a', '#888888', '#cccccc', '#ffffff',
  '#e63946', '#f4845f', '#f9c74f', '#52b788', '#3d9970',
  '#4895ef', '#4361ee', '#b8a9f0', '#f27059', '#7dd3b2',
  '#87c5e8', '#f9c784', '#c77dff', '#ff6b6b', '#ffd166',
];

interface Props {
  color: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ color, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="bg-white rounded-2xl shadow-xl border border-cream-dark p-3 w-48"
    >
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {PRESETS.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className="w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110"
            style={{
              background: c,
              borderColor: c === color ? '#b8a9f0' : 'transparent',
              outline: c === color ? '2px solid #b8a9f0' : 'none',
              outlineOffset: '1px',
            }}
          />
        ))}
      </div>

      {/* Custom color input */}
      <div
        className="flex items-center gap-2 p-2 rounded-xl bg-cream border border-cream-dark cursor-pointer hover:border-lavender transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <div
          className="w-5 h-5 rounded-md border border-cream-dark shrink-0"
          style={{ background: color }}
        />
        <span className="text-xs text-gray-500 font-mono flex-1">{color}</span>
        <input
          ref={inputRef}
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
        <span className="text-xs text-gray-400">Custom</span>
      </div>
    </motion.div>
  );
}
