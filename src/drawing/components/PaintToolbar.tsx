import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Undo2, Redo2,
  Hand, Type, Pencil, Pen, Paintbrush, Droplets, Eraser,
  Trash2, ImageDown, CloudOff, Cloud, Loader2, CheckCheck, Sparkles,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ToolSettings, ToolType } from '../types';
import type { CloudSaveStatus } from '@/hooks/useCloudSave';
import ConnectMenu from './ConnectMenu';

const TOOL_GROUPS: { tools: { type: ToolType; icon: React.ElementType; label: string; key: string; color?: string }[] }[] = [
  {
    tools: [
      { type: 'hand',        icon: Hand,       label: 'Pan (H)',          key: 'H' },
      { type: 'text',        icon: Type,        label: 'Text (T)',         key: 'T' },
    ],
  },
  {
    tools: [
      { type: 'pencil',      icon: Pencil,      label: 'Pencil (P)',       key: 'P',  color: '#555' },
      { type: 'marker',      icon: Pen,         label: 'Marker (M)',       key: 'M',  color: '#e63946' },
      { type: 'brush',       icon: Paintbrush,  label: 'Brush (B)',        key: 'B',  color: '#4895ef' },
      { type: 'spray',       icon: Droplets,    label: 'Spray (S)',        key: 'S',  color: '#52b788' },
      { type: 'calligraphy', icon: Pen,         label: 'Calligraphy (C)',  key: 'C',  color: '#9b5de5' },
    ],
  },
  {
    tools: [
      { type: 'eraser',      icon: Eraser,      label: 'Eraser (E)',       key: 'E' },
    ],
  },
];

interface StatusConfig { icon: React.ElementType; label: string; cls: string }
const STATUS_MAP: Record<CloudSaveStatus, StatusConfig> = {
  idle:    { icon: Cloud,      label: '',         cls: 'text-gray-300' },
  unsaved: { icon: CloudOff,   label: 'Unsaved',  cls: 'text-orange-400' },
  saving:  { icon: Loader2,    label: 'Saving…',  cls: 'text-blue-400 animate-spin' },
  saved:   { icon: CheckCheck, label: 'Saved',    cls: 'text-emerald-500' },
  error:   { icon: CloudOff,   label: 'Error',    cls: 'text-red-400' },
};

interface Props {
  settings: ToolSettings;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus?: CloudSaveStatus;
  title?: string;
  aiOpen?: boolean;
  onSettingsChange: (p: Partial<ToolSettings>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  onSave: () => void;
  onToggleAI: () => void;
  onCreateRoom?: () => Promise<void>;
  onJoinRoom?: (code: string) => void;
  onScribble?: () => void;
  /** Optional slot rendered after the AI button — use for room-specific controls */
  rightSlot?: React.ReactNode;
}

function Sep() {
  return <div className="w-px h-6 rounded-full mx-1" style={{ background: '#e8e8e8' }} />;
}

export default function PaintToolbar({
  settings, canUndo, canRedo, saveStatus, title, aiOpen,
  onSettingsChange, onUndo, onRedo, onClear, onExport, onSave,
  onToggleAI, onCreateRoom, onJoinRoom, onScribble, rightSlot,
}: Props) {
  const st = saveStatus ? STATUS_MAP[saveStatus] : null;

  return (
    <div
      className="flex items-center px-3 gap-1 shrink-0 z-20"
      style={{ height: 52, background: '#fff', borderBottom: '1px solid #ebebeb' }}
    >
      {/* Back */}
      <Link
        to="/dashboard"
        className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-gray-100 transition-colors shrink-0"
        title="Back to Dashboard"
      >
        <ArrowLeft size={16} className="text-gray-500" />
      </Link>

      {/* Undo / Redo */}
      <button
        onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)"
        className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
          canUndo ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed')}
      >
        <Undo2 size={15} />
      </button>
      <button
        onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)"
        className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
          canRedo ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed')}
      >
        <Redo2 size={15} />
      </button>

      <Sep />

      {/* Tool groups */}
      {TOOL_GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {group.tools.map(({ type, icon: Icon, label, color }) => {
            const active = settings.tool === type;
            return (
              <motion.button
                key={type}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onSettingsChange({ tool: type })}
                title={label}
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-100',
                  active ? 'shadow-sm' : 'hover:bg-gray-100',
                )}
                style={active ? { background: color ? `${color}22` : '#4361ee18', boxShadow: `0 0 0 2px ${color ?? '#4361ee'}` } : {}}
              >
                <Icon size={15} style={{ color: active ? (color ?? '#4361ee') : '#555' }} />
              </motion.button>
            );
          })}
          {gi < TOOL_GROUPS.length - 1 && <Sep />}
        </div>
      ))}

      <Sep />

      {/* Clear */}
      <motion.button
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
        onClick={onClear} title="Clear canvas"
        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors"
      >
        <Trash2 size={15} className="text-gray-400 hover:text-red-400" />
      </motion.button>

      {/* Title (center) */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        <span className="text-sm font-semibold text-gray-500 truncate max-w-[200px]">
          {title ?? 'Untitled'}
        </span>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Cloud save status */}
        {st && (
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            title="Save"
          >
            <st.icon size={13} className={st.cls} />
            {st.label && <span className={`text-xs font-medium ${st.cls}`}>{st.label}</span>}
          </button>
        )}

        {/* Export */}
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={onExport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
          style={{ background: '#f0f0f0', color: '#555' }}
          title="Export PNG"
        >
          <ImageDown size={13} />
          Export
        </motion.button>

        {/* AI toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onToggleAI}
          title="AI Assistant"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all"
          style={{
            background: aiOpen ? '#9b5de522' : '#f0f0f0',
            color: aiOpen ? '#9b5de5' : '#888',
            boxShadow: aiOpen ? '0 0 0 1.5px #9b5de5' : undefined,
          }}
        >
          <Sparkles size={13} />
          AI
        </motion.button>

        {/* Multiplayer connect — only in solo draw mode */}
        {onCreateRoom && onJoinRoom && onScribble && (
          <ConnectMenu
            onCreateRoom={onCreateRoom}
            onJoinRoom={onJoinRoom}
            onScribble={onScribble}
          />
        )}

        {/* Room-specific slot (voice, invite, status…) */}
        {rightSlot}
      </div>
    </div>
  );
}
