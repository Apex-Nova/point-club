import { useEffect, useRef } from 'react';
import type { CursorPosition } from '@/types/room';

interface Props {
  cursors: CursorPosition[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  containerRef: React.RefObject<any>;
}

function CursorIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="24" viewBox="0 0 20 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0 L0 20 L5 15 L10 24 L12 23 L7 14 L14 14 Z"
        fill={color} stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// Single cursor node that moves via direct DOM update — no React re-render on position change
function LiveCursor({ cursor, containerRef }: { cursor: CursorPosition; containerRef: React.RefObject<HTMLElement | null> }) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const W = rect?.width  ?? 1;
    const H = rect?.height ?? 1;
    el.style.transform = `translate(${cursor.x * W}px, ${cursor.y * H}px)`;
  }, [cursor.x, cursor.y, containerRef]);

  return (
    <div
      ref={divRef}
      className="absolute top-0 left-0 flex flex-col items-start will-change-transform"
      style={{ transform: 'translate(0,0)' }}
    >
      <CursorIcon color={cursor.color} />
      <span
        className="ml-4 -mt-1 px-2 py-0.5 rounded-full text-white text-xs font-semibold whitespace-nowrap shadow-sm"
        style={{ background: cursor.color }}
      >
        {cursor.isDrawing && <span className="mr-1">✏️</span>}
        {cursor.username}
      </span>
    </div>
  );
}

export default function LiveCursorOverlay({ cursors, containerRef }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 30 }}>
      {cursors.map(cursor => (
        <LiveCursor key={cursor.userId} cursor={cursor} containerRef={containerRef} />
      ))}
    </div>
  );
}
