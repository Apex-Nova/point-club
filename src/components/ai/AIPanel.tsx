import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Palette, Loader2, ChevronDown, ChevronUp, Lightbulb, RefreshCw } from 'lucide-react';
import { getDrawingIdeas, getColorPalettes, type ColorPalette } from '@/lib/services/ai.service';

const MOODS = ['vibrant','calm','dark','pastel','neon','earthy','monochrome'];
const CONTEXTS = ['fantasy art','sci-fi concept','nature','portrait','architecture','abstract','cartoon'];

interface Props {
  onColorPick?: (hex: string) => void;
}

export default function AIPanel({ onColorPick }: Props) {
  const [tab,      setTab]      = useState<'ideas' | 'colors'>('ideas');
  const [open,     setOpen]     = useState(true);
  const [context,  setContext]  = useState('fantasy art');
  const [mood,     setMood]     = useState('vibrant');
  const [ideas,    setIdeas]    = useState<string[]>([]);
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [loading,  setLoading]  = useState(false);

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const data = await getDrawingIdeas(context);
      setIdeas(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchColors = async () => {
    setLoading(true);
    try {
      const data = await getColorPalettes(mood);
      setPalettes(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-t border-cream-dark">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-cream transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-lavender-dark" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">AI Assistant</span>
        </div>
        {open ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex border-b border-cream-dark">
              {(['ideas','colors'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    tab === t ? 'text-lavender-dark border-b-2 border-lavender-dark' : 'text-gray-400'
                  }`}>
                  {t === 'ideas' ? '💡 Ideas' : '🎨 Colors'}
                </button>
              ))}
            </div>

            <div className="p-3 space-y-2">
              {tab === 'ideas' ? (
                <>
                  <select value={context} onChange={e => setContext(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-cream-dark bg-cream text-gray-600 outline-none">
                    {CONTEXTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={fetchIdeas} disabled={loading}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-lavender text-white text-xs font-semibold hover:bg-lavender-dark transition-colors disabled:opacity-60">
                    {loading ? <Loader2 size={11} className="animate-spin" /> : <Lightbulb size={11} />}
                    {loading ? 'Thinking…' : 'Get Ideas'}
                  </motion.button>

                  {ideas.length > 0 && (
                    <div className="space-y-1">
                      {ideas.map((idea, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-1.5 text-[10px] text-gray-600 bg-cream rounded-lg px-2 py-1.5">
                          <span className="text-lavender-dark font-bold shrink-0">{i + 1}.</span>
                          <span className="leading-relaxed">{idea.replace(/^\d+\.\s*/, '')}</span>
                        </motion.div>
                      ))}
                      <button onClick={fetchIdeas} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-lavender-dark transition-colors mx-auto">
                        <RefreshCw size={9} /> More ideas
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <select value={mood} onChange={e => setMood(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-cream-dark bg-cream text-gray-600 outline-none">
                    {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={fetchColors} disabled={loading}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-lavender text-white text-xs font-semibold hover:bg-lavender-dark transition-colors disabled:opacity-60">
                    {loading ? <Loader2 size={11} className="animate-spin" /> : <Palette size={11} />}
                    {loading ? 'Generating…' : 'Suggest Palettes'}
                  </motion.button>

                  {palettes.map((pal, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className="bg-cream rounded-lg p-2 space-y-1">
                      <p className="text-[10px] font-bold text-gray-700">{pal.name}</p>
                      <div className="flex gap-1">
                        {pal.colors.map(hex => (
                          <button key={hex} onClick={() => onColorPick?.(hex)}
                            title={hex}
                            className="w-6 h-6 rounded-lg hover:scale-125 transition-transform shadow-sm border border-white/50 shrink-0"
                            style={{ background: hex }} />
                        ))}
                      </div>
                      <p className="text-[9px] text-gray-400 italic">{pal.vibe}</p>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
