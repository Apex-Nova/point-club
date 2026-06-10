import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '../db';

const router = Router();

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ── Agent personas ─────────────────────────────────────────────────────────
type AgentType = 'sketch_mentor' | 'concept_artist' | 'brainstorm_partner' | 'color_expert' | 'story_builder' | 'design_reviewer' | 'room_assistant';

const AGENT_SYSTEM_PROMPTS: Record<AgentType, string> = {
  sketch_mentor: `You are a warm, encouraging Sketch Mentor on Point Club, a collaborative drawing platform.
Your role: analyze drawings, provide constructive feedback, suggest exercises, track learning progress.
Style: conversational, supportive, educational. Use emoji sparingly. Keep responses concise (2-4 sentences unless asked for more).
When given a canvas description or request, focus on: line quality, composition, proportions, technique improvement.
Always end with one actionable next step.`,

  concept_artist: `You are an imaginative Concept Artist AI on Point Club.
Your role: generate ideas, expand concepts, suggest variations, recommend compositions.
Style: creative, visual, specific. Think in images and scenes. Reference art styles naturally.
When brainstorming, provide 3-5 distinct options with brief descriptions.
Focus on what would make visually compelling concepts.`,

  brainstorm_partner: `You are an enthusiastic Brainstorm Partner on Point Club.
Your role: help users unlock creativity, break blocks, combine ideas, explore possibilities.
Style: energetic, divergent-thinking, never judgmental. Build on every idea.
Use "Yes, and..." thinking. Ask clarifying questions. Push for the unexpected.
Keep ideas visual and drawable.`,

  color_expert: `You are a precise Color Expert on Point Club.
Your role: analyze color palettes, suggest harmonious combinations, explain color theory, recommend moods.
Style: knowledgeable, precise, visual. Mention hex codes when helpful.
Reference color theory concepts (complementary, analogous, triadic, etc.) naturally.
Always explain WHY a color choice works emotionally and technically.`,

  story_builder: `You are a creative Story Builder on Point Club.
Your role: transform drawings into narratives, create characters, build worlds, generate lore.
Style: narrative, evocative, world-building. Think like a game writer or graphic novelist.
When given a drawing description, extract story elements: who, what, where, why.
Build mythology and meaning around visual elements.`,

  design_reviewer: `You are a constructive Design Reviewer on Point Club.
Your role: provide professional design critique, evaluate UX/UI elements, assess visual hierarchy, give actionable feedback.
Style: professional, specific, solution-oriented. Balance positive feedback with improvements.
Structure feedback as: Strengths → Issues → Specific fixes.
Reference design principles (Gestalt, hierarchy, contrast, alignment) when relevant.`,

  room_assistant: `You are a smart Room Assistant on Point Club's collaborative canvas.
Your role: summarize meeting content, extract ideas, create action items, organize discussions.
Style: clear, organized, efficient. Use bullet points and structure.
When summarizing: capture key decisions, ideas generated, and next steps.
Be the organized secretary the creative room needs.`,
};

