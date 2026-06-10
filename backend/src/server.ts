import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { registerSocketHandlers } from './socket/index';
import { ensureRoom, supabaseAdmin } from './db';
import { generateRoomId } from './rooms/roomUtils';
import type { C2SEvents, S2CEvents } from './types/events';
import { getTodaysChallenge, randomFrom, BATTLE_PROMPTS } from './games/prompts';
import { handleStripeWebhook } from './stripe/webhooks';
import paymentsRouter         from './routes/payments';
import searchRouter           from './routes/search';
import adminRouter            from './routes/admin';
import agentsRouter           from './routes/agents';
import workspacesRouter       from './routes/workspaces';
import apiPlatformRouter      from './routes/api-platform';
import automationRouter       from './routes/automation';
import recommendationsRouter  from './routes/recommendations';

const PORT         = Number(process.env.PORT ?? 3001);
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

// Allow all local network IPs for local testing
const allowedOrigins = (origin: string | undefined, cb: (e: null, ok: boolean) => void) => cb(null, true);

const app  = express();
const http = createServer(app);

const io = new Server<C2SEvents, S2CEvents>(http, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 20_000,
  pingInterval: 10_000,
});

// Stripe webhook needs raw body BEFORE json parser
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// ── REST endpoints ─────────────────────────────────────────────────────────

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', rooms: io.sockets.adapter.rooms.size });
});

