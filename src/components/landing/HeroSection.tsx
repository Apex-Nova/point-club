import { motion, type Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import HeroIllustration from './HeroIllustration';
import { Pencil, Users, DoorOpen, Sparkles } from 'lucide-react';

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden:   { opacity: 0, y: 28 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const AVATAR_COLORS = ['#8b78e0', '#f27059', '#7dd3b2', '#87c5e8', '#f9c784'];

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen flex items-center pt-28 pb-24 px-6 overflow-hidden relative">
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 60% 40%, rgb(139 120 224 / 0.11) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 20% 70%, rgb(242 112 89 / 0.08) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
        {/* Left — copy */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-7"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lavender-light text-lavender-dark text-xs font-bold uppercase tracking-wide shadow-[0_2px_8px_rgb(139_120_224/0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
              Now in Beta — Join Free
              <Sparkles size={11} />
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-5xl md:text-6xl lg:text-[4.25rem] font-bold leading-[1.08] tracking-tight text-gray-900"
          >
            Create Ideas<br />
            <span className="text-lavender-dark">Together</span>{' '}
            <span className="relative inline-block">
              From
              <svg className="absolute -bottom-1.5 left-0 w-full" height="7" viewBox="0 0 100 7" preserveAspectRatio="none">
                <path d="M0 6 Q 25 1 50 5 Q 75 9 100 4" stroke="#f27059" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </svg>
            </span>{' '}
            Anywhere
          </motion.h1>

          {/* Sub */}
          <motion.p variants={itemVariants} className="text-lg text-gray-500 leading-relaxed max-w-lg">
            Draw, brainstorm, sketch and collaborate in real time with friends and creative minds around the world. AI-powered, beautifully simple.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
            <Button variant="primary" size="lg" onClick={() => navigate('/draw')}>
              <Pencil size={17} /> Start Drawing
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/dashboard')}>
              <DoorOpen size={17} /> Open a Room
            </Button>
            <Button variant="ghost" size="lg" onClick={() => navigate('/discover')}>
              <Users size={17} /> Explore
            </Button>
          </motion.div>

          {/* Social proof */}
          <motion.div variants={itemVariants} className="flex items-center gap-5">
            <div className="flex -space-x-2.5">
              {AVATAR_COLORS.map((color, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full border-[2.5px] border-white shadow-sm flex items-center justify-center"
                  style={{ background: color, zIndex: AVATAR_COLORS.length - i }}
                >
                  <span className="text-white text-xs font-bold">
                    {['A', 'J', 'M', 'K', 'S'][i]}
                  </span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">2,400+ creators</p>
              <p className="text-xs text-gray-400">drawing right now</p>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-cream-dark" />

            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="13" height="13" fill="#f9c784" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-xs text-gray-400 ml-0.5">4.9</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right — illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          {/* Glow behind illustration */}
          <div
            className="absolute inset-0 rounded-3xl blur-3xl opacity-30 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, #8b78e0 0%, #f27059 60%, transparent 80%)' }}
          />
          <HeroIllustration />
        </motion.div>
      </div>
    </section>
  );
}
