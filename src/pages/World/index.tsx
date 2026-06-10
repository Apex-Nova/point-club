import { Link } from 'react-router-dom';
import { Globe, Pencil, Info } from 'lucide-react';
import { useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import WorldCanvas from '@/components/world/WorldCanvas';
import type { Socket } from 'socket.io-client';

export default function WorldPage() {
  const socket = useSocket();
  const [showInfo, setShowInfo] = useState(true);

  return (
    <div className="w-screen h-dvh flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-cream-dark z-30 shrink-0 flex items-center justify-between px-4 h-11">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium">← Dashboard</Link>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-lavender flex items-center justify-center">
              <Globe size={12} className="text-white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-gray-800 text-sm">World Canvas</span>
            <span className="text-[10px] font-semibold text-lavender-dark bg-lavender-light px-2 py-0.5 rounded-full">BETA</span>
          </div>
        </div>
        <button onClick={() => setShowInfo(v => !v)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-lavender-dark transition-colors px-3 py-1.5 rounded-xl hover:bg-cream">
          <Info size={13} /> How it works
        </button>
      </header>

      {/* Info overlay */}
      {showInfo && (
        <div className="absolute inset-0 top-11 z-40 bg-black/50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-lavender-light flex items-center justify-center mx-auto mb-4">
              <Globe size={24} className="text-lavender-dark" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-800 text-center mb-3">
              The World Canvas
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
              A massive shared canvas divided into sectors. Every drawing you leave here is permanent and visible to everyone.
              Zoom out to explore the whole world. Zoom in to draw your masterpiece.
            </p>
            <div className="bg-cream rounded-2xl p-4 mb-6 space-y-2 text-[11px] text-gray-600">
              <p>🖱️ <strong>Draw</strong> — left click and drag</p>
              <p>✋ <strong>Pan</strong> — Alt + drag, or middle-click drag</p>
              <p>🔍 <strong>Zoom</strong> — scroll wheel</p>
              <p>🗺️ <strong>Navigate</strong> — click on the minimap</p>
              <p>📍 <strong>Sectors</strong> — the grid coordinates at the top</p>
            </div>
            <button onClick={() => setShowInfo(false)}
              className="w-full py-3 rounded-2xl bg-lavender text-white font-bold text-sm hover:bg-lavender-dark transition-colors">
              Start Exploring →
            </button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative min-h-0">
        <WorldCanvas socket={socket as unknown as Socket} />
      </div>
    </div>
  );
}