// Create room
app.post('/api/rooms', async (req, res) => {
  try {
    const { name = 'Untitled Room', userId = 'anonymous', type = 'public' } = req.body as {
      name?: string; userId?: string; type?: string;
    };
    let roomId = generateRoomId();
    // Ensure unique ID (retry if collision)
    for (let i = 0; i < 5; i++) {
      if (!io.sockets.adapter.rooms.has(roomId)) break;
      roomId = generateRoomId();
    }
    const room = await ensureRoom(roomId, userId);
    if (supabaseAdmin && name !== 'Untitled Room') {
      await supabaseAdmin.from('rooms').update({ name, type }).eq('id', roomId);
    }
    res.json({ roomId, drawingId: room.drawing_id, name });
  } catch (err) {
    console.error('[POST /api/rooms]', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room info
app.get('/api/rooms/:id', async (req, res) => {
  const { id } = req.params;
  if (!supabaseAdmin) {
    res.json({ id, name: 'Room', type: 'public' });
    return;
  }
  const { data, error } = await supabaseAdmin.from('rooms').select('*').eq('id', id).single();
  if (error || !data) { res.status(404).json({ error: 'Room not found' }); return; }
  // Current online count
  const onlineCount = io.sockets.adapter.rooms.get(id)?.size ?? 0;
  res.json({ ...data, onlineCount });
});

// ── AI endpoints ───────────────────────────────────────────────────────────

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

if (!anthropic) {
  console.warn('[ai] ANTHROPIC_API_KEY not set — AI features will use fallback responses.');
}

async function aiText(prompt: string, max = 400): Promise<string> {
  if (!anthropic) throw new Error('AI not configured');
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: max,
    messages: [{ role: 'user', content: prompt }],
  });
  return (msg.content[0] as { type: string; text: string }).text ?? '';
}

// Drawing inspiration
app.post('/api/ai/inspire', async (req, res) => {
  const { context = 'general drawing' } = req.body as { context?: string };
  try {
    const text = await aiText(
      `You are a creative drawing prompt generator for an online drawing platform called Point Club.
Give 5 creative, fun, specific drawing prompt ideas for the theme: "${context}".
Format: numbered list, each idea on its own line, 1 sentence max. No explanations.`, 300,
    );
    res.json({ ideas: text.trim().split('\n').filter(Boolean).slice(0, 6) });
  } catch {
    // Fallback prompts
    const fallbacks = [
      '1. A wizard running a food truck',
      '2. A robot learning to dance',
      '3. An underwater city at rush hour',
      '4. A dragon working in an office',
      '5. The last bookshop in a digital world',
    ];
    res.json({ ideas: fallbacks });
  }
});

// Color palette suggestions
app.post('/api/ai/colors', async (req, res) => {
  const { mood = 'vibrant' } = req.body as { mood?: string };
  try {
    const text = await aiText(
      `You are a color theory expert for a digital drawing platform.
Suggest 3 color palettes for mood: "${mood}".
For each palette provide: name, 5 hex codes, and a 1-sentence vibe description.
Format as JSON array: [{"name":"...","colors":["#..."],"vibe":"..."}]
Return only valid JSON, no markdown.`, 500,
    );
    const palettes = JSON.parse(text.trim()) as unknown[];
    res.json({ palettes });
  } catch {
    res.json({
      palettes: [
        { name: 'Ocean Calm',    colors: ['#0077B6','#00B4D8','#90E0EF','#CAF0F8','#03045E'], vibe: 'Deep and serene like open water' },
        { name: 'Sunset Glow',  colors: ['#FF6B35','#F7C59F','#EFEFD0','#004E89','#1A936F'], vibe: 'Warm and energetic golden hour' },
        { name: 'Forest Floor', colors: ['#2D6A4F','#40916C','#74C69D','#B7E4C7','#D8F3DC'], vibe: 'Natural, grounded, and refreshing' },
      ],
    });
  }
});

// Random battle prompt
app.get('/api/ai/prompt', (_req, res) => {
  res.json({ prompt: randomFrom(BATTLE_PROMPTS) });
});

// Today's challenge
app.get('/api/challenges/today', (_req, res) => {
  res.json(getTodaysChallenge());
});

// XP award (called from frontend after actions)
app.post('/api/xp/award', async (req, res) => {
  if (!supabaseAdmin) { res.json({ ok: false }); return; }
  const { userId, source, amount, description } = req.body as {
    userId: string; source: string; amount: number; description?: string;
  };
  if (!userId || !source || !amount || amount > 500) { res.status(400).json({ error: 'Invalid' }); return; }
  await supabaseAdmin.from('xp_events').insert({ user_id: userId, source, amount, description });
  res.json({ ok: true });
});

// ── Phase 7 routes ────────────────────────────────────────────────────────
app.use('/api/payments',    paymentsRouter);
app.use('/api/search',      searchRouter);
app.use('/api/admin',       adminRouter);

// ── Phase 8 routes ────────────────────────────────────────────────────────
app.use('/api/agents',      agentsRouter);
app.use('/api/workspaces',       workspacesRouter);
app.use('/api/developer',        apiPlatformRouter);
app.use('/api/automation',       automationRouter);
app.use('/api/recommendations',  recommendationsRouter);

// Recommendations endpoint
app.get('/api/recommendations/:userId', async (req, res) => {
  if (!supabaseAdmin) { res.json({ users: [], rooms: [] }); return; }
  const { userId } = req.params;
  const [topUsers, activeRooms] = await Promise.all([
    supabaseAdmin.from('profiles')
      .select('id, username, avatar_url, follower_count, level, bio')
      .order('follower_count', { ascending: false })
      .neq('id', userId)
      .limit(8),
    supabaseAdmin.from('rooms')
      .select('id, name, type')
      .eq('type', 'public')
      .limit(6),
  ]);
  res.json({ users: topUsers.data ?? [], rooms: activeRooms.data ?? [] });
});

// Analytics track event
app.post('/api/analytics/event', async (req, res) => {
  if (!supabaseAdmin) { res.json({ ok: true }); return; }
  const { userId, sessionId, event, properties } = req.body as {
    userId?: string; sessionId?: string; event: string; properties?: Record<string, unknown>;
  };
  if (!event) { res.status(400).json({ error: 'event required' }); return; }
  await supabaseAdmin.from('analytics_events').insert({
    user_id: userId ?? null, session_id: sessionId,
    event, properties: properties ?? {},
  });
  res.json({ ok: true });
});

// ── Socket.IO ──────────────────────────────────────────────────────────────
registerSocketHandlers(io);

http.listen(PORT, () => {
  console.log(`\n🚀 Point Club backend running on http://localhost:${PORT}`);
  console.log(`   CORS allowed for: ${FRONTEND_URL}\n`);
});
