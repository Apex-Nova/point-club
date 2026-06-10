import { supabase } from '../supabase';

export interface FriendRelation {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  // Joined profile fields
  profile?: { username: string | null; avatar_url: string | null };
}

export interface FollowRelation {
  follower_id: string;
  following_id: string;
  profile?: { username: string | null; avatar_url: string | null };
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// ── Friends ────────────────────────────────────────────────────────────────

export async function sendFriendRequest(addresseeId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('friends').insert({
    requester_id: user.id, addressee_id: addresseeId, status: 'pending',
  }).select().single();
  if (error) throw error;
  return data as FriendRelation;
}

export async function respondToFriendRequest(requestId: string, accept: boolean) {
  const { error } = await supabase.from('friends').update({
    status: accept ? 'accepted' : 'rejected', updated_at: new Date().toISOString(),
  }).eq('id', requestId);
  if (error) throw error;
}

export async function removeFriend(friendRelationId: string) {
  await supabase.from('friends').delete().eq('id', friendRelationId);
}

export async function blockUser(userId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('friends').upsert({
    requester_id: user.id, addressee_id: userId, status: 'blocked',
  }, { onConflict: 'requester_id,addressee_id' });
}

export async function getFriends(userId: string): Promise<FriendRelation[]> {
  const { data, error } = await supabase
    .from('friends')
    .select('*, requester:profiles!requester_id(username,avatar_url), addressee:profiles!addressee_id(username,avatar_url)')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted');
  if (error) return [];
  return data as unknown as FriendRelation[];
}

export async function getPendingRequests(userId: string): Promise<FriendRelation[]> {
  const { data, error } = await supabase
    .from('friends')
    .select('*, requester:profiles!requester_id(username,avatar_url)')
    .eq('addressee_id', userId)
    .eq('status', 'pending');
  if (error) return [];
  return data as unknown as FriendRelation[];
}

// ── Followers ─────────────────────────────────────────────────────────────

export async function followUser(targetId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  await supabase.from('followers').insert({ follower_id: user.id, following_id: targetId });
}

export async function unfollowUser(targetId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('followers').delete().eq('follower_id', user.id).eq('following_id', targetId);
}

export async function isFollowing(targetId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('followers')
    .select('follower_id').eq('follower_id', user.id).eq('following_id', targetId).maybeSingle();
  return Boolean(data);
}

// ── Notifications ─────────────────────────────────────────────────────────

export async function getNotifications(limit = 30): Promise<NotificationRow[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from('notifications')
    .select('*').eq('user_id', user.id)
    .order('created_at', { ascending: false }).limit(limit);
  return (data ?? []) as NotificationRow[];
}

export async function markNotificationRead(id: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}

export async function markAllNotificationsRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
}

// ── Discover ──────────────────────────────────────────────────────────────

export async function getDiscoverProfiles(limit = 12) {
  const { data } = await supabase.from('profiles')
    .select('id, username, avatar_url, bio, follower_count, total_drawings')
    .order('follower_count', { ascending: false }).limit(limit);
  return data ?? [];
}

export async function getActivityFeed(limit = 20) {
  const { data } = await supabase.from('notifications')
    .select('*')
    .in('type', ['follow', 'friend_accepted', 'achievement'])
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ── Report ────────────────────────────────────────────────────────────────
export async function reportContent(targetId: string, targetType: string, reason: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  // reports table — schema included in migration SQL
  await supabase.from('reports').insert({
    reporter_id: user.id, target_id: targetId, target_type: targetType, reason,
  }).then().catch(() => {});
}
