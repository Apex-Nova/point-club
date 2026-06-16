import type { Server, Socket } from 'socket.io';
import gameManager from '../games/GameManager';
import type { GameType } from '../games/GameManager';
import { supabaseAdmin } from '../db';

const COUNTDOWN_S     = 3;
const WORD_CHOICE_S   = 15; // seconds drawer has to pick a word

function broadcast(io: Server, gameId: string, event: string, payload: unknown) {
  io.to(`game:${gameId}`).emit(event, payload);
}

function startCountdown(io: Server, gameId: string) {
  const game = gameManager.get(gameId);
  if (!game) return;

  game.status = 'countdown';
  let count = COUNTDOWN_S;
  broadcast(io, gameId, 'game:countdown', { count, prompt: game.type !== 'guess' ? game.prompt : '???' });

  const tick = setInterval(() => {
    count--;
    broadcast(io, gameId, 'game:countdown', { count, prompt: game.type !== 'guess' ? game.prompt : '???' });
    if (count <= 0) {
      clearInterval(tick);
      if (game.type === 'guess') {
        offerWordChoice(io, gameId);
      } else {
        startDrawing(io, gameId);
      }
    }
  }, 1000);
}

function offerWordChoice(io: Server, gameId: string) {
  const game = gameManager.get(gameId);
  if (!game || !game.drawerId) { startDrawing(io, gameId); return; }

  const words  = gameManager.pickWordChoices(game);
  const drawer = game.players.get(game.drawerId);
  if (drawer) {
    io.to(drawer.socketId).emit('game:word-choices', { words });
  }
  // Notify guessers that drawer is choosing
  broadcast(io, gameId, 'game:choosing-word', { drawerName: drawer?.username ?? '' });

  // Auto-select first word if drawer doesn't pick in time
  game.wordChoiceTimer = setTimeout(() => {
    gameManager.selectWord(game, words[0]);
    startDrawing(io, gameId);
  }, WORD_CHOICE_S * 1000);
}

function startDrawing(io: Server, gameId: string) {
  const game = gameManager.get(gameId);
  if (!game) return;
  game.status    = 'drawing';
  game.startedAt = Date.now();

  // Send secret word only to drawer in guess mode
  if (game.type === 'guess' && game.drawerId) {
    const drawer = game.players.get(game.drawerId);
    if (drawer) {
      io.to(drawer.socketId).emit('game:secret-word', { word: game.secretWord });
    }
  }

  broadcast(io, gameId, 'game:drawing-start', {
    round:      game.currentRound,
    maxRounds:  game.maxRounds,
    timeS:      game.roundTimeS,
    prompt:     game.type === 'guess' ? undefined : game.prompt,
    drawerId:   game.drawerId,
    drawerName: game.drawerId ? game.players.get(game.drawerId)?.username : undefined,
    wordLength: game.type === 'guess' ? game.wordLength : undefined,
  });

  // Auto-end when timer expires
  game.timerRef = setTimeout(() => endDrawing(io, gameId), game.roundTimeS * 1000);
}

function endDrawing(io: Server, gameId: string) {
  const game = gameManager.get(gameId);
  if (!game || game.status === 'voting' || game.status === 'results') return;

  if (game.type === 'battle' || game.type === 'blind') {
    game.status = 'voting';
    broadcast(io, gameId, 'game:voting-start', {
      submissions: Array.from(game.submissions.entries()).map(([uid, s]) => ({
        userId: uid, username: s.username, canvasData: s.canvasData, votes: 0,
      })),
    });
    game.timerRef = setTimeout(() => finishRound(io, gameId), 30_000);
  } else {
    finishRound(io, gameId);
  }
}

