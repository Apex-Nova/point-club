import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pencil, CheckCircle, AlertCircle } from 'lucide-react';
import { PLANS, getCurrentPlan, type PlanPeriod, type PlanTier } from '@/lib/services/payments.service';
import PricingCard from '@/components/monetization/PricingCard';
import { useAuth } from '@/contexts/AuthContext';

const FAQ = [
  { q: 'Can I cancel anytime?',          a: 'Yes. Cancel anytime from your subscription settings. You keep access until the end of your billing period.' },
  { q: 'What payment methods do you accept?', a: 'All major credit/debit cards via Stripe. Apple Pay and Google Pay coming soon.' },
  { q: 'Is there a free trial?',         a: 'The Free plan is yours forever. Paid plans will offer a 7-day trial when we launch billing.' },
  { q: 'Can I switch plans?',            a: 'Yes — upgrade or downgrade at any time. Prorated credits apply automatically.' },
  { q: 'Do you offer student discounts?',a: 'Yes! Students get 50% off Pro with a valid .edu email. Contact support.' },
];

export default function PricingPage() {
  const { user }  = useAuth();
  const [params]  = useSearchParams();
  const [period,  setPeriod]  = useState<PlanPeriod>('monthly');
  const [current, setCurrent] = useState<PlanTier>('free');

  const success  = params.get('success');
  const canceled = params.get('canceled');

  useEffect(() => {
    if (user) getCurrentPlan().then(p => setCurrent(p.tier));
  }, [user]);

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-cream-dark">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-lavender flex items-center justify-center">
              <Pencil size={13} className="text-white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-gray-800">Point Club</span>
          </Link>
          <div className="flex gap-3">
            {user
              ? <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-lavender-dark">Dashboard</Link>
              : <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-lavender-dark">Sign in</Link>
            }
          </div>
        </div>
      </header>

      {/* Success / cancel banners */}
      {success && (
        <div className="bg-mint/20 border-b border-emerald-200 px-6 py-3 flex items-center justify-center gap-2 text-sm text-emerald-700 font-semibold">
          <CheckCircle size={15} /> Welcome to Point Club Pro! Your subscription is active.
        </div>
      )}
      {canceled && (
        <div className="bg-peach/30 border-b border-orange-200 px-6 py-3 flex items-center justify-center gap-2 text-sm text-orange-600">
          <AlertCircle size={15} /> Checkout canceled — no charge made.
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-5xl font-black text-gray-800 mb-4">
            Create more.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lavender to-coral">Pay less.</span>
          </motion.h1>
          <p className="text-lg text-gray-500 mb-8">
            Start free. Upgrade when you're ready.
          </p>

          {/* Period toggle */}
          <div className="inline-flex bg-white border border-cream-dark rounded-2xl p-1 gap-1">
            {(['monthly', 'yearly'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${
                  period === p ? 'bg-lavender text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {p}
                {p === 'yearly' && <span className="ml-1.5 text-[10px] font-bold text-emerald-600 bg-mint/30 px-1.5 py-0.5 rounded-full">–30%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {PLANS.map((plan, i) => (
            <PricingCard key={plan.id} plan={plan} period={period} current={current === plan.id} index={i} />
          ))}
        </div>

        {/* Feature comparison (abbreviated) */}
        <div className="bg-white rounded-3xl border border-cream-dark p-8 mb-16">
          <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-800 mb-6 text-center">Compare Plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-dark">
                  <th className="text-left py-3 pr-4 text-gray-500 font-semibold">Feature</th>
                  {PLANS.map(p => <th key={p.id} className="text-center py-3 px-2 font-bold text-gray-700">{p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  ['AI Credits/month', '10', '100', '500', 'Unlimited'],
                  ['Storage',          '100MB', '5GB', '50GB', 'Unlimited'],
                  ['Drawings',         '20', 'Unlimited', 'Unlimited', 'Unlimited'],
                  ['Export formats',   'PNG', 'PNG, JPEG', '+SVG, PDF', '+PSD'],
                  ['Creator analytics','—', '—', '✓', '✓'],
                  ['Team workspaces',  '—', '—', '—', '✓'],
                  ['Priority support', '—', '—', '✓', '✓'],
                ].map(([feature, ...values]) => (
                  <tr key={feature} className="border-b border-cream-dark/50 hover:bg-cream/30">
                    <td className="py-3 pr-4 text-gray-600">{feature}</td>
                    {values.map((v, i) => (
                      <td key={i} className={`py-3 px-2 text-center font-medium ${v === '—' ? 'text-gray-300' : 'text-gray-700'}`}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-800 mb-6 text-center">FAQ</h2>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-cream-dark p-5">
                <p className="text-sm font-bold text-gray-700 mb-1.5">{item.q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
