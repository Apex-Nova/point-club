import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, MessageSquare } from 'lucide-react';
import type { Community } from '@/lib/services/communities.service';

const CAT_COLOR: Record<string, string> = {
  gaming:       'from-coral/30 to-coral/10',
  design:       'from-lavender/30 to-lavender/10',
  art:          'from-peach/30 to-peach/10',
  architecture: 'from-sky/30 to-sky/10',
  business:     'from-mint/30 to-mint/10',
  practice:     'from-lavender-dark/20 to-lavender/10',
  general:      'from-cream-dark to-cream',
};

interface Props {
  community: Community;
  index?:   number;
}

export default function CommunityCard({ community, index = 0 }: Props) {
  const grad = CAT_COLOR[community.category] ?? CAT_COLOR.general;

  return (
    <Link to={`/communities/${community.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -3 }}
        className="bg-white rounded-2xl border border-cream-dark overflow-hidden hover:shadow-lg transition-shadow"
      >
        {/* Banner */}
        <div className={`h-16 bg-gradient-to-br ${grad} relative`}>
          {community.banner_url && (
            <img src={community.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
        </div>

        {/* Avatar + info */}
        <div className="px-4 pb-4 -mt-6">
          <div className="w-12 h-12 rounded-2xl border-4 border-white shadow bg-lavender-light flex items-center justify-center mb-3">
            {community.avatar_url
              ? <img src={community.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
              : <span className="text-xl">{community.name[0]}</span>
            }
          </div>
          <h3 className="text-sm font-bold text-gray-800 truncate">{community.name}</h3>
          {community.description && (
            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-snug">{community.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2.5 text-[10px] text-gray-400">
            <span className="flex items-center gap-1"><Users size={9} /> {community.member_count.toLocaleString()}</span>
            <span className="flex items-center gap-1"><MessageSquare size={9} /> {community.post_count}</span>
            <span className="ml-auto capitalize text-[9px] font-semibold text-lavender-dark bg-lavender-light px-1.5 py-0.5 rounded-full">
              {community.category}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
