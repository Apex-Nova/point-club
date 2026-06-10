import { motion } from 'framer-motion';
import { Check, Crown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { Plan, PlanPeriod } from '@/lib/services/payments.service';
import { createCheckout } from '@/lib/services/payments.service';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Props {
  plan:      Plan;
  period:    PlanPeriod;
  current?:  boolean;
  index?:    number;
}

export default function PricingCard({ plan, period, current, index = 0 }: Props) {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [loading, setLoading] = useState(false);

  const price = period === 'yearly' ? plan.price_yr : plan.price_mo * 12 * (period === 'yearly' ? 1 : 0) || plan.price_mo;
  const perMonth = period === 'yearly' ? Math.round(plan.price_yr / 12) : plan.price_mo;
  const savings   = period === 'yearly' ? Math.round(100 - (plan.price_yr / (plan.price_mo * 12)) * 100) : 0;

  const handleUpgrade = async () => {
    if (plan.id === 'free') return;
    if (!user) { navigate('/login?next=/pricing'); return; }
    setLoading(true);
    try {
      const url = await createCheckout(plan.id, period);
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`relative bg-white rounded-3xl border-2 p-7 flex flex-col ${
        plan.popular ? 'border-coral shadow-xl shadow-coral/10' : 'border-cream-dark'
      } ${current ? 'ring-2 ring-lavender ring-offset-2' : ''}`}
    >
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-coral text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <Crown size={10} /> Most Popular
        </div>
      )}

      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
        <Crown size={18} className="text-white" />
      </div>

      <p style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-bold text-gray-800 mb-0.5">{plan.name}</p>
      <p className="text-xs text-gray-400 mb-4">{plan.tagline}</p>

      <div className="mb-6">
        {plan.price_mo === 0 ? (
          <p className="text-3xl font-black text-gray-800">Free</p>
        ) : (
          <div>
            <span className="text-3xl font-black text-gray-800">
              ${(perMonth / 100).toFixed(2)}
            </span>
            <span className="text-sm text-gray-400">/mo</span>
            {savings > 0 && (
              <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-mint/30 px-2 py-0.5 rounded-full">
                Save {savings}%
              </span>
            )}
            {period === 'yearly' && (
              <p className="text-xs text-gray-400 mt-0.5">
                Billed ${(plan.price_yr / 100).toFixed(2)}/year
              </p>
            )}
          </div>
        )}
      </div>

      <ul className="space-y-2.5 flex-1 mb-6">
        {plan.features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      {current ? (
        <div className="w-full py-2.5 rounded-2xl bg-lavender-light text-lavender-dark text-sm font-bold text-center">
          Current Plan ✓
        </div>
      ) : plan.price_mo === 0 ? (
        <div className="w-full py-2.5 rounded-2xl bg-cream text-gray-500 text-sm font-semibold text-center">
          Get Started Free
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleUpgrade}
          disabled={loading}
          className={`w-full py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-opacity disabled:opacity-70 bg-gradient-to-r ${plan.color} hover:opacity-90 shadow-md`}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Crown size={15} />}
          {loading ? 'Redirecting…' : `Upgrade to ${plan.name}`}
        </motion.button>
      )}
    </motion.div>
  );
}
