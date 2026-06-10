import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Cpu, Film, Box, Wand2, Users, ChevronDown, ChevronUp, ArrowRight, Clock } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

interface AIFeature {
  id:          string;
  name:        string;
  tagline:     string;
  description: string;
  icon:        string;
  status:      'coming_soon' | 'beta' | 'research' | 'available';
  eta:         string;
  capabilities: string[];
  preview?:    string;
}

const FUTURE_FEATURES: AIFeature[] = [
  {
    id: 'text-to-sketch',
    name: 'Text to Sketch',
    tagline: 'Describe it. See it.',
    description: 'Type a description and watch AI generate a sketch on your canvas in real time. Perfect for quickly capturing concepts, references, and ideas without picking up a brush.',
    icon: '✍️', status: 'beta', eta: 'Q3 2026',
    capabilities: ['Natural language descriptions', 'Style transfer (realistic, cartoon, sketch)', 'Iterative refinement', 'Canvas-native output', 'Collaborative AI sketching'],
    preview: 'Generate sketch',
  },
  {
    id: 'sketch-to-3d',
    name: 'Sketch to 3D',
    tagline: 'From flat to dimensional.',
    description: 'Transform your 2D drawings into interactive 3D models. Point Club\'s AI understands spatial relationships in your sketches and extrapolates depth, volume, and form.',
    icon: '🧊', status: 'research', eta: 'Q1 2027',
    capabilities: ['2D to 3D conversion', 'Real-time 3D preview', 'Exportable .GLB/.OBJ', 'Texture generation', 'VR/AR ready output'],
  },
  {
    id: 'ai-animation',
    name: 'AI Animation',
    tagline: 'Bring your art to life.',
    description: 'Select any drawing and let AI animate it — characters walk, environments breathe, abstract art pulses. From simple loops to full sequences, animation has never been this accessible.',
    icon: '🎬', status: 'research', eta: 'Q2 2027',
    capabilities: ['Frame interpolation', 'Character rigging', 'Motion loops (idle, walk, fly)', 'Particle effects', 'Export as GIF/MP4'],
  },
  {
    id: 'ai-video',
    name: 'AI Video Generation',
    tagline: 'Your concept. In motion.',
    description: 'Turn a series of drawings or a single concept into a short video. Generate cinematic sequences, art reels, and creative videos powered by your original artwork as reference.',
    icon: '🎥', status: 'research', eta: 'Q3 2027',
    capabilities: ['Drawing-guided video generation', 'Style consistency across frames', 'Narrative storyboarding', 'Voiceover integration', 'Social-ready aspect ratios'],
  },
  {
    id: 'collaborative-ai',
    name: 'Collaborative AI Creation',
    tagline: 'Human + AI, together.',
    description: 'Real-time collaborative drawing between multiple humans and multiple AI agents on the same canvas. AI contributes strokes, responds to human input, and maintains visual coherence.',
    icon: '🤝', status: 'coming_soon', eta: 'Q4 2026',
    capabilities: ['Multi-agent room participation', 'AI stroke contribution', 'Style synchronization', 'Intent recognition', 'Creative turn-taking'],
  },
  {
    id: 'style-transfer',
    name: 'Style Transfer Engine',
    tagline: 'Any style. Instantly.',
    description: 'Apply the visual style of any artist, art movement, or aesthetic to your drawings in real time. Learn from masters, experiment freely, and develop your signature look.',
    icon: '🎨', status: 'beta', eta: 'Q3 2026',
    capabilities: ['Artist style reference', 'Art movement presets', 'Partial style application', 'Style blending', 'Custom style training'],
  },
  {
    id: 'ai-critique',
    name: 'AI Art Coach',
    tagline: 'A mentor always available.',
    description: 'Continuous, real-time artistic feedback as you draw. The AI coach watches your canvas, understands your intent, and offers micro-suggestions — like having a professional artist look over your shoulder.',
    icon: '🧑‍🏫', status: 'available', eta: 'Now',
    capabilities: ['Real-time stroke analysis', 'Composition guidance', 'Proportional correction hints', 'Learning path adaptation', 'Progress tracking over time'],
  },
  {
    id: 'multimodal-canvas',
    name: 'Multimodal Canvas',
    tagline: 'Everything in one place.',
    description: 'A unified creative canvas that understands images, text, voice, video, and code. The canvas of the future is not just a drawing surface — it\'s a complete creative operating system.',
    icon: '🌐', status: 'research', eta: '2028',
    capabilities: ['Image + text + voice input', 'Code-generated visuals', 'Real-time translation', 'Multi-format export', 'Universal creative API'],
  },
];

const STATUS_CONFIG: Record<AIFeature['status'], { label: string; color: string; dot: string }> = {
  available:    { label: 'Available Now',  color: 'bg-mint/30 text-emerald-700 border-emerald-200',     dot: 'bg-emerald-500' },
  beta:         { label: 'Beta',           color: 'bg-lavender-light text-lavender-dark border-lavender/30', dot: 'bg-lavender' },
  coming_soon:  { label: 'Coming Soon',    color: 'bg-sky/20 text-sky-700 border-sky-200',               dot: 'bg-sky-500' },
  research:     { label: 'In Research',    color: 'bg-amber-50 text-amber-700 border-amber-200',          dot: 'bg-amber-500' },
};

