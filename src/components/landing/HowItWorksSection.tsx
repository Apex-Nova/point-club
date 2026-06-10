import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DoorOpen, UserPlus, Pencil, ArrowRight, ChevronDown } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import SectionHeader from '@/components/ui/SectionHeader';

const steps = [
  {
    number: '01',
    icon: DoorOpen,
    title: 'Create a Room',
    description: 'Start a new canvas in seconds. Name your room, choose a theme, set it public or private. No setup, no complexity.',
    tip: 'Takes about 10 seconds',
    color: 'bg-lavender',
    glow: 'rgb(139 120 224 / 0.28)',
    accent: '#8b78e0',
  },
  {
    number: '02',
    icon: UserPlus,
    title: 'Invite Friends',
    description: 'Share a simple link or invite code. Collaborators join instantly — no account required to start creating together.',
    tip: 'No download needed',
    color: 'bg-coral',
    glow: 'rgb(242 112 89 / 0.28)',
    accent: '#f27059',
  },
  {
    number: '03',
    icon: Pencil,
    title: 'Draw Together',
    description: 'Pick up your tools and create. See every stroke in real time as ideas come to life. Voice, AI agents, and smart tools included.',
    tip: 'Live, under 50ms',
    color: 'bg-mint',
    glow: 'rgb(125 211 178 / 0.28)',
    accent: '#7dd3b2',
  },
];

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const { ref, isInView } = useScrollAnimation();
  const Icon = step.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col items-center text-center"
    >
      {/* Step number */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <span
          className="text-[10px] font-black tracking-widest px-3 py-1 rounded-full text-white"
          style={{ background: step.accent }}
        >
          {step.number}
        </span>
      </div>

      {/* Card */}
      <div className="w-full bg-white rounded-3xl border border-[#e4ddd3] shadow-[0_4px_20px_rgb(0_0_0/0.09),0_1px_6px_rgb(0_0_0/0.04)] p-8 pt-10 flex flex-col items-center">
        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          className={`w-20 h-20 rounded-3xl ${step.color} flex items-center justify-center mb-6 relative`}
          style={{ boxShadow: `0 12px 36px ${step.glow}` }}
        >
          <Icon size={34} className="text-white" />
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0, 0.35] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: index * 0.7 }}
            className={`absolute inset-0 rounded-3xl ${step.color}`}
          />
        </motion.div>

        {/* Title */}
        <h3 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-900 mb-4">
          {step.title}
        </h3>

        {/* Toggle */}
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 text-xs font-bold transition-colors"
          style={{ color: step.accent }}
        >
          {open ? 'Hide details' : 'How it works'}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown size={13} />
          </motion.span>
        </button>

        {/* Expandable description + tip */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden w-full"
            >
              <div className="mt-5 pt-5 border-t border-[#ece5d8] text-center">
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{step.description}</p>
                <span
                  className="inline-block text-[11px] font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: `${step.accent}18`, color: step.accent }}
                >
                  ✓ {step.tip}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function HowItWorksSection() {
  const { ref, isInView } = useScrollAnimation();

  return (
    <section className="py-32 px-6 bg-[#f6fffe] overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="mb-24">
          <SectionHeader
            eyebrow="Simple as 1-2-3"
            eyebrowColor="bg-mint/25 text-emerald-700"
            title="How It Works"
            subtitle="Get from idea to live collaboration in under a minute. No downloads, no friction, no complicated setup."
          />
        </div>

        <div className="relative">
          {/* Connector line desktop */}
          <div
            className="hidden lg:block absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px z-0"
            style={{ background: 'linear-gradient(90deg, #8b78e0 0%, #f27059 50%, #7dd3b2 100%)', opacity: 0.25 }}
          />

          {/* Arrows desktop */}
          <div className="hidden lg:flex absolute top-[2.1rem] left-[calc(33.33%)] right-[calc(33.33%)] justify-between z-0 px-0 pointer-events-none">
            {[0, 1].map(i => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.6 + i * 0.15 }}>
                <ArrowRight size={16} className="text-gray-300" />
              </motion.div>
            ))}
          </div>

          <div ref={ref as unknown as React.RefObject<HTMLDivElement>} className="grid grid-cols-1 lg:grid-cols-3 gap-16 relative z-10">
            {steps.map((step, i) => (
              <StepCard key={step.title} step={step} index={i} />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.9 }}
          className="text-center mt-16"
        >
          <p className="text-sm text-gray-400">
            Join <span className="font-semibold text-gray-700">2,400+</span> creators already drawing together
          </p>
        </motion.div>
      </div>
    </section>
  );
}
