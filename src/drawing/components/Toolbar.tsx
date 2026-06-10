import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil, Paintbrush, Eraser,
  Undo2, Redo2, Trash2, Download, FolderOpen,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ToolSettings, ToolType } from '../types';
import ColorPicker from './ColorPicker';
import StrokeWidthPicker from './StrokeWidthPicker';

interface Props {
  settings: ToolSettings;
  canUndo: boolean;
  canRedo: boolean;
  onSettingsChange: (s: Partial<ToolSettings>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  onLoad: () => void;
}

type Panel = 'color' | 'width' | null;

const TOOL_BUTTONS: { tool: ToolType; icon: React.ElementType; label: string; shortcut: string }[] = [
  { tool: 'pencil', icon: Pencil,      label: 'Pencil', shortcut: 'P' },
  { tool: 'brush',  icon: Paintbrush,  label: 'Brush',  shortcut: 'B' },
  { tool: 'eraser', icon: Eraser,      label: 'Eraser', shortcut: 'E' },
];

function ToolBtn({
  active, onClick, icon: Icon, label, shortcut,
}: {
  active: boolean; onClick: () => void;
  icon: React.ElementType; label: string; shortcut: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      title={`${label} (${shortcut})`}
      className={cn(
        'relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-150',
        active
          ? 'bg-lavender text-white shadow-md'
          : 'text-gray-500 hover:bg-cream hover:text-lavender-dark',
      )}
    >
      <Icon size={16} />
    </motion.button>
  );
}

function ActionBtn({
  onClick, icon: Icon, label, disabled,
}: {
  onClick: () => void; icon: React.ElementType; label: string; disabled?: boolean;
}) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.08 }}
      whileTap={disabled ? {} : { scale: 0.94 }}
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-150',
        disabled
          ? 'text-gray-300 cursor-not-allowed'
          : 'text-gray-500 hover:bg-cream hover:text-gray-800',
      )}
    >
      <Icon size={16} />
    </motion.button>
  );
}

const Divider = () => <div className="w-px h-6 bg-cream-dark mx-auto shrink-0" />;

export default function Toolbar({
  settings, canUndo, canRedo,
  onSettingsChange, onUndo, onRedo, onClear, onSave, onLoad,
}: Props) {
  const [openPanel, setOpenPanel] = useState<Panel>(null);
  const panelRef   = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const togglePanel = (panel: Panel) =>
    setOpenPanel(prev => (prev === panel ? null : panel));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current   && !panelRef.current.contains(e.target as Node) &&
        toolbarRef.current && !toolbarRef.current.contains(e.target as Node)
      ) {
        setOpenPanel(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <motion.div
      ref={toolbarRef}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-1 w-12 py-3 bg-white border-r border-cream-dark shrink-0 relative overflow-y-auto"
    >
      {/* Tool buttons */}
      {TOOL_BUTTONS.map(({ tool, icon, label, shortcut }) => (
        <ToolBtn
          key={tool}
          active={settings.tool === tool}
          onClick={() => onSettingsChange({ tool })}
          icon={icon}
          label={label}
          shortcut={shortcut}
        />
      ))}

      <Divider />

      {/* Color swatch */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => togglePanel('color')}
          title="Color"
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center',
            openPanel === 'color' ? 'ring-2 ring-lavender' : '',
          )}
        >
          <div
            className="w-5 h-5 rounded-md border-2 border-white shadow-md"
            style={{ background: settings.color }}
          />
        </motion.button>
        <AnimatePresence>
          {openPanel === 'color' && (
            <div ref={panelRef} className="absolute left-full ml-2 top-0 z-50">
              <ColorPicker
                color={settings.color}
                onChange={(c) => { onSettingsChange({ color: c }); }}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Stroke width */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => togglePanel('width')}
          title="Stroke width"
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center',
            openPanel === 'width' ? 'bg-cream' : 'hover:bg-cream',
          )}
        >
          <div className="flex flex-col items-center justify-center gap-0.5">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className="rounded-full"
                style={{ width: 6 + n * 3, height: n, background: '#888' }}
              />
            ))}
          </div>
        </motion.button>
        <AnimatePresence>
          {openPanel === 'width' && (
            <div ref={panelRef} className="absolute left-full ml-2 top-0 z-50">
              <StrokeWidthPicker
                width={settings.width}
                color={settings.color}
                onChange={(w) => { onSettingsChange({ width: w }); setOpenPanel(null); }}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      <Divider />

      <ActionBtn onClick={onUndo}  icon={Undo2}     label="Undo (Ctrl+Z)"       disabled={!canUndo} />
      <ActionBtn onClick={onRedo}  icon={Redo2}     label="Redo (Ctrl+Shift+Z)" disabled={!canRedo} />

      <Divider />

      <ActionBtn onClick={onClear} icon={Trash2}    label="Clear canvas" />
      <ActionBtn onClick={onSave}  icon={Download}  label="Save drawing" />
      <ActionBtn onClick={onLoad}  icon={FolderOpen} label="Load drawing" />
    </motion.div>
  );
}
