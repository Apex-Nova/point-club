export type ToolType =
  | 'pencil'
  | 'marker'
  | 'brush'
  | 'spray'
  | 'calligraphy'
  | 'highlighter'
  | 'eraser'
  | 'text'
  | 'hand';

export interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  tool: ToolType;
  opacity: number;
  timestamp: number;
  text?: string;      // text tool only
  fontSize?: number;  // text tool only
  userId?: string;
  sessionId?: string;
}

export interface ToolSettings {
  tool: ToolType;
  color: string;
  width: number;
}

export interface DrawingData {
  version: number;
  strokes: Stroke[];
  savedAt: number;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface CanvasHandle {
  appendStroke: (stroke: Stroke) => void;
  redrawAll: (strokes: Stroke[]) => void;
  clearDrawing: () => void;
  exportImage: () => string;
}
