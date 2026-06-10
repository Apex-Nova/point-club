import type { DrawingData, Stroke } from '../types';

const STORAGE_KEY = 'pointclub_drawing_v1';

export function saveDrawing(strokes: Stroke[]): void {
  const data: DrawingData = { version: 1, strokes, savedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadDrawing(): Stroke[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as DrawingData;
    if (data.version !== 1 || !Array.isArray(data.strokes)) return null;
    return data.strokes;
  } catch {
    return null;
  }
}

export function clearSavedDrawing(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportDrawingPNG(dataUrl: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `point-club-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function exportDrawingJSON(strokes: Stroke[]): void {
  const data: DrawingData = { version: 1, strokes, savedAt: Date.now() };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `point-club-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importDrawingJSON(): Promise<Stroke[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('No file selected'));
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string) as DrawingData;
          if (!Array.isArray(data.strokes)) throw new Error('Invalid format');
          resolve(data.strokes);
        } catch {
          reject(new Error('Invalid file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };
    input.click();
  });
}
