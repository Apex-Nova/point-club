import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Compass, Crosshair, Bookmark } from 'lucide-react';
import type { Socket } from 'socket.io-client';

// ── Constants ─────────────────────────────────────────────────────────────────
const SECTOR_PX  = 500;  // pixels per sector at zoom 1
const MIN_ZOOM   = 0.15;
const MAX_ZOOM   = 4;
const COLORS     = ['#1a1a1a','#e63946','#2a9d8f','#457b9d','#7b2d8b','#e9c46a'];

interface Point   { x: number; y: number }
interface Stroke  { points: Point[]; color: string; width: number }
interface Sector  { x: number; y: number; strokes: Stroke[] }

function sectorOf(worldX: number, worldY: number) {
  return { sx: Math.floor(worldX / SECTOR_PX), sy: Math.floor(worldY / SECTOR_PX) };
}

// ── Minimap ───────────────────────────────────────────────────────────────────
function Minimap({ sectors, viewX, viewY, zoom, onNav }: {
  sectors: Map<string, Sector>;
  viewX: number; viewY: number; zoom: number;
  onNav: (wx: number, wy: number) => void;
}) {
  const W = 120, H = 80, SCALE = 0.04;
  const dotR = Math.max(2, SECTOR_PX * SCALE);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-cream-dark p-1.5 shadow-lg" style={{ width: W + 12, height: H + 12 }}>
      <svg width={W} height={H} className="cursor-crosshair"
        onClick={e => {
          const r = (e.target as SVGSVGElement).getBoundingClientRect();
          const nx = (e.clientX - r.left) / SCALE / W * SECTOR_PX;
          const ny = (e.clientY - r.top)  / SCALE / H * SECTOR_PX;
          onNav(nx, ny);
        }}>
        {Array.from(sectors.values()).map(s => (
          <rect key={`${s.x},${s.y}`} x={s.x * dotR} y={s.y * dotR} width={dotR - 0.5} height={dotR - 0.5}
            fill={s.strokes.length > 0 ? '#7c5cbf' : '#e8e3f0'} rx={1} />
        ))}
        {/* Viewport indicator */}
        <rect
          x={(-viewX / SECTOR_PX) * dotR}
          y={(-viewY / SECTOR_PX) * dotR}
          width={(window.innerWidth  / zoom / SECTOR_PX) * dotR}
          height={(window.innerHeight / zoom / SECTOR_PX) * dotR}
          fill="none" stroke="#e63946" strokeWidth={1} rx={1}
        />
      </svg>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props { socket: Socket | null }

export default function WorldCanvas({ socket }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const [zoom,       setZoom]       = useState(1);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [color,      setColor]      = useState('#1a1a1a');
  const [brushSize,  setBrushSize]  = useState(3);
  const [sectors,    setSectors]    = useState<Map<string, Sector>>(new Map);
  const [isDrawing,  setIsDrawing]  = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const activeStrokeRef   = useRef<Point[]>([]);
  const isPanningRef      = useRef(false);
  const lastPanRef        = useRef({ x: 0, y: 0 });
  const loadedSectorRef   = useRef(new Set<string>());

  // ── Canvas rendering ──────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(viewOffset.x, viewOffset.y);
    ctx.scale(zoom, zoom);

    // Draw sector grid
    ctx.strokeStyle = '#e8e3f033';
    ctx.lineWidth   = 1 / zoom;
    const startSX = Math.floor(-viewOffset.x / zoom / SECTOR_PX) - 1;
    const startSY = Math.floor(-viewOffset.y / zoom / SECTOR_PX) - 1;
    const endSX   = startSX + Math.ceil(window.innerWidth  / zoom / SECTOR_PX) + 2;
    const endSY   = startSY + Math.ceil(window.innerHeight / zoom / SECTOR_PX) + 2;

    for (let sx = startSX; sx <= endSX; sx++) {
      for (let sy = startSY; sy <= endSY; sy++) {
        ctx.strokeRect(sx * SECTOR_PX, sy * SECTOR_PX, SECTOR_PX, SECTOR_PX);
        // Sector label
        if (zoom > 0.4) {
          ctx.fillStyle = '#c8c0d84d';
          ctx.font = `${14 / zoom}px monospace`;
          ctx.fillText(`${sx},${sy}`, sx * SECTOR_PX + 8, sy * SECTOR_PX + 20);
        }
      }
    }

    // Draw strokes
    sectors.forEach(sector => {
      sector.strokes.forEach(stroke => {
        if (stroke.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth   = stroke.width / zoom;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.slice(1).forEach(pt => ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
      });
    });

    ctx.restore();
  }, [viewOffset, zoom, sectors]);

  useEffect(() => { render(); }, [render]);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width  = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        render();
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [render]);

  // ── Sector loading ────────────────────────────────────────────
  const loadVisibleSectors = useCallback(() => {
    if (!socket) return;
    const startSX = Math.floor(-viewOffset.x / zoom / SECTOR_PX) - 1;
    const startSY = Math.floor(-viewOffset.y / zoom / SECTOR_PX) - 1;
    const endSX   = startSX + Math.ceil(window.innerWidth  / zoom / SECTOR_PX) + 2;
    const endSY   = startSY + Math.ceil(window.innerHeight / zoom / SECTOR_PX) + 2;
    for (let sx = Math.max(startSX, -20); sx <= Math.min(endSX, 20); sx++) {
      for (let sy = Math.max(startSY, -20); sy <= Math.min(endSY, 20); sy++) {
        const key = `${sx},${sy}`;
        if (!loadedSectorRef.current.has(key)) {
          loadedSectorRef.current.add(key);
          socket.emit('world:load-sector', { x: sx, y: sy });
          socket.emit('world:subscribe',   { x: sx, y: sy });
        }
      }
    }
  }, [socket, viewOffset, zoom]);

  useEffect(() => { loadVisibleSectors(); }, [loadVisibleSectors]);

  // ── Socket events ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on('world:sector-data', ({ x, y, strokes }: { x: number; y: number; strokes: Stroke[] }) => {
      setSectors(prev => {
        const next = new Map(prev);
        next.set(`${x},${y}`, { x, y, strokes: strokes ?? [] });
        return next;
      });
    });

    socket.on('world:sector-stroke', ({ x, y, stroke }: { x: number; y: number; stroke: Stroke }) => {
      setSectors(prev => {
        const key     = `${x},${y}`;
        const existing = prev.get(key) ?? { x, y, strokes: [] };
        const next = new Map(prev);
        next.set(key, { ...existing, strokes: [...existing.strokes, stroke] });
        return next;
      });
    });

    return () => {
      socket.off('world:sector-data');
      socket.off('world:sector-stroke');
    };
  }, [socket]);

  // ── Pointer events ────────────────────────────────────────────
  const worldPos = (clientX: number, clientY: number) => ({
    x: (clientX - viewOffset.x) / zoom,
    y: (clientY - viewOffset.y) / zoom,
  });

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.altKey) {
      // Middle-click or alt: pan
      isPanningRef.current = true;
      lastPanRef.current = { x: e.clientX, y: e.clientY };
      return;
    }
    setIsDrawing(true);
    const pos = worldPos(e.clientX, e.clientY);
    activeStrokeRef.current = [pos];
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (isPanningRef.current) {
      const dx = e.clientX - lastPanRef.current.x;
      const dy = e.clientY - lastPanRef.current.y;
      lastPanRef.current = { x: e.clientX, y: e.clientY };
      setViewOffset(o => ({ x: o.x + dx, y: o.y + dy }));
      return;
    }
    if (!isDrawing) return;
    const pos = worldPos(e.clientX, e.clientY);
    activeStrokeRef.current.push(pos);

    // Live preview — draw active stroke on canvas
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (ctx && activeStrokeRef.current.length >= 2) {
      render();
      const pts = activeStrokeRef.current;
      ctx.save();
      ctx.translate(viewOffset.x, viewOffset.y);
      ctx.scale(zoom, zoom);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth   = brushSize / zoom;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.restore();
    }
  };

  const onPointerUp = () => {
    if (isPanningRef.current) { isPanningRef.current = false; loadVisibleSectors(); return; }
    if (!isDrawing || activeStrokeRef.current.length < 2) { setIsDrawing(false); return; }

    const stroke: Stroke = { points: activeStrokeRef.current, color, width: brushSize };
    const firstPt = stroke.points[0];
    const { sx, sy } = sectorOf(firstPt.x, firstPt.y);

    // Add locally
    setSectors(prev => {
      const key      = `${sx},${sy}`;
      const existing = prev.get(key) ?? { x: sx, y: sy, strokes: [] };
      const next = new Map(prev);
      next.set(key, { ...existing, strokes: [...existing.strokes, stroke] });
      return next;
    });

    // Send to server
    socket?.emit('world:stroke', { x: sx, y: sy, stroke });

    activeStrokeRef.current = [];
    setIsDrawing(false);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor)));
  };

  const navigateTo = (wx: number, wy: number) => {
    setViewOffset({
      x: window.innerWidth  / 2 - wx * zoom,
      y: window.innerHeight / 2 - wy * zoom,
    });
  };

  const currentSector = sectorOf(-viewOffset.x / zoom + window.innerWidth / zoom / 2, -viewOffset.y / zoom + window.innerHeight / zoom / 2);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#fafaf8] cursor-crosshair select-none">
      <canvas ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        className="absolute inset-0 touch-none"
        style={{ cursor: isPanningRef.current ? 'grab' : 'crosshair' }}
      />

      {/* Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        {[{ icon: ZoomIn, fn: () => setZoom(z => Math.min(MAX_ZOOM, z * 1.25)) },
          { icon: ZoomOut, fn: () => setZoom(z => Math.max(MIN_ZOOM, z / 1.25)) },
          { icon: Crosshair, fn: () => navigateTo(0, 0) },
        ].map(({ icon: Icon, fn }, i) => (
          <motion.button key={i} whileTap={{ scale: 0.9 }} onClick={fn}
            className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl border border-cream-dark flex items-center justify-center text-gray-600 hover:text-lavender-dark hover:bg-white shadow-sm transition-colors">
            <Icon size={16} />
          </motion.button>
        ))}
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setBookmarked(b => !b)}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-sm transition-colors ${
            bookmarked ? 'bg-lavender text-white border-lavender' : 'bg-white/90 backdrop-blur-sm border-cream-dark text-gray-600 hover:text-lavender-dark'
          }`}>
          <Bookmark size={16} />
        </motion.button>
      </div>

      {/* Color palette */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-2xl border border-cream-dark px-3 py-2 shadow-lg">
        {COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)}
            className={`w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform ${color === c ? 'border-gray-700 scale-110' : 'border-white'}`}
            style={{ background: c }} />
        ))}
        <div className="w-px h-5 bg-cream-dark mx-1" />
        {[2, 4, 8].map(s => (
          <button key={s} onClick={() => setBrushSize(s)}
            className={`flex items-center justify-center w-7 h-7 rounded-full hover:bg-cream transition-colors ${brushSize === s ? 'bg-lavender-light' : ''}`}>
            <div className="rounded-full bg-gray-700" style={{ width: s * 2 + 2, height: s * 2 + 2 }} />
          </button>
        ))}
      </div>

      {/* Sector indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl border border-cream-dark px-3 py-1.5 text-xs text-gray-500 shadow-sm">
        <Compass size={12} className="text-lavender-dark" />
        Sector {currentSector.sx},{currentSector.sy}
        <span className="text-gray-300">·</span>
        {Math.round(zoom * 100)}%
      </div>

      {/* Minimap */}
      <div className="absolute bottom-16 right-4">
        <Minimap sectors={sectors} viewX={viewOffset.x} viewY={viewOffset.y} zoom={zoom} onNav={navigateTo} />
      </div>

      {/* Alt/middle-click hint */}
      <div className="absolute top-4 right-16 text-[10px] text-gray-400 bg-white/60 rounded-lg px-2 py-1 pointer-events-none">
        Alt+drag or scroll to pan
      </div>
    </div>
  );
}
