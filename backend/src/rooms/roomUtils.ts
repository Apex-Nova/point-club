const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars

export function generateRoomId(): string {
  let code = 'PC-';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

const PALETTE = [
  '#b8a9f0', '#f27059', '#7dd3b2', '#87c5e8', '#f9c784',
  '#c77dff', '#ff6b6b', '#4ecdc4', '#ffd166', '#ff9f43',
];

export function assignColor(userId: string, usedColors: Set<string>): string {
  let hash = 0;
  for (const c of userId) hash = ((hash << 5) - hash) + c.charCodeAt(0);
  const start = Math.abs(hash) % PALETTE.length;
  for (let i = 0; i < PALETTE.length; i++) {
    const color = PALETTE[(start + i) % PALETTE.length];
    if (!usedColors.has(color)) return color;
  }
  return PALETTE[start]; // all taken — reuse deterministic one
}

export function generateGuestName(): string {
  const adjectives = ['Creative', 'Sketchy', 'Artsy', 'Doodling', 'Colorful', 'Playful'];
  const nouns      = ['Brush', 'Pencil', 'Pixel', 'Canvas', 'Stroke', 'Doodle'];
  const adj  = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num  = Math.floor(Math.random() * 99) + 1;
  return `${adj}${noun}${num}`;
}

export function generateActivityId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
