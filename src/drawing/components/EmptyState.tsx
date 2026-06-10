import { motion } from 'framer-motion';

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none"
    >
      {/* Abstract illustration */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' as const }}
        className="mb-8"
      >
        <svg width="120" height="100" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
          {/* Pencil */}
          <rect x="50" y="10" width="12" height="55" rx="2" fill="#b8a9f0" opacity="0.6" />
          <polygon points="50,65 62,65 56,78" fill="#f9c784" opacity="0.8" />
          <rect x="50" y="10" width="12" height="10" rx="2" fill="#d4ccf7" opacity="0.8" />
          {/* Squiggle lines */}
          <path d="M 10 40 Q 22 28 34 40 Q 46 52 58 40" stroke="#f27059" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
          <path d="M 70 55 Q 82 43 94 55 Q 106 67 118 55" stroke="#7dd3b2" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
          {/* Dots */}
          <circle cx="15" cy="75" r="5" fill="#87c5e8" opacity="0.55" />
          <circle cx="100" cy="25" r="7" fill="#f27059" opacity="0.4" />
          <circle cx="30" cy="20" r="4" fill="#7dd3b2" opacity="0.5" />
        </svg>
      </motion.div>

      <p
        style={{ fontFamily: 'var(--font-display)' }}
        className="text-2xl font-semibold text-gray-300 mb-2"
      >
        Your next big idea starts here.
      </p>
      <p className="text-sm text-gray-300 font-medium">
        Pick a tool and start drawing
      </p>
    </motion.div>
  );
}
