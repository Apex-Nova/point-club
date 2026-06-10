import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Plus, X, Pencil, Lightbulb, Palette, MessageSquare, Eye, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { chatWithAgent, type AgentType } from '@/lib/services/agents.service';
import { useAuth } from '@/contexts/AuthContext';

interface AITeammate {
  id:        string;
  agentType: AgentType;
  name:      string;
  emoji:     string;
  status:    'idle' | 'thinking' | 'active';
  lastAction?: string;
}

const TEAMMATE_CONFIGS: { type: AgentType; name: string; emoji: string; role: string; color: string }[] = [
  { type: 'sketch_mentor',      name: 'Sketch Mentor',   emoji: '✏️', role: 'Gives drawing tips',         color: 'bg-blue-50   text-blue-700   border-blue-200'  },
  { type: 'concept_artist',     name: 'Concept Artist',  emoji: '🎨', role: 'Generates visual ideas',     color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { type: 'color_expert',       name: 'Color Expert',    emoji: '🌈', role: 'Palette & color advice',     color: 'bg-pink-50   text-pink-700   border-pink-200'   },
  { type: 'brainstorm_partner', name: 'Brainstormer',    emoji: '💡', role: 'Unlocks creativity',         color: 'bg-amber-50  text-amber-700  border-amber-200'  },
  { type: 'story_builder',      name: 'Story Builder',   emoji: '📖', role: 'Creates narrative & lore',   color: 'bg-green-50  text-green-700  border-green-200'  },
  { type: 'design_reviewer',    name: 'Design Reviewer', emoji: '🔍', role: 'Professional critique',      color: 'bg-gray-50   text-gray-700   border-gray-200'   },
];

interface Props {
  roomId: string;
}

export default function AITeammatePanel({ roomId }: Props) {
  const { user } = useAuth();
  const [open,       setOpen]       = useState(true);
  const [teammates,  setTeammates]  = useState<AITeammate[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [activeConv, setActiveConv] = useState<{ teammateId: string; messages: { role: 'user' | 'assistant'; content: string }[] } | null>(null);
  const [input,      setInput]      = useState('');
  const [convIds,    setConvIds]    = useState<Record<string, string>>({});

  const addTeammate = (config: typeof TEAMMATE_CONFIGS[0]) => {
    if (teammates.some(t => t.agentType === config.type)) return;
    const t: AITeammate = {
      id: Math.random().toString(36).slice(2),
      agentType: config.type,
      name:      config.name,
      emoji:     config.emoji,
      status:    'idle',
    };
    setTeammates(prev => [...prev, t]);
    setShowPicker(false);

    // Generate a greeting from the AI
    if (user) {
      setTimeout(() => {
        const greetings: Record<AgentType, string> = {
          sketch_mentor:      `👋 Hey! I'm your Sketch Mentor. Show me what you're working on and I'll suggest improvements!`,
          concept_artist:     `🎨 Ready to brainstorm! Tell me your concept and I'll expand it into something spectacular.`,
          brainstorm_partner: `💡 Let's create! I'm here to push your ideas further. What are we exploring today?`,
          color_expert:       `🌈 Hello! Describe your scene and I'll craft the perfect palette.`,
          story_builder:      `📖 Exciting! Every drawing has a story. Tell me what you're creating and I'll build the world around it.`,
          design_reviewer:    `🔍 Design review mode: ON. Show me your work and I'll give you professional feedback.`,
          room_assistant:     `📋 Room assistant ready. I'll track ideas, decisions, and action items as you work.`,
        };
        setTeammates(prev => prev.map(tm => tm.id === t.id ? { ...tm, status: 'active', lastAction: greetings[config.type] } : tm));
      }, 800);
    }
  };

  const removeTeammate = (id: string) => {
    setTeammates(prev => prev.filter(t => t.id !== id));
    if (activeConv?.teammateId === id) setActiveConv(null);
  };

  const openChat = (teammate: AITeammate) => {
    setActiveConv({ teammateId: teammate.id, messages: [] });
    setInput('');
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !user || !activeConv) return;
    const msg = input.trim();
    setInput('');
    const userMsg = { role: 'user' as const, content: msg };
    setActiveConv(prev => prev ? { ...prev, messages: [...prev.messages, userMsg] } : null);

    const teammate = teammates.find(t => t.id === activeConv.teammateId);
    if (!teammate) return;

    setTeammates(prev => prev.map(t => t.id === teammate.id ? { ...t, status: 'thinking' } : t));
    try {
      const { reply, conversationId } = await chatWithAgent({
        userId: user.id, agentType: teammate.agentType,
        message: msg, conversationId: convIds[teammate.id],
      });
      if (conversationId) setConvIds(prev => ({ ...prev, [teammate.id]: conversationId }));
      setActiveConv(prev => prev ? { ...prev, messages: [...prev.messages, { role: 'assistant', content: reply }] } : null);
      setTeammates(prev => prev.map(t => t.id === teammate.id ? { ...t, status: 'active', lastAction: reply.slice(0, 60) + (reply.length > 60 ? '…' : '') } : t));
    } catch {
      setTeammates(prev => prev.map(t => t.id === teammate.id ? { ...t, status: 'idle' } : t));
    }
  }, [input, user, activeConv, teammates, convIds]);

  void roomId;

  const activeTeammate = activeConv ? teammates.find(t => t.id === activeConv.teammateId) : null;
  const config = activeTeammate ? TEAMMATE_CONFIGS.find(c => c.type === activeTeammate.agentType) : null;

  return (
    <div className="border-t border-cream-dark bg-white">
      {/* Header */}
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-cream transition-colors">
        <div className="flex items-center gap-2">
          <Bot size={12} className="text-lavender-dark" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">AI Teammates</span>
          {teammates.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-lavender text-white text-[9px] font-black flex items-center justify-center">
              {teammates.length}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={11} className="text-gray-400" /> : <ChevronDown size={11} className="text-gray-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3">
              {/* Active teammates */}
              {teammates.map(t => {
                const cfg = TEAMMATE_CONFIGS.find(c => c.type === t.agentType);
                return (
                  <div key={t.id} className={`flex items-center gap-2 p-2 mb-1.5 rounded-xl border ${cfg?.color ?? ''}`}>
                    <span className="text-sm">{t.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold">{t.name}</span>
                        {t.status === 'thinking' && <Loader2 size={9} className="animate-spin text-lavender-dark" />}
                        {t.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      </div>
                      {t.lastAction && <p className="text-[9px] opacity-70 truncate">{t.lastAction}</p>}
                    </div>
                    <button onClick={() => openChat(t)} className="p-1 rounded-lg hover:bg-white/50 transition-colors">
                      <MessageSquare size={11} />
                    </button>
                    <button onClick={() => removeTeammate(t.id)} className="p-1 rounded-lg hover:bg-white/50 transition-colors">
                      <X size={11} />
                    </button>
                  </div>
                );
              })}

              {/* Add teammate button */}
              <button onClick={() => setShowPicker(v => !v)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-cream-dark text-[10px] font-semibold text-gray-400 hover:border-lavender hover:text-lavender-dark transition-colors">
                <Plus size={11} /> Invite AI Teammate
              </button>

              {/* Picker */}
              <AnimatePresence>
                {showPicker && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden">
                    <div className="mt-2 space-y-1">
                      {TEAMMATE_CONFIGS.filter(c => !teammates.some(t => t.agentType === c.type)).map(cfg => (
                        <button key={cfg.type} onClick={() => addTeammate(cfg)}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-cream transition-colors text-left">
                          <span className="text-base">{cfg.emoji}</span>
                          <div>
                            <p className="text-[11px] font-semibold text-gray-700">{cfg.name}</p>
                            <p className="text-[9px] text-gray-400">{cfg.role}</p>
                          </div>
                          <Plus size={11} className="ml-auto text-gray-300" />
                        </button>
                      ))}
                      {TEAMMATE_CONFIGS.filter(c => !teammates.some(t => t.agentType === c.type)).length === 0 && (
                        <p className="text-center text-[10px] text-gray-400 py-2">All teammates added!</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat modal */}
      <AnimatePresence>
        {activeConv && activeTeammate && config && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-20 right-4 w-72 bg-white rounded-2xl shadow-2xl border border-cream-dark z-50 overflow-hidden">
            <div className={`flex items-center gap-2 px-3 py-2.5 border-b border-cream-dark ${config.color}`}>
              <span className="text-base">{activeTeammate.emoji}</span>
              <span className="text-xs font-bold flex-1">{activeTeammate.name}</span>
              <button onClick={() => setActiveConv(null)} className="opacity-60 hover:opacity-100">
                <X size={12} />
              </button>
            </div>
            <div className="h-48 overflow-y-auto p-3 space-y-2">
              {activeConv.messages.length === 0 && (
                <p className="text-[11px] text-gray-400 text-center py-4">
                  Start chatting with {activeTeammate.name}
                </p>
              )}
              {activeConv.messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-2.5 py-1.5 rounded-xl text-[11px] leading-relaxed ${
                    m.role === 'user' ? 'bg-lavender text-white' : 'bg-cream text-gray-700'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-cream-dark flex gap-1.5">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void sendMessage(); }}
                placeholder="Ask anything…"
                className="flex-1 text-[11px] px-2.5 py-1.5 rounded-xl border border-cream-dark focus:border-lavender outline-none bg-cream" />
              <button onClick={() => void sendMessage()}
                className="px-2.5 py-1.5 rounded-xl bg-lavender text-white text-[10px] font-bold hover:bg-lavender-dark transition-colors">
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick action hints when no teammates */}
      {teammates.length === 0 && open && (
        <div className="px-3 pb-3">
          <div className="grid grid-cols-3 gap-1.5 mt-1">
            {[
              { icon: Pencil,    label: 'Draw tips',    type: 'sketch_mentor' as AgentType },
              { icon: Lightbulb, label: 'Ideas',        type: 'brainstorm_partner' as AgentType },
              { icon: Palette,   label: 'Colors',       type: 'color_expert' as AgentType },
              { icon: Eye,       label: 'Review',       type: 'design_reviewer' as AgentType },
              { icon: Bot,       label: 'Story',        type: 'story_builder' as AgentType },
              { icon: MessageSquare, label: 'Concepts', type: 'concept_artist' as AgentType },
            ].map(({ icon: Icon, label, type }) => {
              const cfg = TEAMMATE_CONFIGS.find(c => c.type === type)!;
              return (
                <button key={type} onClick={() => addTeammate(cfg)}
                  className="flex flex-col items-center gap-0.5 py-2 rounded-xl bg-cream hover:bg-cream-dark transition-colors">
                  <Icon size={12} className="text-lavender-dark" />
                  <span className="text-[9px] font-semibold text-gray-500">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
