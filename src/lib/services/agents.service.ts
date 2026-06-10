const API = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

export type AgentType =
  | 'sketch_mentor' | 'concept_artist' | 'brainstorm_partner'
  | 'color_expert'  | 'story_builder'  | 'design_reviewer' | 'room_assistant';

export interface AgentDefinition {
  id:    AgentType;
  name:  string;
  emoji: string;
  desc:  string;
}

export interface ConversationMessage {
  role:    'user' | 'assistant';
  content: string;
  ts:      number;
}

export interface AgentConversation {
  id:         string;
  agent_type: AgentType;
  title:      string | null;
  created_at: string;
  updated_at: string;
}

export async function getAgents(): Promise<AgentDefinition[]> {
  try {
    const r = await fetch(`${API}/api/agents/list`);
    const d = await r.json() as { agents: AgentDefinition[] };
    return d.agents;
  } catch {
    return [
      { id: 'sketch_mentor',      name: 'Sketch Mentor',      emoji: '✏️', desc: 'Drawing feedback & exercises' },
      { id: 'concept_artist',     name: 'Concept Artist',     emoji: '🎨', desc: 'Ideas, variations & compositions' },
      { id: 'brainstorm_partner', name: 'Brainstorm Partner', emoji: '💡', desc: 'Unlock creativity & break blocks' },
      { id: 'color_expert',       name: 'Color Expert',       emoji: '🌈', desc: 'Palettes, harmony & mood' },
      { id: 'story_builder',      name: 'Story Builder',      emoji: '📖', desc: 'Turn art into narrative' },
      { id: 'design_reviewer',    name: 'Design Reviewer',    emoji: '🔍', desc: 'Professional critique & feedback' },
    ];
  }
}

export async function chatWithAgent(opts: {
  userId:          string;
  agentType:       AgentType;
  message:         string;
  conversationId?: string;
  contextData?:    Record<string, unknown>;
}): Promise<{ reply: string; conversationId: string }> {
  const r = await fetch(`${API}/api/agents/chat`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(opts),
  });
  if (!r.ok) throw new Error('Agent request failed');
  return r.json() as Promise<{ reply: string; conversationId: string }>;
}

export async function getRoomSummary(opts: {
  roomId: string; userId: string;
  chatMessages: { username: string; content: string }[];
  strokes?: number;
}): Promise<string> {
  const r = await fetch(`${API}/api/agents/room-summary`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(opts),
  });
  const d = await r.json() as { summary: string };
  return d.summary ?? '';
}

export async function getConversations(userId: string): Promise<AgentConversation[]> {
  try {
    const r = await fetch(`${API}/api/agents/conversations/${userId}`);
    const d = await r.json() as { conversations: AgentConversation[] };
    return d.conversations;
  } catch {
    return [];
  }
}
