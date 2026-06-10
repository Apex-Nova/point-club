import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Pencil, ArrowRight, Sparkles } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const STATS = [
  { value: '2,400+', label: 'Creators' },
  { value: '340',    label: 'Live Rooms' },
  { value: '18k+',   label: 'Sketches Today' },
  { value: 'Free',   label: 'To Start' },
];

export default function CTASection() {
  const { ref, isInView } = useScrollAnimation();
  const navigate = useNavigate();

  return (
    <section className="py-32 px-6 bg-cream">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-5xl mx-auto"
      >
        {/* Main CTA card */}
        <div
          className="relative rounded-[2.5rem] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #6b57c8 0%, #8b78e0 40%, #b8a9f0 100%)',
            boxShadow: '0 32px 80px rgb(107 87 200 / 0.4), 0 12px 32px rgb(107 87 200 / 0.25)',
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/8 blur-sm" />
          <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-white/6" />
          <div className="absolute top-12 right-20 w-24 h-24 rounded-full bg-coral/20" />

          {/* Star shape accent */}
          <div className="absolute top-8 right-12 opacity-20">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <path d="M28 2 Q 32 18 52 28 Q 32 38 28 54 Q 24 38 4 28 Q 24 18 28 2Z" fill="white" />
            </svg>
          </div>

          <div className="relative z-10 px-8 py-16 md:px-16 md:py-20 text-center">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15 }}
              className="flex items-center justify-center gap-2 mb-5"
            >
              <Sparkles size={14} className="text-white/70" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                Free Forever · No Credit Card
              </span>
              <Sparkles size={14} className="text-white/70" />
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-[1.1]"
            >
              Ready to Draw<br />Together?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.28 }}
              className="text-lavender-light text-lg max-w-md mx-auto mb-10 leading-relaxed opacity-90"
            >
              Join thousands of creative minds already collaborating on Point Club. Start drawing in seconds.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.35 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/draw')}
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-lavender-dark font-bold text-base hover:bg-cream transition-colors"
                style={{ boxShadow: '0 6px 24px rgb(0 0 0 / 0.25)' }}
              >
                <Pencil size={18} />
                Start Drawing Free
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/discover')}
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-white/15 text-white font-semibold text-base hover:bg-white/25 transition-colors border border-white/30"
              >
                Explore Gallery
                <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Stats strip below */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
        >
          {STATS.map(s => (
            <div
              key={s.label}
              className="bg-white rounded-2xl px-6 py-7 text-center border border-[#e4ddd3] shadow-[0_4px_20px_rgb(0_0_0/0.09),0_1px_6px_rgb(0_0_0/0.04)]"
            >
              <p style={{ fontFamily: 'var(--font-display)' }} className="text-3xl font-bold text-gray-900 mb-1">
                {s.value}
              </p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
