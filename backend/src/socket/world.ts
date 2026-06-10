import type { Server, Socket } from 'socket.io';
import { supabaseAdmin } from '../db';

// In-memory sector cache: "x,y" → strokes[]
const sectorCache = new Map<string, unknown[]>();
const dirtySet    = new Set<string>(); // sectors that need flushing

const FLUSH_INTERVAL_MS = 10_000; // flush dirty sectors every 10s

function sectorKey(x: number, y: number) { return `${x},${y}`; }

// Periodic flush to Supabase
setInterval(async () => {
  if (dirtySet.size === 0 || !supabaseAdmin) return;
  const keys = Array.from(dirtySet);
  dirtySet.clear();
  for (const key of keys) {
    const [xs, ys] = key.split(',');
    const [sx, sy] = [parseInt(xs), parseInt(ys)];
    const strokes  = sectorCache.get(key) ?? [];
    await supabaseAdmin.from('world_sectors').upsert({
      sector_x: sx, sector_y: sy,
      strokes:  strokes as unknown as Record<string, unknown>[],
      last_drawn: new Date().toISOString(),
    }, { onConflict: 'sector_x,sector_y' });
  }
}, FLUSH_INTERVAL_MS);

export function registerWorldHandlers(io: Server, socket: Socket) {
  const uid = () => socket.data.userId as string | undefined;

  // ── Load sector ──────────────────────────────────────────────
  socket.on('world:load-sector', async ({ x, y }: { x: number; y: number }) => {
    const key = sectorKey(x, y);
    if (sectorCache.has(key)) {
      socket.emit('world:sector-data', { x, y, strokes: sectorCache.get(key) });
      return;
    }
    if (!supabaseAdmin) { socket.emit('world:sector-data', { x, y, strokes: [] }); return; }
    const { data } = await supabaseAdmin
      .from('world_sectors')
      .select('strokes')
      .eq('sector_x', x)
      .eq('sector_y', y)
      .single();
    const strokes = (data?.strokes as unknown[]) ?? [];
    sectorCache.set(key, strokes);
    socket.emit('world:sector-data', { x, y, strokes });
  });

  // ── Add stroke to sector ─────────────────────────────────────
  socket.on('world:stroke', ({ x, y, stroke }: { x: number; y: number; stroke: unknown }) => {
    if (!uid()) return;
    const key     = sectorKey(x, y);
    const strokes = sectorCache.get(key) ?? [];
    strokes.push(stroke);
    // Keep max 500 strokes per sector
    if (strokes.length > 500) strokes.splice(0, strokes.length - 500);
    sectorCache.set(key, strokes);
    dirtySet.add(key);

    // Broadcast to anyone viewing the same sector
    socket.to(`world:${key}`).emit('world:sector-stroke', { x, y, stroke });
  });

  // ── Subscribe to sector updates ──────────────────────────────
  socket.on('world:subscribe', ({ x, y }: { x: number; y: number }) => {
    void socket.join(`world:${sectorKey(x, y)}`);
  });

  socket.on('world:unsubscribe', ({ x, y }: { x: number; y: number }) => {
    void socket.leave(`world:${sectorKey(x, y)}`);
  });

  // ── Trending sectors ─────────────────────────────────────────
  socket.on('world:trending', async () => {
    if (!supabaseAdmin) { socket.emit('world:trending', { sectors: [] }); return; }
    const { data } = await supabaseAdmin
      .from('world_sectors')
      .select('sector_x, sector_y, pixel_count, last_drawn')
      .order('last_drawn', { ascending: false })
      .limit(20);
    socket.emit('world:trending', { sectors: data ?? [] });
  });
}
