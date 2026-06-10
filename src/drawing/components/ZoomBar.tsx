import { motion } from 'framer-motion';
import { Minus, Plus, Star } from 'lucide-react';

interface Props {
  zoom: number;
  onZoomChange: (z: number) => void;
}

const STEPS = [25, 50, 75, 100, 125, 150, 200, 300];

export default function ZoomBar({ zoom, onZoomChange }: Props) {
  const step = (dir: 1 | -1) => {
    const idx  = STEPS.findIndex(s => s >= zoom);
    const next = dir === 1
      ? STEPS[Math.min(idx + 1, STEPS.length - 1)]
      : STEPS[Math.max(idx - 2, 0)];
    onZoomChange(next ?? zoom);
  };

  return (
    <div className="shrink-0 flex items-center justify-between px-4 py-2"
      style={{ background: '#fff', borderTop: '1px solid #ebebeb', height: 44 }}>

      <div className="flex items-center gap-1">
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          onClick={() => step(-1)}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="Zoom out"
        >
          <Minus size={13} className="text-gray-500" />
        </motion.button>

        <button
          onClick={() => onZoomChange(100)}
          className="min-w-[52px] px-2 py-1 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors tabular-nums"
          title="Reset zoom"
        >
          {zoom}%
        </button>

        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          onClick={() => step(1)}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="Zoom in"
        >
          <Plus size={13} className="text-gray-500" />
        </motion.button>
      </div>

      {/* Fit-to-screen hint */}
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => onZoomChange(100)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
        title="Fit to screen (100%)"
      >
        <Star size={12} className="text-gray-400" />
        <span className="text-xs text-gray-400">Fit</span>
      </motion.button>
    </div>
  );
}
