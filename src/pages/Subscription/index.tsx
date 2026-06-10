import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, CheckCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { getCurrentPlan, cancelSubscription, openPortal, PLANS, type PlanTier } from '@/lib/services/payments.service';
import { useAuth } from '@/contexts/AuthContext';

export default function SubscriptionPage() {
  const { user }  = useAuth();
  const [params]  = useSearchParams();
  const [tier,    setTier]    = useState<PlanTier>('free');
  const [status,  setStatus]  = useState('inactive');
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  const success = params.get('success');
  const plan    = PLANS.find(p => p.id === tier);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getCurrentPlan().then(p => {
      setTier(p.tier);
      setStatus(p.status);
      setPeriodEnd(p.periodEnd);
      setLoading(false);
    });
  }, [user]);

  const handlePortal = async () => {
    const url = await openPortal();
    if (url) window.open(url, '_blank');
  };

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You keep access until the end of your billing period.')) return;
    setCanceling(true);
    await cancelSubscription();
    setStatus('canceled');
    setCanceling(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <Loader2 size={24} className="text-lavender-dark animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-cream-dark">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm font-medium">← Dashboard</Link>
          <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-gray-800">Subscription</span>
        </div>
      </header>

      {success && (
        <div className="bg-mint/20 border-b border-emerald-200 px-6 py-3 flex items-center justify-center gap-2 text-sm text-emerald-700 font-semibold">
          <CheckCircle size={15} /> Subscription activated! Welcome to {params.get('plan')} plan.
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
        {/* Current plan card */}
        <div className="bg-white rounded-3xl border border-cream-dark p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan?.color ?? 'from-gray-300 to-gray-400'} flex items-center justify-center`}>
              <Crown size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-black text-gray-800">{plan?.name ?? 'Free'} Plan</p>
              <p className="text-sm text-gray-400 capitalize">{status}</p>
            </div>
            <div className="ml-auto">
              {status === 'active' && (
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-mint/30 text-emerald-600">Active</span>
              )}
              {status === 'canceled' && (
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-coral/20 text-coral-dark">Canceled</span>
              )}
            </div>
          </div>

          {periodEnd && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 bg-cream rounded-xl px-4 py-2.5">
              {status === 'canceled'
                ? <><AlertCircle size={14} className="text-coral shrink-0" /> Access ends {new Date(periodEnd).toLocaleDateString()}</>
                : <><CheckCircle size={14} className="text-emerald-500 shrink-0" /> Renews {new Date(periodEnd).toLocaleDateString()}</>
              }
            </div>
          )}

          {plan && plan.id !== 'free' && (
            <ul className="space-y-2 mb-6">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle size={13} className="text-emerald-500 shrink-0" /> {f}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {tier !== 'free' && (
              <motion.button whileHover={{ scale: 1.02 }} onClick={handlePortal}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 border-cream-dark text-sm font-semibold text-gray-600 hover:border-lavender transition-colors">
                <ExternalLink size={13} /> Manage Billing
              </motion.button>
            )}
            <Link to="/pricing" className="flex-1 sm:flex-none">
              <motion.button whileHover={{ scale: 1.02 }}
                className={`w-full px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  tier === 'free'
                    ? 'bg-lavender text-white hover:bg-lavender-dark'
                    : 'bg-cream text-gray-600 hover:bg-cream-dark'
                }`}>
                {tier === 'free' ? '⚡ Upgrade Plan' : 'Change Plan'}
              </motion.button>
            </Link>
            {tier !== 'free' && status === 'active' && (
              <motion.button whileHover={{ scale: 1.02 }} onClick={handleCancel} disabled={canceling}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-coral-dark hover:bg-coral/10 transition-colors disabled:opacity-60">
                {canceling ? 'Canceling…' : 'Cancel Subscription'}
              </motion.button>
            )}
          </div>
        </div>

        {/* Plan comparison quick link */}
        {tier === 'free' && (
          <div className="bg-gradient-to-r from-lavender-dark to-lavender rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-white font-bold">Unlock the full Point Club experience</p>
              <p className="text-lavender-light text-sm mt-0.5">Starting at $4.99/month</p>
            </div>
            <Link to="/pricing">
              <motion.button whileHover={{ scale: 1.04 }}
                className="px-5 py-2.5 rounded-xl bg-white text-lavender-dark font-bold text-sm hover:bg-cream transition-colors">
                See Plans →
              </motion.button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
