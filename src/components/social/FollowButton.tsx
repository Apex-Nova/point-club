import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, UserCheck } from 'lucide-react';
import { followUser, unfollowUser, isFollowing } from '@/lib/services/social.service';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  targetId: string;
  initialFollowing?: boolean;
  size?: 'sm' | 'md';
}

export default function FollowButton({ targetId, initialFollowing, size = 'md' }: Props) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(initialFollowing ?? false);
  const [loading,   setLoading]   = useState(initialFollowing === undefined);

  useEffect(() => {
    if (initialFollowing !== undefined || !user || user.id === targetId) { setLoading(false); return; }
    isFollowing(targetId).then(r => { setFollowing(r); setLoading(false); });
  }, [targetId, user, initialFollowing]);

  if (!user || user.id === targetId) return null;

  const toggle = async () => {
    setLoading(true);
    try {
      if (following) { await unfollowUser(targetId); setFollowing(false); }
      else           { await followUser(targetId);   setFollowing(true); }
    } finally {
      setLoading(false);
    }
  };

  const sm = size === 'sm';
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 rounded-xl font-semibold transition-colors disabled:opacity-50
        ${sm ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
        ${following
          ? 'bg-cream border-2 border-cream-dark text-gray-600 hover:border-coral hover:text-coral-dark'
          : 'bg-lavender text-white hover:bg-lavender-dark'
        }`}
    >
      {following ? <UserCheck size={sm ? 12 : 15} /> : <UserPlus size={sm ? 12 : 15} />}
      {following ? 'Following' : 'Follow'}
    </motion.button>
  );
}
