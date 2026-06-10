import { motion } from 'framer-motion';
import type { Achievement } from '@/lib/services/profile.service';

interface Props {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
}

const SIZE = { sm: 'w-8 h-8 text-lg', md: 'w-12 h-12 text-2xl', lg: 'w-16 h-16 text-3xl' };

export default function AchievementBadge({ achievement, size = 'md', showTitle = true }: Props) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className="flex flex-col items-center gap-1 cursor-default"
      title={achievement.description}
    >
      <div className={`${SIZE[size]} rounded-2xl bg-lavender-light flex items-center justify-center shadow-sm`}>
        {achievement.icon}
      </div>
      {showTitle && (
        <span className="text-[10px] text-gray-500 font-medium text-center leading-tight max-w-[60px] truncate">
          {achievement.title}
        </span>
      )}
    </motion.div>
  );
}
