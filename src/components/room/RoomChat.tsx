import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile } from 'lucide-react';
import { useRoomChat, type ChatMessage } from '@/hooks/useRoomChat';
import type { Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

const QUICK_EMOJI = ['👍', '❤️', '😂', '🎨', '🔥', '✨', '💜', '🎉'];

function MessageBubble({ msg, myId, onReact }: {
  msg: ChatMessage; myId?: string; onReact: (id: string, emoji: string) => void;
}) {
  const isMe = msg.user_id === myId;
  const [showEmoji, setShowEmoji] = useState(false);

  return (
    <div className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}>
      <div className="w-6 h-6 rounded-full bg-lavender-light flex items-center justify-center text-xs font-bold text-lavender-dark shrink-0 mt-1">
        {msg.username[0]?.toUpperCase()}
      </div>
      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isMe && <span className="text-[10px] text-gray-400 mb-0.5 px-1">{msg.username}</span>}
        <div
          className={`relative px-3 py-2 rounded-2xl text-xs leading-relaxed ${
            isMe ? 'bg-lavender text-white rounded-tr-sm' : 'bg-cream border border-cream-dark text-gray-700 rounded-tl-sm'
          }`}
          onMouseEnter={() => setShowEmoji(true)}
          onMouseLeave={() => setShowEmoji(false)}
        >
          {msg.content}
          {/* Reaction quick-pick */}
          <AnimatePresence>
            {showEmoji && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`absolute bottom-full ${isMe ? 'right-0' : 'left-0'} mb-1 flex gap-0.5 bg-white rounded-xl shadow-lg border border-cream-dark px-1.5 py-1 z-10`}
              >
                {QUICK_EMOJI.map(e => (
                  <button key={e} onClick={() => onReact(msg.id, e)} className="text-sm hover:scale-125 transition-transform">{e}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Reactions */}
        {Object.entries(msg.reactions).filter(([, users]) => users.length > 0).length > 0 && (
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {Object.entries(msg.reactions).filter(([, users]) => users.length > 0).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReact(msg.id, emoji)}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-cream border border-cream-dark text-[10px] hover:bg-lavender-light transition-colors"
              >
                {emoji} <span className="text-gray-500">{users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  socket: Socket | null;
  roomId: string | undefined;
}

export default function RoomChat({ socket, roomId }: Props) {
  const { user } = useAuth();
  const { messages, typingUsers, sendMessage, handleInputChange, sendReaction } = useRoomChat(socket, roomId);
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const submit = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
    setShowEmojiPicker(false);
  }, [input, sendMessage]);

  return (
    <div className="flex flex-col bg-white border-t border-cream-dark" style={{ height: '260px' }}>
      <div className="px-3 py-2 border-b border-cream-dark flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2 min-h-0">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} myId={user?.id} onReact={sendReaction} />
        ))}
        {messages.length === 0 && (
          <p className="text-[11px] text-gray-300 text-center mt-4">No messages yet. Say hi!</p>
        )}
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <div className="flex gap-0.5">
              {[0,1,2].map(i => (
                <motion.div key={i} animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                  className="w-1 h-1 rounded-full bg-gray-400" />
              ))}
            </div>
            {typingUsers.map(u => u.username).join(', ')} typing…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-cream-dark px-2 py-2 flex gap-1.5 items-end shrink-0">
        <div className="relative">
          <button onClick={() => setShowEmojiPicker(v => !v)}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-lavender-dark rounded-lg hover:bg-cream transition-colors">
            <Smile size={15} />
          </button>
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute bottom-full left-0 mb-1 bg-white rounded-2xl shadow-xl border border-cream-dark p-2 grid grid-cols-8 gap-0.5 z-10">
                {['😀','😂','🥰','😎','🤔','😮','😴','🥳','👍','❤️','🔥','✨','🎨','🎉','💜','🎯',
                  '🚀','💡','🌈','⭐','🎸','🌸','🦋','🐼'].map(e => (
                  <button key={e} onClick={() => { setInput(v => v + e); setShowEmojiPicker(false); }}
                    className="text-base hover:scale-125 transition-transform p-0.5">{e}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <textarea
          value={input}
          onChange={e => { setInput(e.target.value); handleInputChange(); }}
          onKeyDown={handleKeyDown}
          placeholder="Send a message…"
          rows={1}
          className="flex-1 resize-none text-xs px-3 py-2 rounded-xl border-2 border-cream-dark focus:border-lavender outline-none transition-colors text-gray-700 placeholder-gray-400 bg-cream"
          style={{ minHeight: 32, maxHeight: 80 }}
        />
        <motion.button whileTap={{ scale: 0.9 }} onClick={submit}
          disabled={!input.trim()}
          className="w-7 h-7 flex items-center justify-center rounded-xl bg-lavender text-white disabled:opacity-40 hover:bg-lavender-dark transition-colors shrink-0">
          <Send size={13} />
        </motion.button>
      </div>
    </div>
  );
}
