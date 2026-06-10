import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Swords, HelpCircle, Globe, ChevronDown, CheckCircle } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import SectionHeader from '@/components/ui/SectionHeader';

const roadmap = [
  {
    icon: Bot,
    title: 'AI Drawing Assistant',
    summary: 'Ask the AI to sketch ideas, auto-complete doodles, or transform rough shapes into polished illustrations.',
    detail: 'Six specialized AI agents work alongside you: Sketch Mentor analyzes your technique, Color Expert builds palettes, Story Builder turns art into narrative, and more. Each agent remembers your conversation history.',
    examples: ['Type "sketch a futuristic city" and watch it appear', 'Get real-time composition feedback', 'Generate color palettes from mood descriptions'],
    tag: 'Now Available',
    status: 'live',
    accent: '#8b78e0',
    bg: 'bg-lavender-light',
  },
  {
    icon: Swords,
    title: 'Scribble Battles',
    summary: 'Fast-paced drawing competitions — race to sketch a prompt, voted on by the community.',
    detail: 'Up to 8 players race to illustrate the same prompt in 60 seconds. Community votes crown the winner. XP, badges, and bragging rights await the champion.',
    examples: ['1-on-1 duels or group battles', 'Real-time spectator mode', 'Weekly ranked tournaments'],
    tag: 'Now Available',
    status: 'live',
    accent: '#f27059',
    bg: 'bg-coral/12',
  },
  {
    icon: HelpCircle,
    title: 'Guess The Drawing',
    summary: 'The classic drawing game reimagined — one person draws, everyone guesses. Endless fun.',
    detail: 'Custom word packs, theme nights, and AI-assisted prompts keep the game fresh. Works in rooms of 2 to 20 players with built-in voice chat.',
    examples: ['Custom word packs', 'Themed challenge nights', 'AI difficulty scaling'],
    tag: 'Now Available',
    status: 'live',
    accent: '#7dd3b2',
    bg: 'bg-mint/20',
  },
  {
    icon: Globe,
    title: 'Infinite World Canvas',
    summary: 'A single, ever-expanding world canvas where every creator leaves their permanent mark.',
    detail: 'The entire Point Club community paints on one shared infinite canvas. Sectors, regions, and neighbourhoods emerge organically as creators claim their space and collaborate.',
    examples: ['Navigate by creator or region', 'Time-lapse of canvas evolution', 'Monthly world art festivals'],
    tag: 'Now Available',
    status: 'live',
    accent: '#87c5e8',
    bg: 'bg-sky/20',
  },
];

function RoadmapCard({ item, index }: { item: typeof roadmap[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const { ref, isInView } = useScrollAnimation();
  const Icon = item.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -24 : 24 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-3xl border border-[#e4ddd3] shadow-[0_4px_20px_rgb(0_0_0/0.09),0_1px_6px_rgb(0_0_0/0.04)] hover:shadow-[0_16px_48px_rgb(0_0_0/0.13),0_4px_14px_rgb(0_0_0/0.07)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
      style={{ borderTop: `4px solid ${item.accent}` }}
    >
      <div className="p-9">
        <div className="flex items-start gap-6">
          {/* Icon */}
          <div
            className={`w-16 h-16 rounded-2xl ${item.bg} flex items-center justify-center shrink-0`}
            style={{ boxShadow: `0 8px 24px ${item.accent}35` }}
          >
            <Icon size={28} style={{ color: item.accent }} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-2.5 flex-wrap">
              <h3 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-900 leading-snug">
                {item.title}
              </h3>
              {item.status === 'live' ? (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                  <CheckCircle size={11} /> {item.tag}
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 shrink-0">
                  {item.tag}
                </span>
              )}
            </div>

            {/* Expand toggle — summary hidden until expanded */}
            <button
              onClick={() => setOpen(v => !v)}
              className="mt-2 flex items-center gap-1.5 text-xs font-bold transition-colors"
              style={{ color: item.accent }}
            >
              {open ? 'Show less' : 'See details'}
              <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
                <ChevronDown size={13} />
              </motion.span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className={`mx-9 mb-9 rounded-2xl ${item.bg} p-6`}>
              <p className="text-sm font-medium text-gray-800 leading-relaxed mb-2">{item.summary}</p>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">{item.detail}</p>
              <div className="space-y-2.5">
                {item.examples.map(ex => (
                  <div key={ex} className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: item.accent }} />
                    <span className="text-xs font-medium text-gray-700">{ex}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="py-32 px-6 bg-[#fff9f8]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-20">
          <SectionHeader
            eyebrow="What's Inside"
            eyebrowColor="bg-peach/35 text-orange-600"
            title={<>Platform<br />Features</>}
            subtitle="Point Club is a full creative operating system — drawing, games, AI agents, community, and commerce all in one place."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {roadmap.map((item, i) => (
            <RoadmapCard key={item.title} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
