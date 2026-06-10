import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Zap, Users, Gift, TrendingUp, Award, ChevronRight, CheckCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToasts } from '@/drawing/hooks/useToasts';
import ToastContainer from '@/drawing/components/ToastContainer';
import Navbar from '@/components/layout/Navbar';

const TIERS = [
  {
    name: 'Advocate',   color: 'from-gray-400 to-gray-500',    textColor: 'text-gray-600',    bg: 'bg-gray-50',  border: 'border-gray-200',
    min: 0,    max: 4,  emoji: '🌱',
    perks: ['5% commission on referrals', 'Exclusive Ambassador badge', 'Early access to features', 'Monthly newsletter'],
  },
  {
    name: 'Creator',    color: 'from-blue-400 to-blue-600',    textColor: 'text-blue-600',    bg: 'bg-blue-50',  border: 'border-blue-200',
    min: 5,    max: 19, emoji: '⭐',
    perks: ['10% commission on referrals', 'Free Pro subscription', 'Creator spotlight feature', 'Priority support'],
  },
  {
    name: 'Champion',   color: 'from-purple-400 to-purple-600', textColor: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200',
    min: 20,   max: 49, emoji: '💫',
    perks: ['15% commission on referrals', 'Free Team subscription', 'Co-marketing opportunities', 'Quarterly bonus', 'Direct team access'],
  },
  {
    name: 'Legend',     color: 'from-amber-400 to-amber-600', textColor: 'text-amber-600',   bg: 'bg-amber-50',  border: 'border-amber-200',
    min: 50,   max: Infinity, emoji: '👑',
    perks: ['20% commission on referrals', 'Lifetime free subscription', '$500 signing bonus', 'Revenue share', 'Point Club equity discussion', 'Co-founder perks'],
  },
];

const RESOURCES = [
  { title: 'Ambassador Toolkit',      desc: 'Logos, banners, and brand assets',                     icon: '📦' },
  { title: 'Pitch Deck Template',     desc: 'Ready-to-use slides for pitching Point Club',           icon: '📊' },
  { title: 'Social Media Kit',        desc: 'Caption templates and hashtag guides',                  icon: '📱' },
  { title: 'Community Guidelines',    desc: 'How to represent Point Club authentically',             icon: '📋' },
  { title: 'Tutorial Library',        desc: 'Share these tutorials with your audience',              icon: '📚' },
  { title: 'Ambassador Slack Group',  desc: 'Connect with other ambassadors worldwide',              icon: '💬' },
];

