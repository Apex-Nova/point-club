import { useEffect } from 'react';
import type { ToolType } from '../types';

interface Handlers {
  onUndo: () => void;
  onRedo: () => void;
  onSetTool: (tool: ToolType) => void;
  onSave: () => void;
}

export function useKeyboardShortcuts({ onUndo, onRedo, onSetTool, onSave }: Handlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const mod = e.ctrlKey || e.metaKey;

      if (mod) {
        if (e.key === 'z' && e.shiftKey) { e.preventDefault(); onRedo(); return; }
        if (e.key === 'z')               { e.preventDefault(); onUndo(); return; }
        if (e.key === 's')               { e.preventDefault(); onSave(); return; }
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'p': onSetTool('pencil'); break;
        case 'b': onSetTool('brush');  break;
        case 'e': onSetTool('eraser'); break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onUndo, onRedo, onSetTool, onSave]);
}