function FeatureCard({ feature, index }: { feature: AIFeature; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const s = STATUS_CONFIG[feature.status];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
      className="bg-white rounded-3xl border border-cream-dark overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-lavender/20 to-coral/10 rounded-2xl flex items-center justify-center text-3xl shrink-0">
            {feature.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-base font-black text-gray-800">{feature.name}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.color}`}>
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${feature.status === 'available' ? 'animate-pulse' : ''}`} />
                  {s.label}
                </span>
              </span>
            </div>
            <p className="text-xs text-lavender-dark font-semibold mb-1">{feature.tagline}</p>
            <p className="text-[11px] text-gray-400 leading-relaxed">{feature.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <Clock size={9} />
            <span>ETA: <strong className="text-gray-600">{feature.eta}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            {feature.status === 'available' && (
              <motion.button whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 px-3 py-1.5 bg-lavender text-white rounded-xl text-xs font-bold hover:bg-lavender-dark transition-colors">
                Try Now <ArrowRight size={11} />
              </motion.button>
            )}
            {feature.status === 'beta' && (
              <button className="px-3 py-1.5 bg-lavender-light text-lavender-dark rounded-xl text-xs font-bold hover:bg-lavender hover:text-white transition-colors">
                Join Beta
              </button>
            )}
            {(feature.status === 'coming_soon' || feature.status === 'research') && (
              <button className="px-3 py-1.5 bg-cream text-gray-600 rounded-xl text-xs font-bold hover:bg-cream-dark transition-colors">
                Notify Me
              </button>
            )}
            <button onClick={() => setExpanded(v => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-xl bg-cream hover:bg-cream-dark transition-colors text-gray-500">
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border-t border-cream-dark px-6 py-4">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Planned Capabilities</p>
              <div className="grid grid-cols-2 gap-1.5">
                {feature.capabilities.map(cap => (
                  <div key={cap} className="flex items-center gap-1.5">
                    <Sparkles size={9} className="text-lavender-dark shrink-0" />
                    <span className="text-[11px] text-gray-600">{cap}</span>
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

const ROADMAP_PHASES = [
  { quarter: 'Q3 2026', items: ['Text to Sketch (Beta → GA)', 'Style Transfer Engine', 'Collaborative AI Creation', 'AI Art Coach (full release)'] },
  { quarter: 'Q4 2026', items: ['Collaborative AI Creation', 'Advanced agent memory', 'Multi-agent room orchestration', 'AI canvas co-creation API'] },
  { quarter: 'Q1 2027', items: ['Sketch to 3D (Early Access)', 'Motion preview engine', 'AI style personalization', 'Enterprise AI features'] },
  { quarter: 'Q2 2027+', items: ['AI Animation', 'AI Video Generation', 'Multimodal Canvas', 'Creative AI API v2'] },
];

export default function FutureAIPage() {
  const [filter, setFilter] = useState<AIFeature['status'] | 'all'>('all');

  const visible = FUTURE_FEATURES.filter(f => filter === 'all' || f.status === filter);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-lavender/20 via-white to-coral/10 border-b border-cream-dark">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Cpu size={16} className="text-lavender-dark" />
            <span className="text-xs font-bold uppercase tracking-widest text-lavender-dark">AI Roadmap</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">
            The Future of<br /><span className="text-lavender">Creative AI</span>
          </h1>
          <p className="text-sm text-gray-500 max-w-lg mx-auto">
            Point Club is building an AI-powered creative operating system. Here's a transparent look at every AI feature we're working on — from beta today to research for tomorrow.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-400">
            {Object.entries(STATUS_CONFIG).map(([status, { label, dot }]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {(['all', 'available', 'beta', 'coming_soon', 'research'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
                filter === f ? 'bg-lavender text-white' : 'bg-white border border-cream-dark text-gray-500 hover:border-lavender'
              }`}>
              {f === 'all' ? 'All Features' : STATUS_CONFIG[f as AIFeature['status']]?.label ?? f}
            </button>
          ))}
        </div>

        {/* Feature grid */}
        <div className="space-y-4 mb-12">
          {visible.map((f, i) => <FeatureCard key={f.id} feature={f} index={i} />)}
        </div>

        {/* Roadmap timeline */}
        <div className="bg-white rounded-3xl border border-cream-dark p-6">
          <h2 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
            <Wand2 size={16} className="text-lavender-dark" /> AI Release Timeline
          </h2>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-cream-dark" />
            {ROADMAP_PHASES.map((phase, i) => (
              <motion.div key={phase.quarter} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="flex gap-5 mb-8 last:mb-0">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 z-10 text-xs font-black ${
                  i === 0 ? 'bg-lavender border-lavender text-white' : 'bg-white border-cream-dark text-gray-400'
                }`}>
                  {i === 0 ? '→' : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-800 mb-2">{phase.quarter}</p>
                  <div className="space-y-1.5">
                    {phase.items.map(item => (
                      <div key={item} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${i === 0 ? 'bg-lavender' : 'bg-cream-dark'}`} />
                        <span className="text-[11px] text-gray-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Philosophy */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {[
            { icon: Users,    title: 'Human-First AI',     desc: 'Every AI feature is designed to amplify human creativity, never replace it. AI is a tool, not the artist.' },
            { icon: Sparkles, title: 'Transparent Roadmap', desc: 'We share our AI research plans openly. You deserve to know what\'s coming and when to expect it.' },
            { icon: Film,     title: 'Open API',            desc: 'Every AI feature will be accessible via the public API, so builders can integrate Point Club AI into their own products.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-cream-dark p-5">
              <div className="w-8 h-8 bg-lavender-light rounded-xl flex items-center justify-center mb-3">
                <Icon size={14} className="text-lavender-dark" />
              </div>
              <p className="text-sm font-bold text-gray-800 mb-1">{title}</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
