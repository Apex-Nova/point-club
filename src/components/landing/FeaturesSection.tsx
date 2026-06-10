import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shuffle, Lock, Maximize2, Lightbulb, Save, ChevronDown } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import SectionHeader from '@/components/ui/SectionHeader';

const features = [
  {
    icon: Users,
    title: 'Multiplayer Drawing',
    summary: 'Collaborate with up to 20 people on a single canvas in real time.',
    detail: 'See every stroke as it happens — cursors, colors, and creativity flowing together. Perfect for design sprints, creative jam sessions, remote workshops, or just drawing with friends.',
    benefits: ['Up to 20 simultaneous collaborators', 'Live cursor visibility', 'Real-time stroke sync under 50ms'],
    accent: '#8b78e0',
    bg: 'bg-lavender-light',
    text: 'text-lavender-dark',
  },
  {
    icon: Shuffle,
    title: 'Random Creative Match',
    summary: 'Get paired with a random creative soul for spontaneous collaboration.',
    detail: 'Our matchmaking connects you with artists worldwide who share your style and mood. No agenda, no pressure — just pure creative serendipity.',
    benefits: ['Skill-matched pairing', 'Genre & style preferences', 'Instant 1-click matching'],
    accent: '#f9c784',
    bg: 'bg-peach/40',
    text: 'text-orange-600',
  },
  {
    icon: Lock,
    title: 'Private Rooms',
    summary: 'Create password-protected rooms for your team or inner circle.',
    detail: 'Invite-only, link-based, or password-protected — you control who enters. Perfect for client work, team ideation, and private creative sessions.',
    benefits: ['Multiple access modes', 'No account required to join', 'End-to-end private sessions'],
    accent: '#87c5e8',
    bg: 'bg-sky/25',
    text: 'text-sky-700',
  },
  {
    icon: Maximize2,
    title: 'Infinite Canvas',
    summary: 'Pan and zoom across an endless drawing surface with no boundaries.',
    detail: 'The world canvas grows with your ideas. Zoom from a bird\'s-eye view of the whole world down to individual pixel-perfect details. Your ideas have no limits.',
    benefits: ['Infinite pan & zoom', 'Sector-based rendering', 'World canvas community layer'],
    accent: '#7dd3b2',
    bg: 'bg-mint/25',
    text: 'text-emerald-700',
  },
  {
    icon: Lightbulb,
    title: 'AI-Powered Brainstorming',
    summary: 'Sticky notes, mind maps, and AI agents that actually help you think.',
    detail: 'The Smart Whiteboard combines visual thinking tools with six specialized AI agents — Sketch Mentor, Color Expert, Story Builder, and more — all ready to jump in.',
    benefits: ['6 AI creative agents', 'Smart whiteboard tools', 'Mind maps & flowcharts'],
    accent: '#f27059',
    bg: 'bg-coral/15',
    text: 'text-coral-dark',
  },
  {
    icon: Save,
    title: 'Auto-Save & Continue',
    summary: 'Every session is saved automatically. Pick up right where you left off.',
    detail: 'Cloud-synced in real time. Export as PNG at any resolution. Version history, offline mode, and automatic conflict resolution when collaborators work simultaneously.',
    benefits: ['Real-time cloud sync', 'Offline drawing support', 'Conflict-free collaboration'],
    accent: '#8b78e0',
    bg: 'bg-lavender-light',
    text: 'text-lavender-dark',
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const { ref, isInView } = useScrollAnimation();
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-3xl border border-[#e4ddd3] shadow-[0_4px_20px_rgb(0_0_0/0.09),0_1px_6px_rgb(0_0_0/0.04)] hover:shadow-[0_16px_48px_rgb(0_0_0/0.13),0_4px_14px_rgb(0_0_0/0.07)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden group"
    >
      <div className="p-8">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110`}
          style={{ boxShadow: `0 6px 18px ${feature.accent}35` }}
        >
          <Icon size={26} style={{ color: feature.accent }} />
        </div>

        {/* Title */}
        <h3
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-xl font-bold text-gray-900 mb-4 leading-snug"
        >
          {feature.title}
        </h3>

        {/* Toggle — summary + detail hidden until expanded */}
        <button
          onClick={() => setOpen(v => !v)}
          className={`flex items-center gap-2 text-xs font-bold transition-colors ${feature.text}`}
        >
          <span>{open ? 'Hide details' : 'View details'}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown size={14} />
          </motion.span>
        </button>
      </div>

      {/* Expandable — summary + detail + benefits */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div
              className={`mx-8 mb-8 rounded-2xl ${feature.bg} p-6`}
              style={{ borderLeft: `3px solid ${feature.accent}` }}
            >
              <p className="text-sm font-medium text-gray-800 leading-relaxed mb-3">{feature.summary}</p>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{feature.detail}</p>
              <ul className="space-y-2">
                {feature.benefits.map(b => (
                  <li key={b} className="flex items-center gap-2.5 text-xs font-semibold text-gray-800">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: feature.accent }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-32 px-6 bg-[#f2eeff]">
      <div className="max-w-6xl mx-auto w-full">
        <div className="mb-20 flex flex-col items-center text-center">
          <SectionHeader
            eyebrow="Everything You Need"
            eyebrowColor="bg-lavender-light text-lavender-dark"
            title={<>Built for<br />Creatives</>}
            subtitle="Powerful tools designed to spark creativity and make collaboration feel effortless — from first sketch to polished masterpiece."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 w-full">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
