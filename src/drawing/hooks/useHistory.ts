import { useReducer, useCallback } from 'react';
import type { Stroke } from '../types';

interface HistoryState {
  past: Stroke[][];
  present: Stroke[];
  future: Stroke[][];
}

type HistoryAction =
  | { type: 'PUSH'; strokes: Stroke[] }
  | { type: 'PUSH_STROKE'; stroke: Stroke }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET'; strokes?: Stroke[] };

const MAX_HISTORY = 50;

function reducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'PUSH': {
      const next = [...state.past, state.present];
      return {
        past: next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next,
        present: action.strokes,
        future: [],
      };
    }
    case 'PUSH_STROKE': {
      // Appends a single stroke to state.present inside the reducer so concurrent
      // dispatches (local + remote) never clobber each other via stale closures.
      const next = [...state.past, state.present];
      return {
        past: next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next,
        present: [...state.present, action.stroke],
        future: [],
      };
    }
    case 'UNDO':
      if (state.past.length === 0) return state;
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
      };
    case 'REDO':
      if (state.future.length === 0) return state;
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
      };
    case 'RESET':
      return { past: [], present: action.strokes ?? [], future: [] };
    default:
      return state;
  }
}

export function useHistory(initial: Stroke[] = []) {
  const [state, dispatch] = useReducer(reducer, {
    past: [],
    present: initial,
    future: [],
  });

  const push      = useCallback((strokes: Stroke[]) => dispatch({ type: 'PUSH', strokes }), []);
  const pushStroke = useCallback((stroke: Stroke)   => dispatch({ type: 'PUSH_STROKE', stroke }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const reset = useCallback((strokes?: Stroke[]) => dispatch({ type: 'RESET', strokes }), []);

  return {
    strokes: state.present,
    past: state.past,
    future: state.future,
    push,
    pushStroke,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
