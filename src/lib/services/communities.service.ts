import { supabase } from '../supabase';

export interface Community {
  id:           string;
  slug:         string;
  name:         string;
  description:  string | null;
  avatar_url:   string | null;
  banner_url:   string | null;
  category:     string;
  is_private:   boolean;
  member_count: number;
  post_count:   number;
  owner_id:     string;
  created_at:   string;
  is_member?:   boolean;
}

export interface CommunityPost {
  id:           string;
  community_id: string;
  author_id:    string;
  title:        string;
  content:      string | null;
  image_url:    string | null;
  type:         'post' | 'challenge' | 'event' | 'announcement';
  like_count:   number;
  comment_count: number;
  is_pinned:    boolean;
  created_at:   string;
  author:       { username: string | null; avatar_url: string | null } | null;
}

export async function getCommunities(category?: string): Promise<Community[]> {
  let q = supabase.from('communities').select('*').eq('is_private', false).order('member_count', { ascending: false });
  if (category && category !== 'all') q = q.eq('category', category);
  const { data } = await q.limit(24);
  return (data ?? []) as Community[];
}

export async function getCommunity(slug: string): Promise<Community | null> {
  const { data } = await supabase.from('communities').select('*').eq('slug', slug).single();
  return data as Community | null;
}

export async function getCommunityPosts(communityId: string): Promise<CommunityPost[]> {
  const { data } = await supabase
    .from('community_posts')
    .select('*, author:profiles!author_id(username,avatar_url)')
    .eq('community_id', communityId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30);
  return (data ?? []) as unknown as CommunityPost[];
}

export async function joinCommunity(communityId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  await supabase.from('community_members').insert({ community_id: communityId, user_id: user.id });
}

export async function leaveCommunity(communityId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('community_members').delete().eq('community_id', communityId).eq('user_id', user.id);
}

export async function isMember(communityId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('community_members')
    .select('user_id').eq('community_id', communityId).eq('user_id', user.id).maybeSingle();
  return Boolean(data);
}

export async function createPost(communityId: string, data: { title: string; content?: string; type?: CommunityPost['type'] }): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  await supabase.from('community_posts').insert({
    community_id: communityId, author_id: user.id,
    title: data.title, content: data.content,
    type: data.type ?? 'post',
  });
}

export async function createCommunity(data: { slug: string; name: string; description?: string; category: string }): Promise<Community> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: comm, error } = await supabase.from('communities').insert({
    ...data, owner_id: user.id,
  }).select().single();
  if (error) throw error;
  // Auto-join as admin
  await supabase.from('community_members').insert({ community_id: (comm as Community).id, user_id: user.id, role: 'admin' });
  return comm as Community;
}
