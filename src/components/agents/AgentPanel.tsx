import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, ChevronDown, ChevronUp, Loader2, Sparkles, X, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  chatWithAgent, getAgents,
  type AgentType, type AgentDefinition, type ConversationMessage,
} from '@/lib/services/agents.service';

interface Props {
  roomId?: string;
  compact?: boolean;
}

export default function AgentPanel({ roomId, compact = false }: Props) {
  const { user } = useAuth();
  const [open,      setOpen]      = useState(!compact);
  const [agents,    setAgents]    = useState<AgentDefinition[]>([]);
  const [selected,  setSelected]  = useState<AgentType>('sketch_mentor');
  const [messages,  setMessages]  = useState<ConversationMessage[]>([]);
  const [convId,    setConvId]    = useState<string | undefined>();
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { getAgents().then(setAgents); }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const selectedAgent = agents.find(a => a.id === selected);

  const send = useCallback(async () => {
    if (!input.trim() || !user || loading) return;
    const userMsg: ConversationMessage = { role: 'user', content: input.trim(), ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const { reply, conversationId } = await chatWithAgent({
        userId: user.id, agentType: selected,
        message: input.trim(), conversationId: convId,
      });
      setConvId(conversationId);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Agent unavailable — check API key.', ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }, [input, user, loading, selected, convId]);

  const reset = () => { setMessages([]); setConvId(undefined); };

  void roomId;

  return (
    <div className="bg-white border-t border-cream-dark">
      {/* Header */}
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-cream transition-colors">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-lavender-dark" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">AI Agent</span>
          {selectedAgent && (
            <span className="text-[10px] bg-lavender-light text-lavender-dark px-1.5 py-0.5 rounded-full font-semibold">
              {selectedAgent.emoji} {selectedAgent.name}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            {/* Agent picker */}
            <div className="border-b border-cream-dark">
              <button onClick={() => setShowPicker(v => !v)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-cream transition-colors">
                <div className="flex items-center gap-1.5">
                  <Bot size={11} className="text-lavender-dark" />
                  <span className="text-[10px] text-gray-500 font-semibold">
                    {selectedAgent?.emoji} {selectedAgent?.name ?? 'Select agent'}
                  </span>
                </div>
                <span className="text-[9px] text-gray-400">change</span>
              </button>

              <AnimatePresence>
                {showPicker && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="bg-cream overflow-hidden">
                    {agents.map(a => (
                      <button key={a.id} onClick={() => { setSelected(a.id); setShowPicker(false); reset(); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-lavender-light/30 ${selected === a.id ? 'bg-lavender-light/50' : ''}`}>
                        <span className="text-base">{a.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-gray-700">{a.name}</p>
                          <p className="text-[9px] text-gray-400 truncate">{a.desc}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Messages */}
            <div className="h-48 overflow-y-auto p-2.5 flex flex-col gap-2">
              {messages.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-[11px] text-gray-400">
                    Ask {selectedAgent?.name ?? 'the AI agent'} anything about your drawing
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-lavender text-white rounded-tr-sm'
                      : 'bg-cream border border-cream-dark text-gray-700 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-cream border border-cream-dark rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-1.5">
                    <Loader2 size={10} className="animate-spin text-lavender-dark" />
                    <span className="text-[10px] text-gray-400">Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-cream-dark p-2 flex gap-1.5 items-end">
              {messages.length > 0 && (
                <button onClick={reset} title="Clear chat"
                  className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors">
                  <RotateCcw size={11} />
                </button>
              )}
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); }}}
                placeholder={user ? `Ask ${selectedAgent?.name ?? 'agent'}…` : 'Sign in to chat with agents'}
                disabled={!user}
                rows={1}
                className="flex-1 text-[11px] px-2.5 py-1.5 rounded-xl border border-cream-dark focus:border-lavender outline-none resize-none bg-cream text-gray-700 placeholder-gray-400 disabled:opacity-50" />
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => void send()}
                disabled={!input.trim() || !user || loading}
                className="w-6 h-6 rounded-xl bg-lavender text-white flex items-center justify-center hover:bg-lavender-dark transition-colors disabled:opacity-40">
                <Send size={10} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
