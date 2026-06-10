import { useState, useEffect, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import type { GameType } from '@/lib/services/games.service';
import type { Stroke } from '@/drawing/types';

export type GamePhase = 'lobby' | 'countdown' | 'choosing' | 'drawing' | 'voting' | 'results' | 'finished';

export interface GamePlayer { userId: string; username: string; score: number }
export interface Submission  { userId: string; username: string; canvasData?: string; votes: number }

export interface GameRoomState {
  gameId:           string | null;
  roomCode:         string | null;
  type:             GameType | null;
  hostId:           string | null;
  phase:            GamePhase;
  players:          GamePlayer[];
  prompt:           string | null;
  secretWord:       string | null;
  wordLength:       number;
  wordChoices:      string[];
  correctGuessers:  string[];
  drawerId:         string | null;
  drawerName:       string | null;
  countdown:        number;
  timeLeft:         number;
  roundTimeS:       number;
  round:            number;
  maxRounds:        number;
  submissions:      Submission[];
  leaderboard:      GamePlayer[];
  chatMessages:     { userId: string; username: string; message: string; correct: boolean; points?: number }[];
  remoteStrokes:    Stroke[];       // completed strokes from drawer
  liveStroke:       Stroke | null;  // in-progress stroke being drawn right now
  clearTick:        number;
  error:            string | null;
}

const INITIAL: GameRoomState = {
  gameId: null, roomCode: null, type: null, hostId: null, phase: 'lobby',
  players: [], prompt: null, secretWord: null,
  wordLength: 0, wordChoices: [], correctGuessers: [],
  drawerId: null, drawerName: null,
  countdown: 3, timeLeft: 0, roundTimeS: 90,
  round: 1, maxRounds: 3,
  submissions: [], leaderboard: [], chatMessages: [],
  remoteStrokes: [], liveStroke: null, clearTick: 0,
  error: null,
};

export function useGameRoom(socket: Socket | null) {
  const [state, setState] = useState<GameRoomState>(INITIAL);

  const patch = useCallback((p: Partial<GameRoomState>) => setState(s => ({ ...s, ...p })), []);

  // Client-side countdown timer
  useEffect(() => {
    if (state.phase !== 'drawing' || state.timeLeft <= 0) return;
    const id = setInterval(() => setState(s => ({ ...s, timeLeft: Math.max(0, s.timeLeft - 1) })), 1000);
    return () => clearInterval(id);
  }, [state.phase, state.timeLeft]);

  useEffect(() => {
    if (!socket) return;

    socket.on('game:created', ({ gameId, roomCode, type, hostId, players }: { gameId: string; roomCode: string; type: GameType; hostId: string; players: GamePlayer[] }) =>
      patch({ gameId, roomCode, type, hostId, players: players ?? [], phase: 'lobby' }));

    socket.on('game:joined', ({ gameId, roomCode, type, status, hostId, players }: {
      gameId: string; roomCode: string; type: GameType; status: GamePhase; hostId: string; players: GamePlayer[];
    }) => patch({ gameId, roomCode, type, hostId, phase: status, players }));

    socket.on('game:player-joined', ({ userId, username }: { userId: string; username: string }) =>
      setState(s => ({ ...s, players: [...s.players.filter(p => p.userId !== userId), { userId, username, score: 0 }] })));

    socket.on('game:player-left', ({ userId }: { userId: string }) =>
      setState(s => ({ ...s, players: s.players.filter(p => p.userId !== userId) })));

    socket.on('game:countdown', ({ count, prompt }: { count: number; prompt?: string }) =>
      patch({ phase: 'countdown', countdown: count, prompt: prompt ?? null }));

    // Drawer is picking a word
    socket.on('game:choosing-word', ({ drawerName }: { drawerName: string }) =>
      patch({ phase: 'choosing', drawerName }));

    // Only sent to the drawer
    socket.on('game:word-choices', ({ words }: { words: string[] }) =>
      patch({ phase: 'choosing', wordChoices: words }));

    socket.on('game:drawing-start', ({ timeS, prompt, drawerId, drawerName, round, maxRounds, wordLength }: {
      timeS: number; prompt?: string; drawerId?: string; drawerName?: string;
      round: number; maxRounds: number; wordLength?: number;
    }) => patch({
      phase: 'drawing', timeLeft: timeS, roundTimeS: timeS,
      prompt: prompt ?? null, drawerId: drawerId ?? null,
      drawerName: drawerName ?? null, round, maxRounds,
      wordLength: wordLength ?? 0,
      remoteStrokes: [], clearTick: 0, wordChoices: [], correctGuessers: [],
    }));

    socket.on('game:secret-word', ({ word }: { word: string }) =>
      patch({ secretWord: word, wordLength: word.length }));

    // Live stroke while drawer is actively drawing (sent every ~50ms)
    socket.on('game:live-stroke', ({ stroke }: { stroke: Stroke }) =>
      setState(s => ({ ...s, liveStroke: stroke })));

    // Completed stroke from drawer
    socket.on('game:stroke', ({ stroke }: { stroke: Stroke }) =>
      setState(s => ({ ...s, remoteStrokes: [...s.remoteStrokes, stroke], liveStroke: null })));

    socket.on('game:clear-canvas', () =>
      setState(s => ({ ...s, remoteStrokes: [], liveStroke: null, clearTick: s.clearTick + 1 })));

    socket.on('game:rounds-updated', ({ maxRounds }: { maxRounds: number }) =>
      patch({ maxRounds }));

    socket.on('game:voting-start', ({ submissions }: { submissions: Submission[] }) =>
      patch({ phase: 'voting', submissions }));

    socket.on('game:vote-cast', ({ targetUserId }: { targetUserId: string }) =>
      setState(s => ({
        ...s,
        submissions: s.submissions.map(sub =>
          sub.userId === targetUserId ? { ...sub, votes: sub.votes + 1 } : sub),
      })));

    socket.on('game:round-results', ({ leaderboard, secretWord, round, maxRounds }: {
      leaderboard: GamePlayer[]; secretWord?: string; round: number; maxRounds: number;
    }) => patch({ phase: 'results', leaderboard, secretWord: secretWord ?? null, round, maxRounds }));

    socket.on('game:finished', ({ leaderboard }: { leaderboard: GamePlayer[] }) =>
      patch({ phase: 'finished', leaderboard }));

    socket.on('game:new-round', ({ round }: { round: number }) =>
      patch({ round, submissions: [], chatMessages: [], secretWord: null, wordLength: 0, correctGuessers: [], remoteStrokes: [], liveStroke: null }));

    socket.on('game:chat', (msg: { userId: string; username: string; message: string; correct: boolean }) =>
      setState(s => ({ ...s, chatMessages: [...s.chatMessages.slice(-99), msg] })));

    socket.on('game:correct-guess', ({ userId, username, points }: { userId: string; username: string; points: number }) =>
      setState(s => ({
        ...s,
        correctGuessers: [...s.correctGuessers, userId],
        players: s.players.map(p => p.userId === userId ? { ...p, score: p.score + points } : p),
        chatMessages: [...s.chatMessages, { userId, username, message: `Guessed it! +${points} pts`, correct: true, points }],
      })));

    socket.on('game:error', ({ message }: { message: string }) => patch({ error: message }));

    socket.on('game:list', ({ games }: { games: unknown }) => socket.emit('_game_list_response', games));

    return () => {
      [
        'game:created','game:joined','game:player-joined','game:player-left',
        'game:countdown','game:choosing-word','game:word-choices',
        'game:drawing-start','game:secret-word','game:live-stroke','game:stroke','game:clear-canvas','game:rounds-updated',
        'game:voting-start','game:vote-cast','game:round-results',
        'game:finished','game:new-round','game:chat','game:correct-guess',
        'game:error','game:list',
      ].forEach(e => socket.off(e));
    };
  }, [socket, patch]);

  const createGame = useCallback((type: GameType, opts: { maxRounds?: number; roundTimeS?: number; isPublic?: boolean } = {}) => {
    socket?.emit('game:create', { type, ...opts });
  }, [socket]);

  const joinGame = useCallback((gameId?: string, roomCode?: string) => {
    socket?.emit('game:join', { gameId, roomCode });
  }, [socket]);

  const startGame = useCallback(() => {
    if (state.gameId) socket?.emit('game:start', { gameId: state.gameId });
  }, [socket, state.gameId]);

  const selectWord = useCallback((word: string) => {
    if (state.gameId) socket?.emit('game:select-word', { gameId: state.gameId, word });
  }, [socket, state.gameId]);

  const sendLiveStroke = useCallback((stroke: Stroke) => {
    if (state.gameId) socket?.emit('game:live-stroke', { gameId: state.gameId, stroke });
  }, [socket, state.gameId]);

  const sendStroke = useCallback((stroke: Stroke) => {
    if (state.gameId) socket?.emit('game:stroke', { gameId: state.gameId, stroke });
  }, [socket, state.gameId]);

  const setRounds = useCallback((maxRounds: number) => {
    if (state.gameId) socket?.emit('game:set-rounds', { gameId: state.gameId, maxRounds });
  }, [socket, state.gameId]);

  const clearCanvas = useCallback(() => {
    if (state.gameId) socket?.emit('game:clear-canvas', { gameId: state.gameId });
  }, [socket, state.gameId]);

  const submitDrawing = useCallback((canvasData?: string) => {
    if (state.gameId) socket?.emit('game:submit-drawing', { gameId: state.gameId, canvasData });
  }, [socket, state.gameId]);

  const castVote = useCallback((targetUserId: string) => {
    if (state.gameId) socket?.emit('game:vote', { gameId: state.gameId, targetUserId });
  }, [socket, state.gameId]);

  const sendGuess = useCallback((guess: string) => {
    if (state.gameId) socket?.emit('game:guess', { gameId: state.gameId, guess });
  }, [socket, state.gameId]);

  const leaveGame = useCallback(() => {
    if (state.gameId) {
      socket?.emit('game:leave', { gameId: state.gameId });
      setState(INITIAL);
    }
  }, [socket, state.gameId]);

  const listGames = useCallback(() => {
    socket?.emit('game:list');
  }, [socket]);

  return {
    state,
    createGame, joinGame, startGame,
    selectWord, sendLiveStroke, sendStroke, clearCanvas,
    setRounds, submitDrawing, castVote, sendGuess,
    leaveGame, listGames,
  };
}
