import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, LogIn, Gamepad2, Loader2, ChevronDown } from 'lucide-react';

interface Props {
  onCreateRoom: () => Promise<void>;
  onJoinRoom:   (code: string) => void;
  onScribble:   () => void;
}

export default function ConnectMenu({ onCreateRoom, onJoinRoom, onScribble }: Props) {
  const [open,     setOpen]     = useState(false);
  const [joining,  setJoining]  = useState(false);
  const [code,     setCode]     = useState('');
  const [creating, setCreating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setJoining(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try { await onCreateRoom(); }
    finally { setCreating(false); setOpen(false); }
  };

  const handleJoin = () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    onJoinRoom(trimmed);
    setCode('');
    setOpen(false);
    setJoining(false);
  };

  return (
    <div ref={menuRef} className="relative shrink-0">
      {/* Trigger */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => { setOpen(v => !v); setJoining(false); }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
        style={{ background: open ? '#3451d1' : '#4361ee' }}
      >
        <Users size={13} />
        Connect
        <ChevronDown size={11} style={{ transform: open ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.95, y: -4  }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl overflow-hidden"
            style={{
              background: '#fff',
              boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #eee',
              zIndex: 200,
            }}
          >
            {/* Header */}
            <div className="px-3 py-2.5 border-b" style={{ borderColor: '#f0f0f0', background: '#fafafa' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Multiplayer</p>
            </div>

            {/* Create Room */}
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#4361ee18' }}>
                {creating
                  ? <Loader2 size={13} className="text-blue-500 animate-spin" />
                  : <Plus size={13} className="text-blue-500" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700">Draw Together</p>
                <p className="text-[10px] text-gray-400">Create a live room</p>
              </div>
            </button>

            {/* Join Room */}
            {!joining ? (
              <button
                onClick={() => setJoining(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: '#52b78818' }}>
                  <LogIn size={13} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700">Join Room</p>
                  <p className="text-[10px] text-gray-400">Enter a room code</p>
                </div>
              </button>
            ) : (
              <div className="px-3 py-2.5">
                <div className="flex gap-1.5">
                  <input
                    autoFocus
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === 'Enter') handleJoin(); if (e.key === 'Escape') setJoining(false); }}
                    placeholder="Room code…"
                    maxLength={36}
                    className="flex-1 px-2.5 py-1.5 rounded-xl border text-xs outline-none font-mono"
                    style={{ borderColor: '#ddd', background: '#f8f8f8' }}
                  />
                  <button
                    onClick={handleJoin}
                    disabled={!code.trim()}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-40"
                    style={{ background: '#52b788' }}
                  >
                    Go
                  </button>
                </div>
              </div>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: '#f0f0f0', margin: '0 12px' }} />

            {/* Scribble Game */}
            <button
              onClick={() => { onScribble(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-yellow-50 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#f9c74f22' }}>
                <Gamepad2 size={13} className="text-yellow-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700">Scribble Game</p>
                <p className="text-[10px] text-gray-400">Draw & guess with friends</p>
              </div>
            </button>

            <div className="px-3 py-2" style={{ background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
              <p className="text-[9px] text-gray-300 text-center">
                Rooms sync in real-time via WebSocket
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
