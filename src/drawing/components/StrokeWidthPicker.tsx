import { motion } from 'framer-motion';

const PRESETS = [1, 2, 4, 6, 10, 16, 24];

interface Props {
  width: number;
  color: string;
  onChange: (width: number) => void;
}

export default function StrokeWidthPicker({ width, color, onChange }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="bg-white rounded-2xl shadow-xl border border-cream-dark p-3 w-44"
    >
      <div className="flex flex-col gap-1.5 mb-3">
        {PRESETS.map((w) => (
          <button
            key={w}
            onClick={() => onChange(w)}
            className={`flex items-center gap-3 px-2 py-1.5 rounded-xl transition-colors ${
              w === width ? 'bg-lavender-light' : 'hover:bg-cream'
            }`}
          >
            <div className="w-16 flex items-center justify-center">
              <div
                className="rounded-full"
                style={{
                  width: Math.min(w * 3, 64),
                  height: w,
                  background: color,
                  opacity: 0.85,
                }}
              />
            </div>
            <span className="text-xs text-gray-500 font-medium w-6">{w}px</span>
          </button>
        ))}
      </div>

      {/* Custom slider */}
      <div className="px-1">
        <input
          type="range"
          min={1}
          max={40}
          value={width}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-lavender-dark"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>1px</span>
          <span className="font-medium text-gray-600">{width}px</span>
          <span>40px</span>
        </div>
      </div>
    </motion.div>
  );
}
