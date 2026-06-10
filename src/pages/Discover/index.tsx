import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Pencil, Users, Shuffle, ArrowRight, Sparkles } from 'lucide-react';
import { getDiscoverProfiles } from '@/lib/services/social.service';
import { useAuth } from '@/contexts/AuthContext';
import FollowButton from '@/components/social/FollowButton';
import MatchmakingModal from '@/components/social/MatchmakingModal';
import { createRoom } from '@/lib/services/rooms.service';

interface DiscoverProfile {
  id:             string;
  username:       string | null;
  avatar_url:     string | null;
  bio:            string | null;
  follower_count: number;
  total_drawings: number;
}

const GRADIENTS = [
  { from: '#8b78e0', to: '#b8a9f0' },
  { from: '#f27059', to: '#f9c784' },
  { from: '#7dd3b2', to: '#87c5e8' },
  { from: '#87c5e8', to: '#b8a9f0' },
  { from: '#f9c784', to: '#f27059' },
];

function ArtistCard({ profile, index }: { profile: DiscoverProfile; index: number }) {
  const g = GRADIENTS[index % GRADIENTS.length];
  const initial = (profile.username ?? 'U')[0].toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgb(0_0_0/0.07)] hover:shadow-[0_10px_30px_rgb(0_0_0/0.12)] transition-all duration-300 border border-[rgba(0,0,0,0.05)] group"
    >
      {/* Banner */}
      <div
        className="h-24 w-full relative"
        style={{ background: `linear-gradient(135deg, ${g.from} 0%, ${g.to} 100%)` }}
      >
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <circle cx="80%" cy="30%" r="30" fill="white" opacity="0.3" />
            <circle cx="20%" cy="80%" r="18" fill="white" opacity="0.2" />
          </svg>
        </div>
      </div>

      <div className="px-4 pb-5 -mt-8">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-2xl border-[3px] border-white shadow-[0_4px_12px_rgb(0_0_0/0.12)] overflow-hidden mb-3"
          style={{ background: `linear-gradient(135deg, ${g.from}30, ${g.to}30)` }}
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username ?? ''} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-xl font-black"
              style={{ color: g.from }}
            >
              {initial}
            </div>
          )}
        </div>

        <Link to={`/profile/${profile.username}`}>
          <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-lavender-dark transition-colors">
            {profile.username ?? 'Anonymous'}
          </h3>
        </Link>

        {profile.bio && (
          <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{profile.bio}</p>
        )}

        <div className="flex items-center justify-between mt-3.5">
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Users size={10} /> <span className="tabular-nums">{profile.follower_count ?? 0}</span>
            </span>
            <span className="flex items-center gap-1">
              <Pencil size={10} /> <span className="tabular-nums">{profile.total_drawings ?? 0}</span>
            </span>
          </div>
          <FollowButton targetId={profile.id} size="sm" />
        </div>
      </div>
    </motion.div>
  );
}

function ArtistSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-cream-dark animate-pulse">
      <div className="h-24 bg-cream-dark" />
      <div className="px-4 pb-5 -mt-8">
        <div className="w-16 h-16 rounded-2xl bg-cream-dark mb-3 border-[3px] border-white" />
        <div className="h-3 bg-cream-dark rounded-full w-3/4 mb-2" />
        <div className="h-2.5 bg-cream-dark rounded-full w-full mb-1" />
        <div className="h-2.5 bg-cream-dark rounded-full w-2/3" />
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [profiles,  setProfiles]  = useState<DiscoverProfile[]>([]);
  const [query,     setQuery]     = useState('');
  const [loading,   setLoading]   = useState(true);
  const [matchOpen, setMatchOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    getDiscoverProfiles(20).then(data => {
      setProfiles(data as unknown as DiscoverProfile[]);
      setLoading(false);
    });
  }, []);

  const filtered = query
    ? profiles.filter(p => p.username?.toLowerCase().includes(query.toLowerCase()))
    : profiles;

  const handleQuickRoom = async () => {
    try {
      const { roomId } = await createRoom({ userId: user?.id, name: 'Open Studio' });
      navigate(`/room/${roomId}`);
    } catch { /* backend not running */ }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Sticky header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-cream-dark sticky top-0 z-20 shadow-[0_1px_0_rgb(0_0_0/0.05),0_2px_8px_rgb(0_0_0/0.05)]">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-lavender flex items-center justify-center shadow-sm">
              <Pencil size={13} className="text-white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-gray-900 hidden sm:block">
              Point Club
            </span>
          </Link>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search creators…"
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl border-2 border-cream-dark bg-cream focus:bg-white focus:border-lavender outline-none text-sm text-gray-700 placeholder-gray-400 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setMatchOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-coral text-white text-sm font-semibold hover:bg-coral-dark transition-colors shadow-[0_2px_8px_rgb(242_112_89/0.35)]"
            >
              <Shuffle size={14} />
              <span className="hidden sm:inline">Find Partner</span>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl mb-12"
          style={{
            background: 'linear-gradient(135deg, #6b57c8 0%, #8b78e0 50%, #b8a9f0 100%)',
            boxShadow: '0 16px 48px rgb(107 87 200 / 0.3)',
          }}
        >
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/8" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-coral/20" />

          <div className="relative z-10 px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-white/70" />
                <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Creative Studio</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-white mb-1">
                Ready to create?
              </h2>
              <p className="text-lavender-light/90 text-sm">
                Jump into a room or find a creative partner instantly.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleQuickRoom}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-lavender-dark font-bold text-sm hover:bg-cream transition-colors shadow-[0_4px_16px_rgb(0_0_0/0.2)]"
              >
                <Pencil size={14} /> Open Studio <ArrowRight size={13} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Section heading */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-900">
              {query ? `Results for "${query}"` : 'Discover Creators'}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {loading ? 'Loading…' : `${filtered.length} creative minds`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => <ArtistSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="w-16 h-16 bg-cream rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="opacity-40" />
            </div>
            <p className="font-medium text-gray-500 mb-1">No creators found</p>
            <p className="text-sm">{query ? `No results for "${query}"` : 'Check back soon!'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {filtered.map((p, i) => <ArtistCard key={p.id} profile={p} index={i} />)}
          </div>
        )}
      </div>

      <MatchmakingModal open={matchOpen} onClose={() => setMatchOpen(false)} />
    </div>
  );
}