export default function AmbassadorPage() {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToasts();
  const [referralCode,    setReferralCode]    = useState('');
  const [referralCount,   setReferralCount]   = useState(0);
  const [totalEarnings,   setTotalEarnings]   = useState(0);
  const [applied,         setApplied]         = useState(false);
  const [applying,        setApplying]        = useState(false);
  const [ambassadorStatus, setAmbassadorStatus] = useState<'none' | 'pending' | 'active'>('none');

  const currentTier = TIERS.find(t => referralCount >= t.min && referralCount <= t.max) ?? TIERS[0];
  const nextTier    = TIERS[TIERS.indexOf(currentTier) + 1];

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('referral_code, ambassador_status').eq('id', user.id).single()
      .then(({ data }) => {
        const p = data as { referral_code: string | null; ambassador_status: string | null } | null;
        if (p?.referral_code) setReferralCode(p.referral_code);
        if (p?.ambassador_status) setAmbassadorStatus(p.ambassador_status as 'pending' | 'active');
      });
    supabase.from('referrals').select('id').eq('referrer_id', user.id).eq('converted', true)
      .then(({ data }) => { setReferralCount((data ?? []).length); });
  }, [user]);

  const handleApply = async () => {
    if (!user) { addToast('Sign in to apply', 'error'); return; }
    setApplying(true);
    try {
      await supabase.from('ambassador_applications').insert({
        user_id: user.id, applied_at: new Date().toISOString(), status: 'pending',
      });
      setAmbassadorStatus('pending');
      setApplied(true);
      addToast('Application submitted! We\'ll review it within 48 hours.', 'success');
    } catch {
      addToast('Application failed — try again', 'error');
    } finally { setApplying(false); }
  };

  const shareUrl = `https://pointclub.app/?ref=${referralCode || 'demo'}`;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-amber-50 via-white to-lavender/10 border-b border-cream-dark">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Star size={16} className="text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Creator Ambassador Program</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">
            Grow Together.<br /><span className="text-lavender">Earn Together.</span>
          </h1>
          <p className="text-sm text-gray-500 max-w-lg mx-auto mb-6">
            Join Point Club's Ambassador Program. Share your passion for creative collaboration and earn commissions, perks, and exclusive rewards for every creator you bring in.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-white border border-cream-dark rounded-full px-4 py-2 text-xs">
              <Zap size={12} className="text-amber-500" /> Up to <strong>20% commission</strong>
            </div>
            <div className="flex items-center gap-2 bg-white border border-cream-dark rounded-full px-4 py-2 text-xs">
              <Gift size={12} className="text-lavender-dark" /> Free subscription perks
            </div>
            <div className="flex items-center gap-2 bg-white border border-cream-dark rounded-full px-4 py-2 text-xs">
              <Users size={12} className="text-emerald-600" /> 2,400+ ambassadors worldwide
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Status card */}
        {user && (
          <div className={`rounded-3xl border-2 p-6 ${currentTier.border} ${currentTier.bg}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{currentTier.emoji}</span>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Your Ambassador Tier</p>
                  <p className={`text-xl font-black ${currentTier.textColor}`}>{currentTier.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{referralCount} successful referrals</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-lg font-black text-gray-800">{referralCount}</p>
                  <p className="text-[10px] text-gray-400">Referrals</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-gray-800">${totalEarnings}</p>
                  <p className="text-[10px] text-gray-400">Earned</p>
                </div>
                {nextTier && (
                  <div className="text-center">
                    <p className="text-lg font-black text-gray-800">{nextTier.min - referralCount}</p>
                    <p className="text-[10px] text-gray-400">to {nextTier.name}</p>
                  </div>
                )}
              </div>
            </div>
            {nextTier && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                  <span>{currentTier.name}</span>
                  <span>{nextTier.name}</span>
                </div>
                <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ((referralCount - currentTier.min) / (nextTier.min - currentTier.min)) * 100)}%` }}
                    transition={{ duration: 1 }}
                    className={`h-full bg-gradient-to-r ${currentTier.color} rounded-full`} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Share link */}
        <div className="bg-white rounded-2xl border border-cream-dark p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <ExternalLink size={14} className="text-lavender-dark" /> Your Referral Link
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-xl bg-cream border border-cream-dark text-xs font-mono text-gray-600 truncate">
              {shareUrl}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(shareUrl); addToast('Link copied!', 'success'); }}
              className="px-3 py-2.5 bg-lavender text-white rounded-xl text-xs font-bold hover:bg-lavender-dark transition-colors whitespace-nowrap">
              Copy Link
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            {['Twitter/X', 'Instagram', 'YouTube', 'TikTok'].map(platform => (
              <button key={platform} className="px-2.5 py-1.5 bg-cream rounded-lg text-[10px] font-semibold text-gray-500 hover:bg-cream-dark transition-colors">
                {platform}
              </button>
            ))}
          </div>
        </div>

        {/* Tiers */}
        <div>
          <h2 className="text-lg font-black text-gray-800 mb-4">Ambassador Tiers</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TIERS.map(tier => (
              <motion.div key={tier.name} whileHover={{ y: -3 }}
                className={`rounded-2xl border-2 p-4 ${tier.border} ${tier.bg} ${tier.name === currentTier.name ? 'ring-2 ring-lavender ring-offset-1' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{tier.emoji}</span>
                  <p className={`text-sm font-black ${tier.textColor}`}>{tier.name}</p>
                  {tier.name === currentTier.name && <span className="text-[9px] font-bold bg-lavender text-white px-1.5 py-0.5 rounded-full">You</span>}
                </div>
                <p className="text-[10px] text-gray-400 mb-3">{tier.min === 0 ? '0' : tier.min}–{tier.max === Infinity ? '∞' : tier.max} referrals</p>
                <div className="space-y-1.5">
                  {tier.perks.map(perk => (
                    <div key={perk} className="flex items-start gap-1.5">
                      <CheckCircle size={9} className={`${tier.textColor} shrink-0 mt-0.5`} />
                      <span className="text-[10px] text-gray-600 leading-snug">{perk}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Apply CTA */}
        {ambassadorStatus === 'none' && !applied && (
          <div className="bg-gradient-to-br from-lavender to-lavender-dark rounded-3xl p-8 text-white text-center">
            <Award size={32} className="mx-auto mb-3 opacity-80" />
            <h2 className="text-xl font-black mb-2">Become an Official Ambassador</h2>
            <p className="text-sm text-white/80 max-w-md mx-auto mb-6">
              Apply to join the official program and unlock higher commissions, exclusive perks, and co-marketing opportunities.
            </p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => void handleApply()} disabled={applying}
              className="px-6 py-3 bg-white text-lavender-dark rounded-2xl text-sm font-black hover:bg-cream transition-colors disabled:opacity-60">
              {applying ? 'Submitting…' : 'Apply Now — It\'s Free'}
            </motion.button>
          </div>
        )}

        {(ambassadorStatus === 'pending' || applied) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="text-sm font-bold text-amber-800">Application Under Review</p>
              <p className="text-xs text-amber-600">We review applications within 48 hours. You'll receive an email confirmation.</p>
            </div>
          </div>
        )}

        {ambassadorStatus === 'active' && (
          <div className="bg-mint/20 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
            <CheckCircle size={24} className="text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-emerald-800">You're an Official Ambassador! 🎉</p>
              <p className="text-xs text-emerald-600">Your account is verified. Higher commissions and perks are now active.</p>
            </div>
          </div>
        )}

        {/* Resources */}
        <div>
          <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
            <Gift size={16} className="text-lavender-dark" /> Ambassador Resources
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {RESOURCES.map(r => (
              <button key={r.title}
                className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-cream-dark text-left hover:border-lavender/40 hover:shadow-sm transition-all group">
                <span className="text-2xl">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-700 group-hover:text-lavender-dark transition-colors">{r.title}</p>
                  <p className="text-[10px] text-gray-400">{r.desc}</p>
                </div>
                <ChevronRight size={12} className="text-gray-300 group-hover:text-lavender transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl border border-cream-dark p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-lavender-dark" /> Program Stats
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Ambassadors', value: '2,412' },
              { label: 'Referrals This Month', value: '8,847' },
              { label: 'Commissions Paid', value: '$124,500' },
              { label: 'Countries', value: '73' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-black text-gray-800">{s.value}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
