import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Copy, CheckCircle, Users, Star, ArrowRight, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function ReferralPage() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('referral_code').eq('id', user.id).single()
      .then(async ({ data }) => {
        const p = data as { referral_code: string | null } | null;
        if (p?.referral_code) {
          setReferralCode(p.referral_code);
        } else {
          // Generate code
          const code = user.id.slice(0, 8).toUpperCase();
          await supabase.from('profiles').update({ referral_code: code }).eq('id', user.id);
          setReferralCode(code);
        }
      });
    supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', user.id)
      .then(({ count }) => setReferralCount(count ?? 0));
  }, [user]);

  const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`;

  const copy = () => {
    navigator.clipboard?.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = () => {
    if (navigator.share) {
      void navigator.share({ title: 'Join Point Club!', text: 'Creative drawing platform with AI, games, and more!', url: referralUrl });
    } else {
      copy();
    }
  };

  const REWARDS = [
    { at: 1,  label: '1 invite',   reward: '+50 XP',         icon: '⭐' },
    { at: 3,  label: '3 invites',  reward: '+200 XP + Badge', icon: '🏅' },
    { at: 5,  label: '5 invites',  reward: '1 month Plus',   icon: '👑' },
    { at: 10, label: '10 invites', reward: '3 months Pro',   icon: '🚀' },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-cream-dark">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm font-medium">← Dashboard</Link>
          <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-gray-800">Referral Program</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-lavender-dark to-coral rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Gift size={28} className="text-white" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl font-black text-white mb-2">
              Give the Gift of Creativity
            </h1>
            <p className="text-white/80 mb-6">Invite friends to Point Club. You both earn rewards.</p>
            <div className="bg-white/10 rounded-2xl p-3 inline-flex items-center gap-3">
              <span className="text-white font-bold text-2xl">{referralCount}</span>
              <div className="text-left">
                <p className="text-white text-xs font-semibold">People invited</p>
                <p className="text-white/60 text-[10px]">Keep sharing to unlock more rewards</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Referral link */}
        {user ? (
          <div className="bg-white rounded-2xl border border-cream-dark p-6">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Your Referral Link</h2>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-cream rounded-xl border border-cream-dark px-4 py-2.5 overflow-hidden">
                <span className="text-xs text-gray-600 font-mono truncate">{referralUrl}</span>
              </div>
              <motion.button whileTap={{ scale: 0.93 }} onClick={copy}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${copied ? 'bg-mint/30 text-emerald-600' : 'bg-lavender text-white hover:bg-lavender-dark'}`}>
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </motion.button>
              <motion.button whileTap={{ scale: 0.93 }} onClick={shareUrl}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-coral text-white text-sm font-semibold hover:bg-coral-dark transition-colors">
                <Share2 size={14} /> Share
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="bg-lavender-light rounded-2xl p-6 text-center">
            <p className="text-sm font-bold text-lavender-dark mb-3">Sign in to get your referral link</p>
            <Link to="/login">
              <motion.button whileHover={{ scale: 1.03 }}
                className="px-5 py-2.5 rounded-xl bg-lavender text-white font-bold text-sm hover:bg-lavender-dark transition-colors">
                Sign In <ArrowRight size={14} className="inline ml-1" />
              </motion.button>
            </Link>
          </div>
        )}

        {/* Reward tiers */}
        <div className="bg-white rounded-2xl border border-cream-dark p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Reward Milestones</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {REWARDS.map(r => {
              const reached = referralCount >= r.at;
              return (
                <motion.div key={r.at} whileHover={{ scale: 1.03 }}
                  className={`rounded-2xl p-4 text-center border-2 transition-all ${reached ? 'border-lavender bg-lavender-light/30' : 'border-cream-dark'}`}>
                  <span className="text-3xl mb-2 block">{r.icon}</span>
                  <p className="text-[11px] font-bold text-gray-700">{r.label}</p>
                  <p className="text-[10px] text-lavender-dark font-semibold mt-0.5">{r.reward}</p>
                  {reached && <CheckCircle size={12} className="text-lavender-dark mx-auto mt-1" />}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-cream-dark p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4">How it Works</h2>
          <div className="space-y-3">
            {[
              { n: 1, icon: Share2, text: 'Share your unique referral link with friends' },
              { n: 2, icon: Users, text: 'Your friend signs up using your link' },
              { n: 3, icon: Star,  text: 'You both earn XP rewards immediately' },
              { n: 4, icon: Gift,  text: 'Unlock bigger rewards as you hit milestones' },
            ].map(({ n, icon: Icon, text }) => (
              <div key={n} className="flex items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-lavender-light flex items-center justify-center text-xs font-black text-lavender-dark shrink-0">{n}</div>
                <Icon size={14} className="text-lavender-dark shrink-0" />
                <p className="text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
