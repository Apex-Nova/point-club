import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X, Check } from 'lucide-react';
import { useState } from 'react';
import { createCheckout, PLANS } from '@/lib/services/payments.service';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Props {
  open:       boolean;
  onClose:    () => void;
  feature?:   string;
  targetPlan?: 'plus' | 'pro' | 'team';
}

export default function UpgradeModal({ open, onClose, feature, targetPlan = 'pro' }: Props) {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [loading, setLoading] = useState(false);
  const plan = PLANS.find(p => p.id === targetPlan) ?? PLANS[2];

  const handleUpgrade = async () => {
    if (!user) { navigate('/login?next=/pricing'); return; }
    setLoading(true);
    try {
      const url = await createCheckout(plan.id as never, 'monthly');
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && onClose()}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>

            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mx-auto mb-5`}>
              <Crown size={24} className="text-white" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)' }}
              className="text-2xl font-bold text-gray-800 text-center mb-1">Upgrade to {plan.name}</h2>
            {feature && <p className="text-sm text-gray-500 text-center mb-4">Unlock: <strong>{feature}</strong></p>}

            <ul className="space-y-2 mb-6">
              {plan.features.slice(0, 5).map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={13} className="text-emerald-500 shrink-0" /> {f}
                </li>
              ))}
            </ul>

            <div className="text-center mb-4">
              <span className="text-2xl font-black text-gray-800">${(plan.price_mo / 100).toFixed(2)}</span>
              <span className="text-sm text-gray-400">/month</span>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleUpgrade}
              disabled={loading}
              className={`w-full py-3 rounded-2xl text-white font-bold bg-gradient-to-r ${plan.color} hover:opacity-90 disabled:opacity-60 transition-opacity`}>
              {loading ? 'Redirecting…' : `Upgrade Now`}
            </motion.button>
            <button onClick={onClose} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3 py-1">
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
