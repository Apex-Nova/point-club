import { supabase } from '../supabase';

export interface GalleryDrawing {
  id:            string;
  user_id:       string;
  title:         string;
  thumbnail_url: string | null;
  like_count:    number;
  view_count:    number;
  tags:          string[];
  published_at:  string | null;
  author:        { username: string | null; avatar_url: string | null } | null;
}

export interface DrawingComment {
  id:         string;
  user_id:    string;
  username:   string;
  content:    string;
  created_at: string;
}

export async function getGallery(opts: {
  sort?: 'trending' | 'recent' | 'top';
  tag?:  string;
  limit?: number;
} = {}): Promise<GalleryDrawing[]> {
  const { sort = 'trending', tag, limit = 24 } = opts;
  let q = supabase
    .from('drawings')
    .select('id, user_id, title, thumbnail_url, like_count, view_count, tags, published_at, author:profiles!user_id(username,avatar_url)')
    .eq('is_public', true);

  if (tag) q = q.contains('tags', [tag]);

  if (sort === 'top')      q = q.order('like_count',   { ascending: false });
  else if (sort === 'recent') q = q.order('published_at', { ascending: false });
  else                     q = q.order('view_count',   { ascending: false });

  const { data } = await q.limit(limit);
  return (data ?? []) as unknown as GalleryDrawing[];
}

export async function likeDrawing(drawingId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  await supabase.from('drawing_likes').insert({ drawing_id: drawingId, user_id: user.id });
}

export async function unlikeDrawing(drawingId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('drawing_likes').delete()
    .eq('drawing_id', drawingId).eq('user_id', user.id);
}

export async function isLiked(drawingId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('drawing_likes')
    .select('drawing_id').eq('drawing_id', drawingId).eq('user_id', user.id).maybeSingle();
  return Boolean(data);
}

export async function saveDrawing(drawingId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  await supabase.from('drawing_saves').insert({ drawing_id: drawingId, user_id: user.id });
}

export async function getComments(drawingId: string): Promise<DrawingComment[]> {
  const { data } = await supabase
    .from('drawing_comments')
    .select('*')
    .eq('drawing_id', drawingId)
    .order('created_at', { ascending: true });
  return (data ?? []) as DrawingComment[];
}

export async function addComment(drawingId: string, content: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
  await supabase.from('drawing_comments').insert({
    drawing_id: drawingId, user_id: user.id,
    username: (profile as { username: string | null })?.username ?? 'Anonymous',
    content: content.trim(),
  });
}

export async function publishDrawing(drawingId: string, tags: string[] = []): Promise<void> {
  await supabase.from('drawings').update({
    is_public: true, published_at: new Date().toISOString(), tags,
  }).eq('id', drawingId);
}