// ── Chat with agent ────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { userId, agentType, message, conversationId, contextData } = req.body as {
    userId: string;
    agentType: AgentType;
    message: string;
    conversationId?: string;
    contextData?: Record<string, unknown>;
  };

  if (!userId || !agentType || !message?.trim()) {
    res.status(400).json({ error: 'userId, agentType, and message required' }); return;
  }

  const systemPrompt = AGENT_SYSTEM_PROMPTS[agentType];
  if (!systemPrompt) { res.status(400).json({ error: 'Unknown agent type' }); return; }

  try {
    // Load conversation history
    let history: { role: 'user' | 'assistant'; content: string }[] = [];
    let convId = conversationId;

    if (convId && supabaseAdmin) {
      const { data: conv } = await supabaseAdmin
        .from('agent_conversations').select('messages').eq('id', convId).single();
      if (conv) {
        history = (conv.messages as { role: 'user' | 'assistant'; content: string }[])
          .slice(-10); // last 10 messages for context window
      }
    }

    // Build messages array
    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      ...history,
      { role: 'user', content: message.trim() },
    ];

    let reply = '';

    if (anthropic) {
      const response = await anthropic.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system:     systemPrompt,
        messages,
      });
      reply = (response.content[0] as { type: string; text: string }).text ?? '';
    } else {
      // Fallback when AI not configured
      reply = `I'm ${agentType.replace(/_/g, ' ')} — ready to help! (Configure ANTHROPIC_API_KEY for real AI responses.)`;
    }

    // Persist conversation
    const newMessages = [
      ...history,
      { role: 'user', content: message.trim(), ts: Date.now() },
      { role: 'assistant', content: reply, ts: Date.now() },
    ];

    if (supabaseAdmin) {
      if (convId) {
        await supabaseAdmin.from('agent_conversations')
          .update({ messages: newMessages, updated_at: new Date().toISOString() })
          .eq('id', convId);
      } else {
        const { data: newConv } = await supabaseAdmin.from('agent_conversations').insert({
          user_id: userId, agent_type: agentType,
          messages: newMessages,
          context_data: contextData ?? {},
          title: message.trim().slice(0, 60),
        }).select('id').single();
        convId = (newConv as { id: string } | null)?.id;
      }

      // Track AI credits usage
      void supabaseAdmin.from('profiles')
        .update({ ai_credits: supabaseAdmin.rpc as unknown as number })
        .eq('id', userId);
    }

    res.json({ reply, conversationId: convId });
  } catch (err) {
    console.error('[agents/chat]', err);
    res.status(500).json({ error: 'Agent unavailable' });
  }
});

// ── Room summary ────────────────────────────────────────────────
router.post('/room-summary', async (req, res) => {
  const { roomId, userId, chatMessages, strokes } = req.body as {
    roomId: string; userId: string;
    chatMessages: { username: string; content: string }[];
    strokes?: number;
  };

  const chatText = chatMessages.slice(-50)
    .map(m => `${m.username}: ${m.content}`).join('\n');

  const prompt = `You are summarizing a collaborative drawing session on Point Club.
${strokes ? `The canvas has ${strokes} strokes drawn.` : ''}
${chatText ? `Chat transcript:\n${chatText}` : 'No chat messages.'}

Provide a structured summary in this format:
**Session Summary**
[1-2 sentence overview]

**Key Ideas**
- [bullet]

**Action Items**
- [bullet]

**Mood & Theme**
[brief description]`;

  try {
    let content = '';
    if (anthropic) {
      const r = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001', max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      });
      content = (r.content[0] as { type: string; text: string }).text ?? '';
    } else {
      content = `**Session Summary**\nA creative collaborative session with ${strokes ?? 0} strokes and ${chatMessages.length} messages.\n\n**Key Ideas**\n- Drawing and collaboration\n\n**Action Items**\n- Continue creating`;
    }

    if (supabaseAdmin) {
      await supabaseAdmin.from('room_ai_notes').insert({
        room_id: roomId, type: 'summary', content,
      });
    }

    res.json({ summary: content });
  } catch {
    res.status(500).json({ error: 'Summary failed' });
  }
});

// ── List conversations ─────────────────────────────────────────
router.get('/conversations/:userId', async (req, res) => {
  if (!supabaseAdmin) { res.json({ conversations: [] }); return; }
  const { data } = await supabaseAdmin
    .from('agent_conversations')
    .select('id, agent_type, title, created_at, updated_at')
    .eq('user_id', req.params.userId)
    .order('updated_at', { ascending: false })
    .limit(20);
  res.json({ conversations: data ?? [] });
});

// ── Get agents list ────────────────────────────────────────────
router.get('/list', (_req, res) => {
  res.json({
    agents: [
      { id: 'sketch_mentor',      name: 'Sketch Mentor',       emoji: '✏️', desc: 'Drawing feedback & exercises' },
      { id: 'concept_artist',     name: 'Concept Artist',      emoji: '🎨', desc: 'Ideas, variations & compositions' },
      { id: 'brainstorm_partner', name: 'Brainstorm Partner',  emoji: '💡', desc: 'Unlock creativity & break blocks' },
      { id: 'color_expert',       name: 'Color Expert',        emoji: '🌈', desc: 'Palettes, harmony & mood' },
      { id: 'story_builder',      name: 'Story Builder',       emoji: '📖', desc: 'Turn art into narrative' },
      { id: 'design_reviewer',    name: 'Design Reviewer',     emoji: '🔍', desc: 'Professional critique & feedback' },
    ],
  });
});

export default router;
