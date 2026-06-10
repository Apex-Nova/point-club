import { supabase } from '../supabase';

export interface WorldEvent {
  id:           string;
  title:        string;
  slug:         string;
  description:  string;
  type:         'global_art_week' | 'world_canvas' | 'monthly_challenge' | 'competition' | 'workshop' | 'festival';
  status:       'upcoming' | 'live' | 'ended';
  banner_url:   string | null;
  starts_at:    string;
  ends_at:      string;
  prize_pool:   number | null;
  xp_reward:    number;
  participant_count: number;
  tags:         string[];
  is_registered?: boolean;
}

export interface EventSubmission {
  id:          string;
  event_id:    string;
  user_id:     string;
  drawing_url: string;
  votes:       number;
  rank:        number | null;
  submitted_at: string;
  profile?:    { username: string; avatar_url: string | null };
}

const MOCK_EVENTS: WorldEvent[] = [
  {
    id: '1', title: 'Global Art Week 2026', slug: 'global-art-week-2026',
    description: 'A week-long celebration of creativity. Draw anything, share everything. The entire Point Club world canvas comes alive with submissions from artists worldwide.',
    type: 'global_art_week', status: 'live',
    banner_url: null, starts_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
    prize_pool: 5000, xp_reward: 500, participant_count: 12847, tags: ['art', 'global', 'all-levels'],
  },
  {
    id: '2', title: 'World Canvas Festival', slug: 'world-canvas-festival-2026',
    description: 'Paint your corner of the infinite world canvas. Join thousands of creators painting collaboratively on a single infinite shared canvas visible to all.',
    type: 'world_canvas', status: 'live',
    banner_url: null, starts_at: new Date(Date.now() - 86400000).toISOString(),
    ends_at: new Date(Date.now() + 86400000 * 10).toISOString(),
    prize_pool: null, xp_reward: 250, participant_count: 8932, tags: ['collaborative', 'world-canvas', 'community'],
  },
  {
    id: '3', title: 'June Monthly Challenge: "Futurism"', slug: 'june-challenge-2026',
    description: 'This month\'s theme is Futurism — depict technology, cities, and life in 2100. Submit your best concept art for community voting.',
    type: 'monthly_challenge', status: 'live',
    banner_url: null, starts_at: new Date('2026-06-01').toISOString(),
    ends_at: new Date('2026-06-30').toISOString(),
    prize_pool: 1000, xp_reward: 300, participant_count: 4201, tags: ['futurism', 'concept-art', 'monthly'],
  },
  {
    id: '4', title: 'AI Art Creator Competition', slug: 'ai-art-competition-2026',
    description: 'Use Point Club\'s AI agents to co-create. The best human+AI collaborative artworks win big. Show what\'s possible when human creativity meets AI assistance.',
    type: 'competition', status: 'upcoming',
    banner_url: null, starts_at: new Date(Date.now() + 86400000 * 7).toISOString(),
    ends_at: new Date(Date.now() + 86400000 * 21).toISOString(),
    prize_pool: 10000, xp_reward: 750, participant_count: 0, tags: ['ai', 'competition', 'premium'],
  },
  {
    id: '5', title: 'Character Design Workshop', slug: 'character-workshop-june-2026',
    description: 'Live workshop with professional concept artists. Learn character design fundamentals and create your signature character in real time.',
    type: 'workshop', status: 'upcoming',
    banner_url: null, starts_at: new Date(Date.now() + 86400000 * 3).toISOString(),
    ends_at: new Date(Date.now() + 86400000 * 3 + 7200000).toISOString(),
    prize_pool: null, xp_reward: 200, participant_count: 342, tags: ['workshop', 'character-design', 'live'],
  },
  {
    id: '6', title: 'Spring Pixel Art Festival', slug: 'spring-pixel-festival-2026',
    description: 'Celebrate the pixel art renaissance. Create stunning pixel art pieces and vote for your favorites in this community-driven festival.',
    type: 'festival', status: 'ended',
    banner_url: null, starts_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    ends_at: new Date(Date.now() - 86400000 * 16).toISOString(),
    prize_pool: 2500, xp_reward: 400, participant_count: 6789, tags: ['pixel-art', 'festival', 'ended'],
  },
];

export async function getEvents(): Promise<WorldEvent[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return MOCK_EVENTS;

    // Check registrations
    const { data: regs } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', userId);

    const regSet = new Set((regs ?? []).map((r: { event_id: string }) => r.event_id));
    return MOCK_EVENTS.map(e => ({ ...e, is_registered: regSet.has(e.id) }));
  } catch {
    return MOCK_EVENTS;
  }
}

export async function registerForEvent(eventId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  await supabase.from('event_registrations').upsert({
    event_id: eventId, user_id: session.user.id, registered_at: new Date().toISOString(),
  });
}

export async function getEventLeaderboard(eventId: string): Promise<EventSubmission[]> {
  void eventId;
  return [
    { id: '1', event_id: eventId, user_id: 'u1', drawing_url: '', votes: 1247, rank: 1, submitted_at: new Date().toISOString(), profile: { username: 'aurora_draws', avatar_url: null } },
    { id: '2', event_id: eventId, user_id: 'u2', drawing_url: '', votes: 983, rank: 2, submitted_at: new Date().toISOString(), profile: { username: 'pixelmaster', avatar_url: null } },
    { id: '3', event_id: eventId, user_id: 'u3', drawing_url: '', votes: 756, rank: 3, submitted_at: new Date().toISOString(), profile: { username: 'conceptkid', avatar_url: null } },
  ];
}
