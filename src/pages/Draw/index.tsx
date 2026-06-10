import { useRef, useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { Stroke, ToolSettings, CanvasHandle } from '@/drawing/types';
import { useHistory } from '@/drawing/hooks/useHistory';
import { useBoards } from '@/drawing/hooks/useBoards';
import { useKeyboardShortcuts } from '@/drawing/hooks/useKeyboardShortcuts';
import { useToasts } from '@/drawing/hooks/useToasts';
import { useCloudSave } from '@/hooks/useCloudSave';
import { useAuth } from '@/contexts/AuthContext';
import Canvas from '@/drawing/components/Canvas';
import PaintToolbar from '@/drawing/components/PaintToolbar';
import BoardsSidebar from '@/drawing/components/BoardsSidebar';
import FloatingPalette from '@/drawing/components/FloatingPalette';
import BottomBar from '@/drawing/components/BottomBar';
import EmptyState from '@/drawing/components/EmptyState';
import ToastContainer from '@/drawing/components/ToastContainer';
import PortraitOverlay from '@/components/layout/PortraitOverlay';
import AIPanel from '@/components/ai/AIPanel';
import { exportDrawingPNG } from '@/drawing/utils/storage';
import { createRoom } from '@/lib/services/rooms.service';

const DEFAULT_SETTINGS: ToolSettings = { tool: 'pencil', color: '#1a1a1a', width: 4 };

// Dot-grid background rendered on a small canvas for perfect sharpness
function DotGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(circle, #c8c8c8 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        backgroundPosition: '0 0',
      }}
    />
  );
}

