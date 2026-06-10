import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Loader2, X } from 'lucide-react';
import { sendTip } from '@/lib/services/payments.service';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToasts } from '@/drawing/hooks/useToasts';

const AMOUNTS = [
  { label: '☕ $1',  cents: 100 },
  { label: '🎨 $3',  cents: 300 },
  { label: '🚀 $5',  cents: 500 },
  { label: '💜 $10', cents: 1000 },
];

interface Props {
  recipientId:   string;
  recipientName: string;
}

export default function TipJar({ recipientId, recipientName }: Props) {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const { addToast } = useToasts();
  const [open,     setOpen]     = useState(false);
  const [amount,   setAmount]   = useState(300);
  const [message,  setMessage]  = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSend = async () => {
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    try {
      await sendTip(recipientId, amount, message.trim() || undefined);
      addToast(`Tip sent to ${recipientName}! 💜`, 'success');
      setOpen(false);
      setMessage('');
    } catch {
      addToast('Failed to send tip', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-peach/30 text-orange-600 text-sm font-semibold hover:bg-peach/50 transition-colors"
      >
        <Heart size={14} className="fill-orange-400" /> Support
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-7 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)' }} className="text-lg font-bold text-gray-800">Support {recipientName}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">100% goes to the creator</p>
                </div>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              {/* Amount selection */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {AMOUNTS.map(a => (
                  <motion.button key={a.cents} whileTap={{ scale: 0.93 }}
                    onClick={() => setAmount(a.cents)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      amount === a.cents ? 'bg-lavender text-white' : 'bg-cream text-gray-600 hover:bg-cream-dark'
                    }`}>
                    {a.label}
                  </motion.button>
                ))}
              </div>

              {/* Message */}
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={`Say something nice to ${recipientName}…`}
                rows={2}
                className="w-full text-sm px-3 py-2.5 rounded-xl border-2 border-cream-dark focus:border-lavender outline-none resize-none text-gray-700 placeholder-gray-400 mb-4"
              />

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleSend}
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-peach to-coral text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Heart size={15} className="fill-white" />}
                {loading ? 'Sending…' : `Send $${(amount / 100).toFixed(2)} Tip`}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
