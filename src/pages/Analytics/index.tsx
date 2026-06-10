import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Heart, Eye, Users, Star, DollarSign, Loader2 } from 'lucide-react';
import { getCreatorStats, type CreatorStats } from '@/lib/services/analytics.service';
import { getLevelTitle } from '@/lib/services/xp.service';
import { useAuth } from '@/contexts/AuthContext';

function Metric({ label, value, icon: Icon, color, suffix = '' }: {
  label: string; value: number | string; icon: React.ElementType; color: string; suffix?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-cream-dark p-5">
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon size={15} className="text-white" />
      </div>
      <p className="text-2xl font-black text-gray-800">
        {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const { user }   = useAuth();
  const [stats,    setStats]   = useState<CreatorStats | null>(null);
  const [loading,  setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getCreatorStats(user.id).then(s => { setStats(s); setLoading(false); });
  }, [user]);

  const tipsFormatted = stats ? `$${(stats.totalTipsReceived / 100).toFixed(2)}` : '$0.00';

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-cream-dark sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm font-medium">← Dashboard</Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-lavender flex items-center justify-center">
                <BarChart3 size={13} className="text-white" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-gray-800">Creator Analytics</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {!user ? (
          <div className="text-center py-20 text-gray-400">
            <BarChart3 size={36} className="mx-auto mb-3 opacity-30" />
            <p className="mb-3">Sign in to view your analytics</p>
            <Link to="/login" className="text-lavender-dark font-semibold hover:underline">Sign In →</Link>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="text-lavender-dark animate-spin" />
          </div>
        ) : stats && (
          <div className="space-y-8">
            {/* Overview */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <Metric label="Drawings"       value={stats.totalDrawings}   icon={BarChart3}   color="bg-lavender" />
                <Metric label="Public"         value={stats.publicDrawings}  icon={Eye}         color="bg-sky-400" />
                <Metric label="Total Likes"    value={stats.totalLikes}      icon={Heart}       color="bg-coral" />
                <Metric label="Total Views"    value={stats.totalViews}      icon={TrendingUp}  color="bg-mint-500 bg-emerald-500" />
                <Metric label="Followers"      value={stats.totalFollowers}  icon={Users}       color="bg-lavender-dark" />
                <Metric label="Tips Received"  value={tipsFormatted}         icon={DollarSign}  color="bg-peach/80 bg-orange-400" />
              </div>
            </div>

            {/* XP & Level */}
            <div className="bg-white rounded-2xl border border-cream-dark p-6">
              <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Star size={14} className="text-peach fill-peach" /> XP & Level Progress
              </h2>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-lavender to-coral flex items-center justify-center shrink-0">
                  <span className="text-2xl font-black text-white">{stats.level}</span>
                </div>
                <div className="flex-1">
                  <p style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-bold text-gray-800">
                    {getLevelTitle(stats.level)}
                  </p>
                  <p className="text-sm text-gray-500">{stats.xp.toLocaleString()} XP total</p>
                  <div className="mt-2 w-full h-2 rounded-full bg-cream-dark overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-lavender to-coral"
                      style={{ width: `${Math.round(((stats.xp % 100) / 100) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement */}
            <div className="bg-white rounded-2xl border border-cream-dark p-6">
              <h2 className="text-sm font-bold text-gray-700 mb-4">Engagement</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Challenges Completed', value: stats.challengesCompleted, max: 30 },
                  { label: 'Games Played',          value: stats.gamesPlayed,          max: 50 },
                ].map(({ label, value, max }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-bold text-gray-800">{value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-cream-dark overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full bg-lavender" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro upgrade prompt */}
            <div className="bg-gradient-to-r from-lavender-dark to-lavender rounded-2xl p-6 flex items-center justify-between">
              <div>
                <p className="text-white font-bold">Unlock deeper analytics</p>
                <p className="text-lavender-light text-sm mt-0.5">Audience demographics, retention, best posting times — Pro only.</p>
              </div>
              <Link to="/pricing">
                <motion.button whileHover={{ scale: 1.04 }}
                  className="px-5 py-2.5 rounded-xl bg-white text-lavender-dark font-bold text-sm hover:bg-cream transition-colors">
                  Upgrade →
                </motion.button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
