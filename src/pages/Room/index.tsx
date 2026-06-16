import { useRef, useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Mic, MicOff, MessageSquare,
  Volume2,
} from 'lucide-react';
import type { Stroke, ToolSettings, CanvasHandle } from '@/drawing/types';
import { useHistory } from '@/drawing/hooks/useHistory';
import { useKeyboardShortcuts } from '@/drawing/hooks/useKeyboardShortcuts';
import { useToasts } from '@/drawing/hooks/useToasts';
import { useMultiplayerRoom } from '@/hooks/useMultiplayerRoom';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { useAuth } from '@/contexts/AuthContext';
import Canvas from '@/drawing/components/Canvas';
import PaintToolbar from '@/drawing/components/PaintToolbar';
import FloatingPalette from '@/drawing/components/FloatingPalette';
import { Minus, Plus } from 'lucide-react';
import EmptyState from '@/drawing/components/EmptyState';
import ToastContainer from '@/drawing/components/ToastContainer';
import RemoteStrokesLayer, { type RemoteStrokesHandle } from '@/components/room/RemoteStrokesLayer';
import LiveCursorOverlay from '@/components/room/LiveCursorOverlay';
import RoomSidebar from '@/components/room/RoomSidebar';
import InviteModal from '@/components/room/InviteModal';
import RoomChat from '@/components/room/RoomChat';
import AIPanel from '@/components/ai/AIPanel';
import WhiteboardMode, { type WBElement } from '@/components/whiteboard/WhiteboardMode';
import PresentationOverlay from '@/components/presentation/PresentationOverlay';
import PortraitOverlay from '@/components/layout/PortraitOverlay';
import { exportDrawingPNG } from '@/drawing/utils/storage';

const DEFAULT_SETTINGS: ToolSettings = { tool: 'pencil', color: '#1a1a1a', width: 4 };

function DotGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(circle, #c8c8c8 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    />
  );
}

function usePointBatcher(flushFn: (strokeId: string, pts: Stroke['points']) => void) {
  const bufferRef   = useRef<Stroke['points']>([]);
  const strokeIdRef = useRef('');
  const rafRef      = useRef(0);
  const push = useCallback((strokeId: string, pt: Stroke['points'][0]) => {
    strokeIdRef.current = strokeId;
    bufferRef.current.push(pt);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (bufferRef.current.length > 0) flushFn(strokeIdRef.current, bufferRef.current.splice(0));
    });
  }, [flushFn]);
  return push;
}

