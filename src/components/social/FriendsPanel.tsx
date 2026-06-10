import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, UserCheck, X, ChevronDown, ChevronUp,
  Pencil, DoorOpen, MessageSquare, UserMinus, Check,
} from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import PresenceIndicator from './PresenceIndicator';
import type { FriendRelation } from '@/lib/services/social.service';
import { useAuth } from '@/contexts/AuthContext';

function FriendCard({ rel, myId, onAccept, onReject, onRemove }: {
  rel: FriendRelation;
  myId: string;
  onAccept?: (id: string, requesterId: string) => void;
  onReject?: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  const navigate = useNavigate();
  const isPending = rel.status === 'pending';

  const isRequester = rel.requester_id === myId;
  // For accepted: show the OTHER person
  const other = isRequester
    ? (rel as unknown as { addressee: { username: string | null; avatar_url: string | null } }).addressee
    : (rel as unknown as { requester: { username: string | null; avatar_url: string | null } }).requester;
  const otherName = other?.username ?? 'User';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-cream transition-colors group"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-8 h-8 rounded-full bg-lavender-light flex items-center justify-center text-sm font-bold text-lavender-dark overflow-hidden">
          {other?.avatar_url
            ? <img src={other.avatar_url} alt={otherName} className="w-full h-full object-cover" />
            : otherName[0]?.toUpperCase()
          }
        </div>
        {!isPending && (
          <div className="absolute -bottom-0.5 -right-0.5">
            <PresenceIndicator status="online" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-700 truncate">{otherName}</p>
        {isPending && !isRequester && (
          <p className="text-[10px] text-lavender-dark">Wants to be friends</p>
        )}
        {isPending && isRequester && (
          <p className="text-[10px] text-gray-400">Request sent</p>
        )}
      </div>

      {/* Actions */}
      {isPending && !isRequester ? (
        <div className="flex gap-1">
          <button onClick={() => onAccept?.(rel.id, rel.requester_id)}
            className="w-6 h-6 flex items-center justify-center rounded-lg bg-mint/30 text-emerald-600 hover:bg-mint/50 transition-colors">
            <Check size={11} />
          </button>
          <button onClick={() => onReject?.(rel.id)}
            className="w-6 h-6 flex items-center justify-center rounded-lg bg-coral/20 text-coral-dark hover:bg-coral/30 transition-colors">
            <X size={11} />
          </button>
        </div>
      ) : (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => navigate(`/profile/${otherName}`)} title="View Profile"
            className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-lavender-light hover:text-lavender-dark transition-colors">
            <UserCheck size={11} />
          </button>
          <button title="Message (Phase 6)" onClick={() => navigate('/messages')}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-lavender-light hover:text-lavender-dark transition-colors">
            <MessageSquare size={11} />
          </button>
          {onRemove && (
            <button onClick={() => onRemove(rel.id)} title="Remove Friend"
              className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-coral/20 hover:text-coral-dark transition-colors">
              <UserMinus size={11} />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function FriendsPanel() {
  const { user }  = useAuth();
  const { friends, pending, loading, acceptRequest, rejectRequest, removeFriendById } = useFriends();
  const [open, setOpen] = useState(true);

  if (!user) return null;

  const hasPending = pending.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-cream transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users size={15} className="text-lavender-dark" />
          <span className="text-sm font-bold text-gray-700">Friends</span>
          {hasPending && (
            <span className="w-4 h-4 rounded-full bg-coral text-white text-[9px] font-bold flex items-center justify-center">
              {pending.length}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {loading ? (
              <div className="px-4 py-6 text-center">
                <div className="w-6 h-6 rounded-full border-2 border-lavender border-t-transparent animate-spin mx-auto" />
              </div>
            ) : (
              <div className="pb-2">
                {/* Pending requests */}
                {hasPending && (
                  <div className="px-3 pt-2 pb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-coral-dark px-1 mb-1">
                      Requests ({pending.length})
                    </p>
                    <AnimatePresence mode="popLayout">
                      {pending.map(rel => (
                        <FriendCard
                          key={rel.id}
                          rel={rel}
                          myId={user.id}
                          onAccept={acceptRequest}
                          onReject={rejectRequest}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Friends list */}
                {friends.length > 0 ? (
                  <div className="px-3 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1 mb-1">
                      Friends ({friends.length})
                    </p>
                    <AnimatePresence mode="popLayout">
                      {friends.map(rel => (
                        <FriendCard
                          key={rel.id}
                          rel={rel}
                          myId={user.id}
                          onRemove={removeFriendById}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  !hasPending && (
                    <div className="px-4 py-5 text-center">
                      <UserPlus size={24} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">No friends yet</p>
                      <Link to="/discover">
                        <motion.button whileHover={{ scale: 1.03 }}
                          className="mt-3 px-4 py-1.5 rounded-xl bg-lavender text-white text-xs font-semibold hover:bg-lavender-dark transition-colors">
                          Discover People
                        </motion.button>
                      </Link>
                    </div>
                  )
                )}

                {/* Quick actions */}
                <div className="px-3 pt-2 border-t border-cream-dark mt-2 flex gap-2">
                  <Link to="/discover" className="flex-1">
                    <motion.button whileHover={{ scale: 1.02 }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-lavender-dark bg-lavender-light hover:bg-lavender hover:text-white transition-colors">
                      <UserPlus size={11} /> Add Friends
                    </motion.button>
                  </Link>
                  <Link to="/messages" className="flex-1">
                    <motion.button whileHover={{ scale: 1.02 }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 bg-cream hover:bg-cream-dark transition-colors">
                      <DoorOpen size={11} /> Messages
                    </motion.button>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
