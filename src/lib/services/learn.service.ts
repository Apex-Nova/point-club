import { supabase } from '../supabase';

export interface Course {
  id:            string;
  title:         string;
  description:   string | null;
  thumbnail_url: string | null;
  category:      string;
  level:         'beginner' | 'intermediate' | 'advanced' | 'expert';
  type:          'course' | 'workshop' | 'tutorial' | 'challenge';
  duration_min:  number;
  lesson_count:  number;
  author_name:   string | null;
  price_cents:   number;
  xp_reward:     number;
  is_published:  boolean;
  created_at:    string;
  enrollment?:   { progress: number; completed_at: string | null } | null;
}

export interface Certification {
  id:          string;
  title:       string;
  description: string | null;
  icon:        string;
  badge_color: string;
  earned_at?:  string;
}

export async function getCourses(opts: {
  category?: string; level?: string; type?: string; limit?: number;
} = {}): Promise<Course[]> {
  const { category, level, type, limit = 20 } = opts;
  let q = supabase.from('learning_courses').select('*').eq('is_published', true);
  if (category && category !== 'all') q = q.eq('category', category);
  if (level)    q = q.eq('level', level);
  if (type)     q = q.eq('type', type);
  const { data } = await q.limit(limit);
  return (data ?? []) as Course[];
}

export async function enrollCourse(courseId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  await supabase.from('learning_enrollments').upsert({
    course_id: courseId, user_id: user.id, progress: 0,
  }, { onConflict: 'course_id,user_id' });
}

export async function updateProgress(courseId: string, progress: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const patch: Record<string, unknown> = { progress };
  if (progress >= 100) patch.completed_at = new Date().toISOString();
  await supabase.from('learning_enrollments').update(patch)
    .eq('course_id', courseId).eq('user_id', user.id);
}

export async function getEnrollments(userId: string): Promise<{ course_id: string; progress: number; completed_at: string | null }[]> {
  const { data } = await supabase.from('learning_enrollments')
    .select('course_id, progress, completed_at')
    .eq('user_id', userId);
  return (data ?? []) as { course_id: string; progress: number; completed_at: string | null }[];
}

export async function getCertifications(userId?: string): Promise<Certification[]> {
  const { data: catalog } = await supabase.from('certifications').select('*');
  if (!userId) return (catalog ?? []) as Certification[];

  const { data: earned } = await supabase.from('user_certifications')
    .select('cert_id, earned_at').eq('user_id', userId);

  return (catalog ?? []).map((c: Record<string, unknown>) => {
    const e = (earned ?? []).find((r: Record<string, unknown>) => r.cert_id === c.id) as Record<string, unknown> | undefined;
    return { ...c, earned_at: e?.earned_at ?? undefined } as Certification;
  });
}