type RightTab = 'chat' | 'ai';

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate   = useNavigate();

  const canvasRef       = useRef<CanvasHandle>(null);
  const remoteRef       = useRef<RemoteStrokesHandle>(null);
  const canvasContainer = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const [settings,    setSettings]    = useState<ToolSettings>(DEFAULT_SETTINGS);
  const [inviteOpen,  setInviteOpen]  = useState(false);
  const [wbMode,      setWbMode]      = useState(false);
  const [wbElements,  setWbElements]  = useState<WBElement[]>([]);
  const [presenting,  setPresenting]  = useState(false);
  const [isPresenter, setIsPresenter] = useState(false);
  const [zoom,        setZoom]        = useState(100);
  const [rightPanel,  setRightPanel]  = useState<RightTab | null>(null);
  const [aiOpen,      setAiOpen]      = useState(false);

  const { toasts, addToast, removeToast } = useToasts();
  const { strokes, past, future, pushStroke, undo, redo, reset, canUndo, canRedo } = useHistory();

  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  const {
    room, myParticipant, participants, cursors, activity, connectionStatus, socket,
    emitStrokeStart, emitStrokePoints, emitStrokeEnd, emitStrokeUndo,
    emitCanvasClear, emitCursorMove, leave,
  } = useMultiplayerRoom(roomId, canvasRef, remoteRef, canvasContainer, {
    onServerStrokes: (serverStrokes) => {
      strokesRef.current = serverStrokes;
      canvasRef.current?.redrawAll(serverStrokes);
      reset(serverStrokes);
    },
    onRemoteStrokeEnd: (stroke) => {
      strokesRef.current = [...strokesRef.current, stroke];
      canvasRef.current?.appendStroke(stroke);
      pushStroke(stroke);
    },
  });

  const {
    isInVoice, isMuted, isSpeaking, error: voiceError,
    joinVoice, leaveVoice, toggleMute,
  } = useVoiceChat(socket as unknown as import('socket.io-client').Socket, roomId);

  // Surface voice errors as toasts
  useEffect(() => {
    if (voiceError) addToast(`🎙️ Voice: ${voiceError}`, 'error');
  }, [voiceError]); // eslint-disable-line react-hooks/exhaustive-deps

  const isEmpty = strokes.length === 0;
  const zoomFactor = zoom / 100;


  const getCanvasSize = useCallback(() => {
    const rect = canvasContainer.current?.getBoundingClientRect();
    return { W: rect?.width ?? 1, H: rect?.height ?? 1 };
  }, []);

  const normalizeStroke = useCallback((stroke: Stroke): Stroke => {
    const { W, H } = getCanvasSize();
    return { ...stroke, points: stroke.points.map(p => ({ ...p, x: p.x / W, y: p.y / H })) };
  }, [getCanvasSize]);

  const pushPoint = usePointBatcher((strokeId, pts) => {
    const { W, H } = getCanvasSize();
    emitStrokePoints(strokeId, pts.map(p => ({ ...p, x: p.x / W, y: p.y / H })));
  });

  const handleStrokeStart    = useCallback((s: Stroke) => emitStrokeStart(normalizeStroke(s)), [emitStrokeStart, normalizeStroke]);
  const handlePointAdded     = useCallback((id: string, pt: import('@/drawing/types').Point) => pushPoint(id, pt), [pushPoint]);
  const handleStrokeComplete = useCallback((s: Stroke) => { pushStroke(s); emitStrokeEnd(normalizeStroke(s)); }, [pushStroke, emitStrokeEnd, normalizeStroke]);

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    canvasRef.current?.redrawAll(past[past.length - 1]);
    undo(); emitStrokeUndo();
  }, [canUndo, past, undo, emitStrokeUndo]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    canvasRef.current?.redrawAll(future[0]);
    redo();
  }, [canRedo, future, redo]);

  const handleClear = useCallback(() => {
    if (strokes.length === 0) return;
    strokesRef.current = [];
    canvasRef.current?.clearDrawing();
    remoteRef.current?.clearAll();
    reset([]); emitCanvasClear();
    addToast('Canvas cleared', 'info');
  }, [strokes.length, reset, emitCanvasClear, addToast]);

  const handleExportPNG = useCallback(() => {
    const url = canvasRef.current?.exportImage();
    if (!url) { addToast('Nothing to export', 'info'); return; }
    exportDrawingPNG(url);
    addToast('PNG exported', 'success');
  }, [addToast]);

  const handlePointerMoveOnCanvas = useCallback((e: React.PointerEvent) => {
    const rect = canvasContainer.current?.getBoundingClientRect();
    if (!rect) return;
    emitCursorMove((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height, e.buttons > 0);
  }, [emitCursorMove]);

  useKeyboardShortcuts({
    onUndo: handleUndo, onRedo: handleRedo,
    onSetTool: (tool) => setSettings(s => ({ ...s, tool })),
    onSave: () => addToast('Saved in real time ☁️', 'info'),
  });

  useEffect(() => () => { leave(); }, [leave]);
  useEffect(() => { if (!roomId) navigate('/dashboard'); }, [roomId, navigate]);

  // ── Room-specific toolbar right slot ─────────────────────────────────────
  const handleVoiceToggle = useCallback(async () => {
    if (isInVoice) { leaveVoice(); return; }
    try { await joinVoice(); }
    catch (err) { addToast(`🎙️ Mic error: ${err instanceof Error ? err.message : 'denied'}`, 'error'); }
  }, [isInVoice, joinVoice, leaveVoice, addToast]);

  const roomRightSlot = (
    <div className="flex items-center gap-1.5">
      {/* Voice join/leave */}
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={handleVoiceToggle}
        title={isInVoice ? 'Leave voice chat' : 'Join voice chat'}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all"
        style={{
          background: isInVoice ? '#52b78822' : '#f0f0f0',
          color:      isInVoice ? '#52b788'   : '#888',
          boxShadow:  isInVoice ? '0 0 0 1.5px #52b788' : undefined,
        }}
      >
        {isInVoice
          ? <><Volume2 size={13} />{isSpeaking ? 'Speaking' : isMuted ? 'Muted' : 'Live'}</>
          : <><Mic size={13} />Voice</>}
      </motion.button>

      {/* Mute toggle — only while in voice */}
      {isInVoice && (
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
          style={{ background: isMuted ? '#e6394622' : '#f0f0f0', color: isMuted ? '#e63946' : '#888' }}
        >
          {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
        </motion.button>
      )}

      {/* Chat panel toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => setRightPanel(p => p === 'chat' ? null : 'chat')}
        title="Room chat"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all"
        style={{
          background: rightPanel === 'chat' ? '#4361ee22' : '#f0f0f0',
          color:      rightPanel === 'chat' ? '#4361ee'   : '#888',
          boxShadow:  rightPanel === 'chat' ? '0 0 0 1.5px #4361ee' : undefined,
        }}
      >
        <MessageSquare size={13} />
        Chat
      </motion.button>
    </div>
  );

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: '#1a1a1a' }}>
      {/* Dark left sidebar — room participants */}
      <RoomSidebar
        room={room}
        participants={participants}
        myUserId={myParticipant?.userId}
        connectionStatus={connectionStatus}
        activity={activity}
        onInvite={() => setInviteOpen(true)}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top toolbar */}
        <PaintToolbar
          settings={settings}
          canUndo={canUndo}
          canRedo={canRedo}
          title={room?.name ?? 'Live Room'}
          aiOpen={aiOpen}
          onSettingsChange={(p) => setSettings(s => ({ ...s, ...p }))}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          onExport={handleExportPNG}
          onSave={() => addToast('Saved in real time ☁️', 'info')}
          onToggleAI={() => setAiOpen(v => !v)}
          rightSlot={roomRightSlot}
        />

        {/* Middle: canvas + right panels */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden" style={{ background: '#f2f2f2' }}>
            <DotGrid />

            <div className="absolute inset-0 overflow-hidden">
              <div
                style={{
                  transform: `scale(${zoomFactor})`,
                  transformOrigin: 'center center',
                  width: '100%', height: '100%',
                }}
              >
                <div
                  className="absolute"
                  ref={canvasContainer}
                  style={{
                    inset: '4%',
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 4px 32px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.07)',
                    overflow: 'hidden',
                  }}
                  onPointerMove={handlePointerMoveOnCanvas}
                >
                  <Canvas
                    ref={canvasRef}
                    toolSettings={settings}
                    strokes={strokes}
                    zoom={zoomFactor}
                    onStrokeComplete={handleStrokeComplete}
                    onStrokeStart={handleStrokeStart}
                    onPointAdded={handlePointAdded}
                  />
                  <RemoteStrokesLayer ref={remoteRef} />
                  <LiveCursorOverlay cursors={cursors} containerRef={canvasContainer} />

                  {wbMode && (
                    <WhiteboardMode
                      socket={socket as unknown as import('socket.io-client').Socket}
                      elements={wbElements}
                      myUserId={myParticipant?.userId}
                      onElementsChange={setWbElements}
                    />
                  )}
                  <AnimatePresence>{isEmpty && !wbMode && <EmptyState />}</AnimatePresence>
                </div>
              </div>
            </div>

            {/* Floating palette */}
            <FloatingPalette
              settings={settings}
              onSettingsChange={(p) => setSettings(s => ({ ...s, ...p }))}
            />

            {/* Whiteboard / Present toggles — floating bottom-right of canvas */}
            <div className="absolute bottom-4 right-4 flex gap-1.5 z-20">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setWbMode(v => !v)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all"
                style={{
                  background: wbMode ? '#4361ee' : 'rgba(255,255,255,0.9)',
                  color: wbMode ? '#fff' : '#666',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                {wbMode ? '✏️ Drawing' : '📌 Whiteboard'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => { setPresenting(true); setIsPresenter(true); }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all"
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  color: '#666',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                📽️ Present
              </motion.button>
            </div>
          </div>

          {/* AI panel */}
          <AnimatePresence>
            {aiOpen && (
              <motion.div
                key="ai"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="shrink-0 overflow-y-auto overflow-x-hidden"
                style={{ background: '#fff', borderLeft: '1px solid #ebebeb' }}
              >
                <div style={{ width: 240 }}>
                  <div className="px-3 py-2.5 border-b" style={{ borderColor: '#f0f0f0' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9b5de5' }}>
                      ✦ AI Assistant
                    </p>
                  </div>
                  <AIPanel onColorPick={(hex) => setSettings(s => ({ ...s, color: hex }))} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat panel */}
          <AnimatePresence>
            {rightPanel === 'chat' && (
              <motion.div
                key="chat"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 260, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="shrink-0 flex flex-col overflow-hidden"
                style={{ background: '#fff', borderLeft: '1px solid #ebebeb' }}
              >
                <div style={{ width: 260 }} className="flex flex-col h-full">
                  <div className="px-3 py-2.5 border-b shrink-0" style={{ borderColor: '#f0f0f0' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                      💬 Room Chat
                    </p>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <RoomChat
                      socket={socket as unknown as import('socket.io-client').Socket}
                      roomId={roomId}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Zoom strip */}
        <div className="shrink-0 flex items-center gap-1 px-3"
          style={{ height: 36, background: '#fff', borderTop: '1px solid #ebebeb' }}>
          <button onClick={() => setZoom(z => Math.max(25, z - 25))} title="Zoom out"
            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Minus size={11} className="text-gray-500" />
          </button>
          <button onClick={() => setZoom(100)} title="Reset zoom"
            className="min-w-[44px] text-xs font-semibold text-gray-500 hover:bg-gray-100 px-1.5 py-0.5 rounded-md transition-colors tabular-nums">
            {zoom}%
          </button>
          <button onClick={() => setZoom(z => Math.min(300, z + 25))} title="Zoom in"
            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Plus size={11} className="text-gray-500" />
          </button>
        </div>
      </div>

      {presenting && (
        <PresentationOverlay
          socket={socket as unknown as import('socket.io-client').Socket}
          roomId={roomId}
          myUserId={user?.id}
          isPresenter={isPresenter}
          onClose={() => { setPresenting(false); setIsPresenter(false); }}
        />
      )}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} room={room} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <PortraitOverlay />
    </div>
  );
}
