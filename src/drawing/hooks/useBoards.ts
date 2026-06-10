import { useState, useCallback } from 'react';
import type { Stroke } from '../types';
import { generateId } from '../utils/id';

export interface Board {
  id: string;
  name: string;
  strokes: Stroke[];
  thumbnail: string;
  updatedAt: number;
}

const KEY = 'pc_boards_v2';
const KEY_ACTIVE = 'pc_active_board_v2';

function load(): Board[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

function persist(boards: Board[]) {
  localStorage.setItem(KEY, JSON.stringify(boards));
}

export function useBoards() {
  const [boards, setBoards] = useState<Board[]>(load);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(
    () => localStorage.getItem(KEY_ACTIVE),
  );

  const save = useCallback((updated: Board[]) => {
    setBoards(updated);
    persist(updated);
  }, []);

  const newBoard = useCallback((): Board => {
    const id = generateId();
    const board: Board = { id, name: `Board ${Date.now() % 10000}`, strokes: [], thumbnail: '', updatedAt: Date.now() };
    save([...load(), board]);
    setActiveBoardId(id);
    localStorage.setItem(KEY_ACTIVE, id);
    return board;
  }, [save]);

  const selectBoard = useCallback((id: string) => {
    setActiveBoardId(id);
    localStorage.setItem(KEY_ACTIVE, id);
  }, []);

  const saveToBoard = useCallback((id: string, strokes: Stroke[], thumbnail: string, name?: string) => {
    const current = load();
    save(current.map(b =>
      b.id === id ? { ...b, strokes, thumbnail, updatedAt: Date.now(), ...(name ? { name } : {}) } : b,
    ));
  }, [save]);

  const deleteBoard = useCallback((id: string) => {
    const current = load();
    const updated = current.filter(b => b.id !== id);
    save(updated);
    if (activeBoardId === id) {
      const next = updated[0]?.id ?? null;
      setActiveBoardId(next);
      localStorage.setItem(KEY_ACTIVE, next ?? '');
    }
  }, [save, activeBoardId]);

  const renameBoard = useCallback((id: string, name: string) => {
    save(load().map(b => b.id === id ? { ...b, name } : b));
  }, [save]);

  const activeBoard = boards.find(b => b.id === activeBoardId) ?? null;

  return { boards, activeBoardId, activeBoard, newBoard, selectBoard, saveToBoard, deleteBoard, renameBoard };
}
