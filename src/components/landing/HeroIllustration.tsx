import { motion, type Variants } from 'framer-motion';

const float: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
  },
};

const floatSlow: Variants = {
  animate: {
    y: [0, -14, 0],
    rotate: [0, 3, 0],
    transition: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' as const },
  },
};

export default function HeroIllustration() {
  return (
    <div className="relative w-full h-[480px] md:h-[520px] flex items-center justify-center select-none">
      {/* Main canvas card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative w-72 h-80 bg-white rounded-3xl shadow-2xl border border-cream-dark overflow-hidden"
      >
        {/* Canvas grid dots */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#b8a9f0" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Brush stroke paths */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 288 320" xmlns="http://www.w3.org/2000/svg">
          <path d="M 30 80 Q 80 40 140 90 Q 200 140 250 80" stroke="#b8a9f0" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M 20 160 Q 90 120 160 170 Q 230 200 260 150" stroke="#f27059" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
          <path d="M 40 240 Q 100 200 170 250 Q 220 270 260 230" stroke="#7dd3b2" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.65" />
          <circle cx="80" cy="130" r="20" fill="#f9c784" opacity="0.35" />
          <circle cx="210" cy="200" r="15" fill="#87c5e8" opacity="0.4" />
          <circle cx="140" cy="60" r="10" fill="#f27059" opacity="0.5" />
        </svg>

        {/* Tool bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-cream-dark p-3 flex items-center gap-2">
          {['#b8a9f0', '#f27059', '#7dd3b2', '#f9c784', '#87c5e8'].map((color) => (
            <div key={color} className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ background: color }} />
          ))}
          <div className="ml-auto w-6 h-6 rounded-lg bg-cream-dark flex items-center justify-center text-xs">✏️</div>
        </div>

        {/* Live indicator */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-600">
          <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
          Live
        </div>
      </motion.div>

      {/* Floating paint splash — coral */}
      <motion.div
        variants={float}
        animate="animate"
        className="absolute top-8 right-12 md:right-20"
      >
        <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 8 C18 6 4 18 8 32 C12 46 26 58 40 52 C54 46 60 30 52 18 C46 8 40 10 32 8 Z" fill="#f27059" opacity="0.75" />
          <circle cx="50" cy="14" r="6" fill="#f27059" opacity="0.5" />
          <circle cx="56" cy="22" r="4" fill="#f27059" opacity="0.4" />
        </svg>
      </motion.div>

      {/* Floating circle — lavender */}
      <motion.div
        variants={floatSlow}
        animate="animate"
        className="absolute top-16 left-10 md:left-4"
      >
        <div className="w-16 h-16 rounded-full bg-lavender opacity-60 blur-sm" />
        <div className="absolute inset-3 rounded-full bg-lavender-light opacity-80" />
      </motion.div>

      {/* Floating star doodle */}
      <motion.div
        animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-20 left-8"
      >
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 4 L23 15 L35 15 L25 22 L28 34 L20 27 L12 34 L15 22 L5 15 L17 15 Z" fill="#7dd3b2" opacity="0.7" />
        </svg>
      </motion.div>

      {/* Floating squiggle */}
      <motion.div
        variants={float}
        animate="animate"
        style={{ animationDelay: '1.5s' }}
        className="absolute bottom-12 right-8 md:right-16"
      >
        <svg width="70" height="30" viewBox="0 0 70 30" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 20 Q 15 5 25 20 Q 35 35 45 20 Q 55 5 65 20" stroke="#f9c784" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
        </svg>
      </motion.div>

      {/* User avatar chips */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="absolute top-1/2 -translate-y-1/2 right-0 md:right-4 flex flex-col gap-2"
      >
        {[
          { color: '#b8a9f0', label: 'Mia' },
          { color: '#f27059', label: 'Leo' },
          { color: '#7dd3b2', label: 'Sam' },
        ].map(({ color, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 bg-white rounded-full pl-1 pr-3 py-1 shadow-md text-xs font-medium text-gray-700"
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: color }}>
              {label[0]}
            </div>
            {label}
          </div>
        ))}
      </motion.div>

      {/* Pencil doodle left */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 1 }}
        className="absolute bottom-16 left-0 md:left-4"
      >
        <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="4" width="10" height="26" rx="2" fill="#87c5e8" opacity="0.7" />
          <polygon points="6,30 16,30 11,36" fill="#f9c784" opacity="0.9" />
          <rect x="6" y="4" width="10" height="5" rx="2" fill="#d4ccf7" opacity="0.9" />
        </svg>
      </motion.div>
    </div>
  );
}
