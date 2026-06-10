import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, X, ChevronLeft, ChevronRight, Eye, Mic, MicOff } from 'lucide-react';
import type { Socket } from 'socket.io-client';

interface Props {
  socket:    Socket | null;
  roomId:    string | undefined;
  myUserId:  string | undefined;
  isPresenter: boolean;
  onClose:   () => void;
}

interface PresentState {
  slide:      number;
  laserPos:   { x: number; y: number } | null;
  viewerCount: number;
  presenterName: string;
}

export default function PresentationOverlay({ socket, roomId, myUserId, isPresenter, onClose }: Props) {
  const [state,    setState]    = useState<PresentState>({ slide: 0, laserPos: null, viewerCount: 0, presenterName: '' });
  const [slides,   setSlides]   = useState<string[]>(['']); // placeholder slide titles
  const [laser,    setLaser]    = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  void myUserId;

  // ── Start/join presentation ────────────────────────────────
  useEffect(() => {
    if (!socket || !roomId) return;

    if (isPresenter) {
      socket.emit('present:start', { title: 'Presentation' });
    } else {
      socket.emit('present:join-audience');
    }

    socket.on('present:slide', ({ slide }: { slide: number }) =>
      setState(s => ({ ...s, slide })));
    socket.on('present:laser', ({ x, y }: { x: number; y: number }) =>
      setState(s => ({ ...s, laserPos: { x, y } })));
    socket.on('present:laser-off', () =>
      setState(s => ({ ...s, laserPos: null })));
    socket.on('present:viewer-count', ({ count }: { count: number }) =>
      setState(s => ({ ...s, viewerCount: count })));
    socket.on('present:stopped', onClose);
    socket.on('present:sync', ({ slide, laserPos }: { slide: number; laserPos: { x: number; y: number } | null }) =>
      setState(s => ({ ...s, slide, laserPos: laserPos ?? null })));

    return () => {
      ['present:slide','present:laser','present:laser-off','present:viewer-count','present:stopped','present:sync']
        .forEach(e => socket.off(e));
      if (isPresenter) socket.emit('present:stop');
      else socket.emit('present:leave-audience');
    };
  }, [socket, roomId, isPresenter, onClose]);

  const goSlide = useCallback((dir: 1 | -1) => {
    const next = Math.max(0, Math.min(slides.length - 1, state.slide + dir));
    setState(s => ({ ...s, slide: next }));
    socket?.emit('present:slide', { slide: next });
  }, [socket, state.slide, slides.length]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPresenter || !laser) return;
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    socket?.emit('present:laser', { x, y });
  };

  const handleMouseLeave = () => {
    if (isPresenter) socket?.emit('present:laser-off');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col"
        ref={overlayRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 bg-black/50 text-white shrink-0">
          <div className="flex items-center gap-3">
            <Monitor size={16} className="text-lavender-light" />
            <span className="text-sm font-bold">
              {isPresenter ? 'Presenting' : `Watching ${state.presenterName}`}
            </span>
            {!isPresenter && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Eye size={11} /> {state.viewerCount} viewers
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isPresenter && (
              <>
                <button onClick={() => setLaser(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${laser ? 'bg-coral/30 text-coral-light' : 'bg-white/10 text-gray-400'}`}>
                  {laser ? <Mic size={12} /> : <MicOff size={12} />}
                  Laser {laser ? 'On' : 'Off'}
                </button>
                <div className="flex gap-1">
                  <button onClick={() => goSlide(-1)} disabled={state.slide === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="w-16 text-center text-xs text-gray-400 self-center">
                    {state.slide + 1} / {slides.length}
                  </span>
                  <button onClick={() => goSlide(1)} disabled={state.slide === slides.length - 1}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-red-500/50 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Presentation area */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Canvas / slide content shown behind overlay */}
          <div className="w-full h-full bg-white/5 flex items-center justify-center">
            <p className="text-white/40 text-sm">
              {isPresenter ? 'Your canvas is visible to the audience' : 'Watching presenter\'s canvas…'}
            </p>
          </div>

          {/* Laser pointer */}
          {state.laserPos && (
            <motion.div
              animate={{ left: `${state.laserPos.x * 100}%`, top: `${state.laserPos.y * 100}%` }}
              transition={{ duration: 0.05, ease: 'linear' }}
              className="absolute w-5 h-5 rounded-full bg-coral shadow-[0_0_12px_rgba(230,57,70,0.8)] pointer-events-none"
              style={{ transform: 'translate(-50%,-50%)' }}
            />
          )}

          {/* Add slide button (presenter) */}
          {isPresenter && (
            <button
              onClick={() => setSlides(prev => [...prev, `Slide ${prev.length + 1}`])}
              className="absolute bottom-6 right-6 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lavender text-white text-sm font-semibold hover:bg-lavender-dark transition-colors"
            >
              + Add Slide
            </button>
          )}
        </div>

        {/* Slide strip (presenter only) */}
        {isPresenter && (
          <div className="flex gap-2 px-6 py-3 bg-black/50 overflow-x-auto shrink-0">
            {slides.map((_, i) => (
              <button key={i} onClick={() => { setState(s => ({ ...s, slide: i })); socket?.emit('present:slide', { slide: i }); }}
                className={`shrink-0 w-20 h-12 rounded-lg border-2 transition-all text-[10px] font-bold text-white ${
                  i === state.slide ? 'border-lavender bg-lavender/30' : 'border-white/20 bg-white/10 hover:border-white/40'
                }`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
