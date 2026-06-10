import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';

interface Props {
  onCreateNew: () => void;
}

export default function EmptyDrawings({ onCreateNew }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const }}
        className="mb-6"
      >
        <div className="w-24 h-24 rounded-3xl bg-lavender-light flex items-center justify-center mx-auto">
          <Pencil size={40} className="text-lavender-dark" />
        </div>
      </motion.div>
      <h3 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-700 mb-2">
        Your canvas awaits
      </h3>
      <p className="text-gray-400 mb-8 max-w-xs">
        Create your first drawing and it will appear here, synced across all your devices.
      </p>
      <button
        onClick={onCreateNew}
        className="px-6 py-3 rounded-2xl bg-lavender text-white font-semibold hover:bg-lavender-dark transition-colors shadow-md"
      >
        Create First Drawing
      </button>
    </motion.div>
  );
}
