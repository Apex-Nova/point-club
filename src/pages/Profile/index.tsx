import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pencil, Users, Image, Calendar, Edit3, UserPlus, MessageSquare, Flag } from 'lucide-react';
import { getProfileByUsername, getUserAchievements, ACHIEVEMENTS, type FullProfile, type Achievement } from '@/lib/services/profile.service';
import { sendFriendRequest, reportContent } from '@/lib/services/social.service';
import { useAuth } from '@/contexts/AuthContext';
import FollowButton from '@/components/social/FollowButton';
import AchievementBadge from '@/components/social/AchievementBadge';
import PresenceIndicator from '@/components/social/PresenceIndicator';

function StatBox({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center">
      <p style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile,       setProfile]       = useState<FullProfile | null>(null);
  const [achievements,  setAchievements]  = useState<Achievement[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState<'drawings' | 'achievements' | 'activity'>('achievements');
  const [addedFriend,   setAddedFriend]   = useState(false);

  const isMe = user && profile && user.id === profile.id;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    Promise.all([
      getProfileByUsername(username),
    ]).then(([p]) => {
      setProfile(p);
      if (p) getUserAchievements(p.id).then(setAchievements);
      setLoading(false);
    });
  }, [username]);

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-lavender border-t-transparent animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">🎨</p>
        <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-700 mb-2">User Not Found</h1>
        <Link to="/discover" className="text-lavender-dark font-semibold hover:underline">Discover Artists</Link>
      </div>
    </div>
  );

  const gradients = ['from-lavender to-lavender-dark', 'from-coral to-coral-dark', 'from-mint to-emerald-400', 'from-sky to-blue-400'];
  const grad = gradients[profile.id.charCodeAt(0) % gradients.length];

  return (
    <div className="min-h-screen bg-cream">
      {/* Banner */}
      <div className={`h-40 bg-gradient-to-br ${grad} relative`}>
        {profile.banner_url && <img src={profile.banner_url} className="absolute inset-0 w-full h-full object-cover" alt="" />}
        <Link to="/" className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors text-sm font-medium">
          ← Point Club
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {/* Avatar + name row */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-6">
          <div className="w-24 h-24 rounded-3xl border-4 border-white shadow-lg overflow-hidden bg-lavender-light flex items-center justify-center shrink-0">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.username ?? ''} className="w-full h-full object-cover" />
              : <span style={{ fontFamily: 'var(--font-display)' }} className="text-3xl font-bold text-lavender-dark">
                  {(profile.username ?? 'U')[0].toUpperCase()}
                </span>
            }
          </div>
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-800">
                {profile.username ?? 'Anonymous'}
              </h1>
              <PresenceIndicator status="online" showLabel />
            </div>
            {profile.bio && <p className="text-gray-500 text-sm mt-1 max-w-md">{profile.bio}</p>}
          </div>
          <div className="flex gap-2 pb-1">
            {isMe ? (
              <Link to="/settings/profile">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lavender-light text-lavender-dark text-sm font-semibold hover:bg-lavender hover:text-white transition-colors">
                  <Edit3 size={14} /> Edit Profile
                </motion.button>
              </Link>
            ) : (
              <>
                <FollowButton targetId={profile.id} />
                {!addedFriend && (
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={async () => { await sendFriendRequest(profile.id); setAddedFriend(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cream border-2 border-cream-dark text-gray-600 text-sm font-semibold hover:border-lavender transition-colors">
                    <UserPlus size={14} /> Add Friend
                  </motion.button>
                )}
                <button onClick={() => reportContent(profile.id, 'user', 'inappropriate')}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-cream transition-colors" title="Report user">
                  <Flag size={15} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-5 gap-4 mb-8 bg-white rounded-2xl p-5 border border-cream-dark">
          <StatBox value={profile.total_drawings}  label="Drawings" />
          <StatBox value={profile.rooms_created}   label="Rooms" />
          <StatBox value={profile.follower_count}  label="Followers" />
          <StatBox value={profile.following_count} label="Following" />
          <StatBox value={achievements.length}     label="Badges" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-cream rounded-2xl p-1">
          {(['achievements', 'drawings', 'activity'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-colors capitalize ${
                activeTab === tab ? 'bg-white text-lavender-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'achievements' && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
              Earned Badges ({achievements.length}/{ACHIEVEMENTS.length})
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4 mb-8">
              {ACHIEVEMENTS.map(ach => {
                const earned = achievements.find(a => a.id === ach.id);
                return (
                  <div key={ach.id} className={earned ? 'opacity-100' : 'opacity-30 grayscale'}>
                    <AchievementBadge achievement={ach} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'drawings' && (
          <div className="text-center py-16 text-gray-400">
            <Image size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No public drawings yet</p>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="text-center py-16 text-gray-400">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