function finishRound(io: Server, gameId: string) {
  const game = gameManager.get(gameId);
  if (!game) return;
  game.status = 'results';
  const leaderboard = gameManager.getLeaderboard(gameId);
  broadcast(io, gameId, 'game:round-results', {
    leaderboard: leaderboard.map(p => ({ userId: p.userId, username: p.username, score: p.score })),
    secretWord:  game.type === 'guess' ? game.secretWord : undefined,
    round:       game.currentRound,
    maxRounds:   game.maxRounds,
  });

  game.timerRef = setTimeout(() => {
    const advanced = gameManager.advanceRound(game);
    if (advanced) {
      broadcast(io, gameId, 'game:new-round', { round: game.currentRound });
      startCountdown(io, gameId);
    } else {
      broadcast(io, gameId, 'game:finished', {
        leaderboard: gameManager.getLeaderboard(gameId).map(p => ({
          userId: p.userId, username: p.username, score: p.score,
        })),
      });
      game.players.forEach((player, uid) => {
        if (!uid.startsWith('guest')) {
          void supabaseAdmin?.from('xp_events').insert({
            user_id: uid,
            source:  player.score > 0 ? 'game_win' : 'game_play',
            amount:  player.score > 0 ? 30 : 10,
            description: `${game.type} game`,
          });
        }
      });
      setTimeout(() => gameManager.delete(gameId), 60_000);
    }
  }, 5_000);
}

