import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, Star, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTodaysChallenge, hasCompletedToday, type DailyChallenge as Challenge } from '@/lib/services/challenges.service';
import { useAuth } from '@/contexts/AuthContext';

const DIFF_COLOR: Record<string, string> = {
  easy:   'bg-mint/30 text-emerald-600',
  medium: 'bg-peach/40 text-orange-500',
  hard:   'bg-coral/20 text-coral-dark',
  expert: 'bg-lavender-light text-lavender-dark',
};

interface Props { compact?: boolean }

export default function DailyChallengeWidget({ compact = false }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challenge,  setChallenge]  = useState<Challenge | null>(null);
  const [completed,  setCompleted]  = useState(false);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    getTodaysChallenge().then(async c => {
      setChallenge(c);
      if (user) setCompleted(await hasCompletedToday(c.id));
      setLoading(false);
    });
  }, [user]);

  if (loading) return (
    <div className="bg-white rounded-2xl border border-cream-dark p-4 flex items-center justify-center h-24">
      <Loader2 size={18} className="text-lavender-dark animate-spin" />
    </div>
  );

  if (!challenge) return null;

  if (compact) return (
    <motion.div whileHover={{ scale: 1.02 }} onClick={() => navigate('/challenges')}
      className="bg-gradient-to-br from-lavender-light to-peach/20 rounded-2xl border border-cream-dark p-3 cursor-pointer flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-lavender flex items-center justify-center shrink-0">
        <Zap size={14} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-lavender-dark">Daily Challenge</p>
        <p className="text-xs font-semibold text-gray-700 truncate">{challenge.prompt}</p>
      </div>
      {completed && <CheckCircle size={16} className="text-emerald-500 shrink-0" />}
    </motion.div>
  );

  return (
    <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden">
      <div className="bg-gradient-to-r from-lavender-dark to-lavender px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-white" />
          <span className="text-xs font-bold text-white">Daily Challenge</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-lavender-light">
          <Clock size={10} />
          Resets midnight
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <p style={{ fontFamily: 'var(--font-display)' }}
            className="text-lg font-bold text-gray-800 leading-snug">{challenge.prompt}</p>
          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${DIFF_COLOR[challenge.difficulty]}`}>
            {challenge.difficulty}
          </span>
        </div>

        {challenge.theme && (
          <p className="text-xs text-gray-400 mb-3">Theme: <span className="text-gray-600 font-medium">{challenge.theme}</span></p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-orange-500 font-semibold">
            <Star size={12} className="fill-orange-400" />
            +{challenge.xp_reward} XP
          </div>

          {completed ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <CheckCircle size={13} /> Completed!
            </div>
          ) : (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/challenges')}
              className="px-4 py-1.5 rounded-xl bg-lavender text-white text-xs font-semibold hover:bg-lavender-dark transition-colors">
              Start Drawing
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
