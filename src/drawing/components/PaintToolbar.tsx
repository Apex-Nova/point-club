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

const TOOLS: { type: ToolType; icon: React.ElementType; label: string; key: string; color?: string }[] = [
  { type: 'pencil',      icon: Pencil,     label: 'Pencil (P)',      key: 'P', color: '#555'    },
  { type: 'brush',       icon: Paintbrush, label: 'Brush (B)',       key: 'B', color: '#4895ef' },
  { type: 'marker',      icon: Pen,        label: 'Marker (M)',      key: 'M', color: '#e63946' },
  { type: 'spray',       icon: Droplets,   label: 'Spray (S)',       key: 'S', color: '#52b788' },
  { type: 'eraser',      icon: Eraser,     label: 'Eraser (E)',      key: 'E'                   },
  { type: 'hand',        icon: Hand,       label: 'Pan (H)',         key: 'H'                   },
  { type: 'text',        icon: Type,       label: 'Text (T)',        key: 'T'                   },
];

const STATUS_MAP: Record<CloudSaveStatus, { icon: React.ElementType; cls: string; tip: string }> = {
  idle:    { icon: Cloud,      cls: 'text-gray-300',              tip: 'Saved'      },
  unsaved: { icon: CloudOff,   cls: 'text-orange-400',            tip: 'Unsaved'    },
  saving:  { icon: Loader2,    cls: 'text-blue-400 animate-spin', tip: 'Saving…'    },
  saved:   { icon: CheckCheck, cls: 'text-emerald-500',           tip: 'Saved'      },
  error:   { icon: CloudOff,   cls: 'text-red-400',               tip: 'Save error' },
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
  rightSlot?: React.ReactNode;
}

function Sep() {
  return <div className="w-px h-5 rounded-full shrink-0" style={{ background: '#e8e8e8' }} />;
}

function IconBtn({
  onClick, disabled, title, active, activeColor, children, className, style,
}: {
  onClick?: () => void;
  disabled?: boolean;
  title: string;
  active?: boolean;
  activeColor?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.1 } : {}}
      whileTap={!disabled ? { scale: 0.9 } : {}}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0',
        active ? 'shadow-sm' : disabled ? 'opacity-25 cursor-not-allowed' : 'hover:bg-gray-100',
        className,
      )}
      style={active && activeColor
        ? { background: `${activeColor}18`, boxShadow: `0 0 0 1.5px ${activeColor}`, ...style }
        : style}
    >
      {children}
    </motion.button>
  );
}

export default function PaintToolbar({
  settings, canUndo, canRedo, saveStatus, title, aiOpen,
  onSettingsChange, onUndo, onRedo, onClear, onExport, onSave,
  onToggleAI, onCreateRoom, onJoinRoom, onScribble, rightSlot,
}: Props) {
  const st = saveStatus ? STATUS_MAP[saveStatus] : null;

  return (
    <div
      className="flex items-center px-2 gap-1 shrink-0 z-20"
      style={{ height: 44, background: '#fff', borderBottom: '1px solid #ebebeb' }}
    >
      {/* Back */}
      <Link
        to="/dashboard"
        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors shrink-0"
        title="Back to Dashboard"
      >
        <ArrowLeft size={15} className="text-gray-400" />
      </Link>

      <Sep />

      {/* Undo / Redo */}
      <IconBtn onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        <Undo2 size={14} className={canUndo ? 'text-gray-600' : 'text-gray-300'} />
      </IconBtn>
      <IconBtn onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
        <Redo2 size={14} className={canRedo ? 'text-gray-600' : 'text-gray-300'} />
      </IconBtn>

      <Sep />

      {/* Tools */}
      {TOOLS.map(({ type, icon: Icon, label, color }) => {
        const active = settings.tool === type;
        return (
          <IconBtn
            key={type}
            onClick={() => onSettingsChange({ tool: type })}
            title={label}
            active={active}
            activeColor={color ?? '#4361ee'}
          >
            <Icon size={14} style={{ color: active ? (color ?? '#4361ee') : '#666' }} />
          </IconBtn>
        );
      })}

      <Sep />

      {/* Clear */}
      <IconBtn onClick={onClear} title="Clear canvas">
        <Trash2 size={14} className="text-gray-400 hover:text-red-400 transition-colors" />
      </IconBtn>

      {/* Title — center */}
      <div className="flex-1 flex items-center justify-center min-w-0 px-2">
        <span className="text-xs font-semibold text-gray-400 truncate max-w-[180px]">
          {title ?? 'Untitled'}
        </span>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Save status */}
        {st && (
          <IconBtn onClick={onSave} title={st.tip}>
            <st.icon size={13} className={st.cls} />
          </IconBtn>
        )}

        {/* Export */}
        <IconBtn onClick={onExport} title="Export PNG">
          <ImageDown size={14} className="text-gray-500" />
        </IconBtn>

        <Sep />

        {/* AI */}
        <IconBtn
          onClick={onToggleAI}
          title="AI Assistant"
          active={aiOpen}
          activeColor="#9b5de5"
        >
          <Sparkles size={14} style={{ color: aiOpen ? '#9b5de5' : '#888' }} />
        </IconBtn>

        {/* Multiplayer connect */}
        {onCreateRoom && onJoinRoom && onScribble && (
          <ConnectMenu
            onCreateRoom={onCreateRoom}
            onJoinRoom={onJoinRoom}
            onScribble={onScribble}
          />
        )}

        {/* Room-specific slot */}
        {rightSlot}
      </div>
    </div>
  );
}
