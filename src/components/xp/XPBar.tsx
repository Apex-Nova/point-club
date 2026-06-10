import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useXP } from '@/hooks/useXP';
import { getLevelTitle } from '@/lib/services/xp.service';

interface Props { compact?: boolean }

export default function XPBar({ compact = false }: Props) {
  const { xp, level, progress, loading } = useXP();
  if (loading) return null;

  const title = getLevelTitle(level);
  const pct   = Math.round(progress * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-lg bg-peach/40 flex items-center justify-center">
          <Star size={10} className="text-orange-500 fill-orange-400" />
        </div>
        <span className="text-xs font-bold text-gray-700">Lv.{level}</span>
        <div className="w-20 h-1.5 rounded-full bg-cream-dark overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-lavender to-coral"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-cream-dark p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-lavender to-coral flex items-center justify-center">
            <Star size={14} className="text-white fill-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Level {level} · {title}</p>
            <p className="text-xs text-gray-400">{xp.toLocaleString()} XP total</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-lavender-dark bg-lavender-light px-2 py-0.5 rounded-full">{pct}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-cream-dark overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-lavender to-coral"
        />
      </div>
    </div>
  );
}