export function registerGameHandlers(io: Server, socket: Socket) {
  const uid   = () => (socket.data.userId   as string | undefined) ?? `guest_${socket.id.slice(0, 8)}`;
  const uname = () => (socket.data.username as string | undefined) ?? `Guest_${socket.id.slice(0, 4)}`;

  // ── Create game ──────────────────────────────────────────────
  socket.on('game:create', ({ type, maxRounds, roundTimeS, isPublic }: {
    type: GameType; maxRounds?: number; roundTimeS?: number; isPublic?: boolean;
  }) => {
    const userId = uid();
    const game = gameManager.create(type, userId, { maxRounds, roundTimeS, isPublic });
    gameManager.addPlayer(game.id, { userId, socketId: socket.id, username: uname() });
    void socket.join(`game:${game.id}`);
    socket.emit('game:created', {
      gameId:   game.id,
      roomCode: game.roomCode,
      type:     game.type,
      hostId:   game.hostId,
      players:  Array.from(game.players.values()).map(p => ({ userId: p.userId, username: p.username, score: p.score })),
    });
  });

  // ── Join game ────────────────────────────────────────────────
  socket.on('game:join', ({ gameId, roomCode }: { gameId?: string; roomCode?: string }) => {
    const userId = uid();
    const game = gameId
      ? gameManager.get(gameId)
      : roomCode ? gameManager.getByCode(roomCode) : undefined;
    if (!game) { socket.emit('game:error', { message: 'Game not found' }); return; }

    const joined = gameManager.addPlayer(game.id, { userId, socketId: socket.id, username: uname() });
    if (!joined) { socket.emit('game:error', { message: 'Game is full or already started' }); return; }

    void socket.join(`game:${game.id}`);
    socket.emit('game:joined', {
      gameId:   game.id,
      roomCode: game.roomCode,
      type:     game.type,
      status:   game.status,
      hostId:   game.hostId,
      players:  Array.from(game.players.values()).map(p => ({ userId: p.userId, username: p.username, score: p.score })),
    });
    broadcast(io, game.id, 'game:player-joined', { userId, username: uname() });
  });

  // ── Start game (host only) ───────────────────────────────────
  socket.on('game:start', ({ gameId }: { gameId: string }) => {
    const userId = uid();
    const game   = gameManager.get(gameId);
    if (!game || game.hostId !== userId) return;
    if (game.players.size < 1) { socket.emit('game:error', { message: 'Need at least 1 player' }); return; }
    gameManager.startGame(game); // startGame already calls pickPrompt internally
    startCountdown(io, gameId);
  });

  // ── Drawer selects word ──────────────────────────────────────
  socket.on('game:select-word', ({ gameId, word }: { gameId: string; word: string }) => {
    const userId = uid();
    const game   = gameManager.get(gameId);
    if (!game || game.drawerId !== userId) return;
    clearTimeout(game.wordChoiceTimer);
    gameManager.selectWord(game, word);
    startDrawing(io, gameId);
  });

  // ── Live points relay (while drawing) ───────────────────────
  socket.on('game:live-stroke', ({ gameId, stroke }: { gameId: string; stroke: unknown }) => {
    const userId = uid();
    const game   = gameManager.get(gameId);
    if (!game || game.drawerId !== userId || game.status !== 'drawing') return;
    socket.to(`game:${gameId}`).emit('game:live-stroke', { stroke });
  });

  // ── Completed stroke relay ───────────────────────────────────
  socket.on('game:stroke', ({ gameId, stroke }: { gameId: string; stroke: unknown }) => {
    const userId = uid();
    const game   = gameManager.get(gameId);
    if (!game || game.drawerId !== userId || game.status !== 'drawing') return;
    socket.to(`game:${gameId}`).emit('game:stroke', { stroke });
  });

  // ── Clear canvas relay ───────────────────────────────────────
  socket.on('game:clear-canvas', ({ gameId }: { gameId: string }) => {
    const userId = uid();
    const game   = gameManager.get(gameId);
    if (!game || game.drawerId !== userId) return;
    socket.to(`game:${gameId}`).emit('game:clear-canvas');
  });

  // ── Host updates rounds before start ─────────────────────────
  socket.on('game:set-rounds', ({ gameId, maxRounds }: { gameId: string; maxRounds: number }) => {
    const userId = uid();
    const game   = gameManager.get(gameId);
    if (!game || game.hostId !== userId || game.status !== 'lobby') return;
    game.maxRounds = Math.min(Math.max(1, maxRounds), 10);
    broadcast(io, gameId, 'game:rounds-updated', { maxRounds: game.maxRounds });
  });

  // ── Submit drawing ───────────────────────────────────────────
  socket.on('game:submit-drawing', ({ gameId, canvasData }: { gameId: string; canvasData?: string }) => {
    const userId = uid();
    if (!userId) return;
    gameManager.submitDrawing(gameId, userId, canvasData);
    broadcast(io, gameId, 'game:drawing-submitted', { userId, username: uname() });

    const game = gameManager.get(gameId);
    if (game && game.type === 'battle') {
      const allDrawn = Array.from(game.players.values()).every(p => p.hasDrawn);
      if (allDrawn) endDrawing(io, gameId);
    }
  });

  // ── Vote ─────────────────────────────────────────────────────
  socket.on('game:vote', ({ gameId, targetUserId }: { gameId: string; targetUserId: string }) => {
    const userId = uid();
    if (!userId) return;
    const voted = gameManager.recordVote(gameId, userId, targetUserId);
    if (!voted) return;
    broadcast(io, gameId, 'game:vote-cast', { voterUserId: userId, targetUserId });

    const game = gameManager.get(gameId);
    if (game) {
      const nonDrawers = Array.from(game.players.values()).filter(p => !p.isDrawer);
      if (nonDrawers.every(p => p.hasVoted)) finishRound(io, gameId);
    }
  });

  // ── Chat guess (guess mode) ──────────────────────────────────
  socket.on('game:guess', ({ gameId, guess }: { gameId: string; guess: string }) => {
    const userId = uid();
    if (!userId) return;
    const game = gameManager.get(gameId);
    if (!game || game.status !== 'drawing' || userId === game.drawerId) return;

    const { correct, points } = gameManager.recordGuess(gameId, userId, guess);
    if (correct) {
      broadcast(io, gameId, 'game:correct-guess', { userId, username: uname(), points });
      if (gameManager.allGuessed(gameId)) endDrawing(io, gameId);
    } else {
      broadcast(io, gameId, 'game:chat', { userId, username: uname(), message: guess, correct: false });
    }
  });

  // ── Leave game ───────────────────────────────────────────────
  socket.on('game:leave', ({ gameId }: { gameId: string }) => {
    const userId = uid();
    if (userId) gameManager.removePlayer(gameId, userId);
    void socket.leave(`game:${gameId}`);
    broadcast(io, gameId, 'game:player-left', { userId });
  });

  // ── List public games ────────────────────────────────────────
  socket.on('game:list', () => {
    const lobbies = gameManager.getPublicLobbies().map(g => ({
      id:          g.id,
      type:        g.type,
      roomCode:    g.roomCode,
      playerCount: g.players.size,
      maxPlayers:  8,
      hostName:    g.players.get(g.hostId)?.username ?? 'Unknown',
    }));
    socket.emit('game:list', { games: lobbies });
  });

  // ── Cleanup on disconnect ────────────────────────────────────
  socket.on('disconnect', () => {
    const userId = uid();
    if (!userId) return;
    gameManager['games'].forEach((game, gameId) => {
      if (game.players.has(userId)) {
        gameManager.removePlayer(gameId, userId);
        broadcast(io, gameId, 'game:player-left', { userId });
      }
    });
  });
}