export default function DrawPage() {
  const { drawingId: paramId } = useParams<{ drawingId?: string }>();
  const navigate = useNavigate();
  const { user }  = useAuth();

  const canvasRef = useRef<CanvasHandle>(null);
  const [settings, setSettings] = useState<ToolSettings>(DEFAULT_SETTINGS);
  const [zoom, setZoom]         = useState(100);
  const [aiOpen, setAiOpen]     = useState(false);

  const { toasts, addToast, removeToast } = useToasts();
  const { strokes, past, future, pushStroke, undo, redo, reset, canUndo, canRedo } = useHistory();

  // Boards (localStorage)
  const {
    boards, activeBoardId, activeBoard,
    newBoard, selectBoard, saveToBoard, deleteBoard, renameBoard,
  } = useBoards();

  // Cloud save
  const getThumbnail = useCallback(() => canvasRef.current?.exportImage() ?? '', []);
  const [drawingId, setDrawingId] = useState<string | null>(paramId ?? null);
  const { status: cloudStatus, save: cloudSave } = useCloudSave(drawingId, strokes, getThumbnail);

  // ── Load board when sidebar selection changes ─────────────────────────────
  const prevBoardIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeBoardId || activeBoardId === prevBoardIdRef.current) return;
    prevBoardIdRef.current = activeBoardId;
    const board = boards.find(b => b.id === activeBoardId);
    if (!board) return;
    reset(board.strokes);
    canvasRef.current?.redrawAll(board.strokes);
  }, [activeBoardId, boards, reset]);

  // ── Auto-save to active board when strokes change ─────────────────────────
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(null);
  useEffect(() => {
    if (!activeBoardId) return;
    clearTimeout(autoSaveTimer.current!);
    autoSaveTimer.current = setTimeout(() => {
      const thumb = canvasRef.current?.exportImage() ?? '';
      saveToBoard(activeBoardId, strokes, thumb);
    }, 1500);
    return () => clearTimeout(autoSaveTimer.current!);
  }, [strokes, activeBoardId, saveToBoard]);

  // ── Sync canvas on undo/redo ──────────────────────────────────────────────
  const prevStrokesRef = useRef(strokes);
  useEffect(() => {
    if (prevStrokesRef.current !== strokes) {
      canvasRef.current?.redrawAll(strokes);
      prevStrokesRef.current = strokes;
    }
  }, [strokes]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStrokeComplete = useCallback((stroke: Stroke) => {
    pushStroke(stroke);
  }, [pushStroke]);

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    canvasRef.current?.redrawAll(past[past.length - 1]);
    undo();
  }, [canUndo, past, undo]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    canvasRef.current?.redrawAll(future[0]);
    redo();
  }, [canRedo, future, redo]);

  const handleClear = useCallback(() => {
    if (strokes.length === 0) return;
    canvasRef.current?.clearDrawing();
    reset([]);
    addToast('Canvas cleared', 'info');
  }, [strokes.length, reset, addToast]);

  const handleSave = useCallback(async () => {
    if (user) {
      await cloudSave();
      addToast('Saved to cloud ☁️', 'success');
    } else {
      addToast('Sign in to save to cloud', 'info');
    }
  }, [user, cloudSave, addToast]);

  const handleExportPNG = useCallback(() => {
    const url = canvasRef.current?.exportImage();
    if (!url) { addToast('Nothing to export', 'info'); return; }
    exportDrawingPNG(url);
    addToast('PNG exported', 'success');
  }, [addToast]);

  const handleCreateRoom = useCallback(async () => {
    try {
      addToast('Creating room…', 'info');
      const room = await createRoom({ userId: user?.id, name: activeBoard?.name ?? 'Drawing Room' });
      navigate(`/room/${room.roomId}`);
    } catch {
      addToast('Failed to create room', 'error');
    }
  }, [user?.id, activeBoard?.name, navigate, addToast]);

  const handleJoinRoom = useCallback((code: string) => {
    navigate(`/room/${code}`);
  }, [navigate]);

  const handleScribble = useCallback(() => {
    navigate('/games');
  }, [navigate]);

  const handleNewBoard = useCallback(() => {
    // Save current strokes to active board first
    if (activeBoardId) {
      const thumb = canvasRef.current?.exportImage() ?? '';
      saveToBoard(activeBoardId, strokes, thumb);
    }
    const board = newBoard();
    reset([]);
    canvasRef.current?.clearDrawing();
    addToast(`New board: ${board.name}`, 'success');
  }, [activeBoardId, strokes, saveToBoard, newBoard, reset, addToast]);

  const handleSelectBoard = useCallback((id: string) => {
    // Save current board first
    if (activeBoardId && activeBoardId !== id) {
      const thumb = canvasRef.current?.exportImage() ?? '';
      saveToBoard(activeBoardId, strokes, thumb);
    }
    selectBoard(id);
  }, [activeBoardId, strokes, saveToBoard, selectBoard]);

  const handleSettingsChange = useCallback((p: Partial<ToolSettings>) => {
    setSettings(s => ({ ...s, ...p }));
  }, []);

  useKeyboardShortcuts({
    onUndo:    handleUndo,
    onRedo:    handleRedo,
    onSetTool: (tool) => setSettings(s => ({ ...s, tool })),
    onSave:    handleSave,
  });

  // Redirect from URL param if present
  useEffect(() => {
    if (paramId) setDrawingId(paramId);
  }, [paramId]);

  const isEmpty = strokes.length === 0;
  const zoomFactor = zoom / 100;

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: '#1a1a1a' }}>
      {/* Left sidebar */}
      <BoardsSidebar
        boards={boards}
        activeBoardId={activeBoardId}
        onSelect={handleSelectBoard}
        onNew={handleNewBoard}
        onDelete={deleteBoard}
        onRename={renameBoard}
      />

      {/* Main area — column: toolbar / (canvas + AI panel) / zoom bar */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top toolbar */}
        <PaintToolbar
          settings={settings}
          canUndo={canUndo}
          canRedo={canRedo}
          saveStatus={user ? cloudStatus : undefined}
          title={activeBoard?.name}
          aiOpen={aiOpen}
          onSettingsChange={handleSettingsChange}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          onExport={handleExportPNG}
          onSave={handleSave}
          onToggleAI={() => setAiOpen(v => !v)}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onScribble={handleScribble}
        />

        {/* Middle row: canvas + AI panel */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Canvas area */}
          <div className="flex-1 relative overflow-hidden" style={{ background: '#f2f2f2' }}>
            <DotGrid />
            <div className="absolute inset-0 overflow-hidden">
              <div style={{ transform: `scale(${zoomFactor})`, transformOrigin: 'center center', width: '100%', height: '100%' }}>
                <div
                  className="absolute"
                  style={{
                    inset: '5%',
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 4px 32px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.07)',
                    overflow: 'hidden',
                  }}
                >
                  <Canvas
                    ref={canvasRef}
                    toolSettings={settings}
                    strokes={strokes}
                    zoom={zoomFactor}
                    onStrokeComplete={handleStrokeComplete}
                  />
                  <AnimatePresence>{isEmpty && <EmptyState />}</AnimatePresence>
                </div>
              </div>
            </div>
            <FloatingPalette settings={settings} onSettingsChange={handleSettingsChange} />
          </div>

          {/* AI side panel — slides in from the right */}
          <AnimatePresence>
            {aiOpen && (
              <motion.div
                key="ai-panel"
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
                  <AIPanel onColorPick={(hex) => handleSettingsChange({ color: hex })} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom bar — zoom + file tabs */}
        <BottomBar
          zoom={zoom}
          onZoomChange={setZoom}
          boards={boards}
          activeBoardId={activeBoardId}
          onSelect={handleSelectBoard}
          onNew={handleNewBoard}
          onDelete={deleteBoard}
        />
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <PortraitOverlay />
    </div>
  );
}
