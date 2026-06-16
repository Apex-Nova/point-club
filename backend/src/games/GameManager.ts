import { randomFrom, BATTLE_PROMPTS, GUESS_PROMPTS } from './prompts';

export type GameType    = 'battle' | 'guess' | 'blind' | 'story';
export type GameStatus  = 'lobby' | 'countdown' | 'drawing' | 'voting' | 'results' | 'finished';

export interface GamePlayer {
  userId:    string;
  socketId:  string;
  username:  string;
  score:     number;
  isDrawer:  boolean;
  hasDrawn:  boolean;
  hasVoted:  boolean;
  guess?:    string;   // for guess-mode
}

export interface GameSubmission {
  userId:    string;
  username:  string;
  canvasData?: string; // base64 snapshot
  votes:     number;
}

export interface GameState {
  id:              string;
  type:            GameType;
  status:          GameStatus;
  hostId:          string;
  prompt:          string;
  secretWord:      string;   // for guess mode — only sent to drawer
  wordChoices:     string[]; // 3 options shown to drawer before drawing
  wordLength:      number;   // broadcast to guessers for hint display
  correctGuessers: Set<string>; // userIds who guessed correctly this round
  players:         Map<string, GamePlayer>;
  submissions:     Map<string, GameSubmission>;
  currentRound:    number;
  maxRounds:       number;
  roundTimeS:      number;
  drawerId:        string | null; // rotating drawer for guess mode
  drawerQueue:     string[];
  timerRef?:       ReturnType<typeof setTimeout>;
  wordChoiceTimer?: ReturnType<typeof setTimeout>;
  startedAt?:      number;
  isPublic:        boolean;
  roomCode:        string;
}

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

class GameManager {
  private games = new Map<string, GameState>();

  create(type: GameType, hostId: string, opts: { maxRounds?: number; roundTimeS?: number; isPublic?: boolean } = {}): GameState {
    const id = crypto.randomUUID();
    const game: GameState = {
      id,
      type,
      status:          'lobby',
      hostId,
      prompt:          '',
      secretWord:      '',
      wordChoices:     [],
      wordLength:      0,
      correctGuessers: new Set(),
      players:         new Map(),
      submissions:     new Map(),
      currentRound:    0,
      maxRounds:       opts.maxRounds  ?? (type === 'guess' ? 4 : 1),
      roundTimeS:      opts.roundTimeS ?? (type === 'battle' ? 90 : 80),
      drawerId:        null,
      drawerQueue:     [],
      isPublic:        opts.isPublic ?? true,
      roomCode:        generateCode(),
    };
    this.games.set(id, game);
    return game;
  }

  get(id: string): GameState | undefined {
    return this.games.get(id);
  }

  getByCode(code: string): GameState | undefined {
    return Array.from(this.games.values()).find(g => g.roomCode === code);
  }

  getPublicLobbies(): GameState[] {
    return Array.from(this.games.values()).filter(g => g.isPublic && g.status === 'lobby');
  }

  addPlayer(gameId: string, player: Omit<GamePlayer, 'score' | 'isDrawer' | 'hasDrawn' | 'hasVoted'>): boolean {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'lobby') return false;
    if (game.players.size >= 8) return false;
    game.players.set(player.userId, { ...player, score: 0, isDrawer: false, hasDrawn: false, hasVoted: false });
    return true;
  }

  removePlayer(gameId: string, userId: string): void {
    const game = this.games.get(gameId);
    if (!game) return;
    game.players.delete(userId);
    if (game.players.size === 0) {
      clearTimeout(game.timerRef);
      this.games.delete(gameId);
    }
  }

  pickWordChoices(game: GameState): string[] {
    // Shuffle and pick 3 unique words
    const shuffled = [...GUESS_PROMPTS].sort(() => Math.random() - 0.5);
    const choices = shuffled.slice(0, 3);
    game.wordChoices = choices;
    return choices;
  }

  selectWord(game: GameState, word: string): void {
    game.secretWord = word;
    game.prompt     = word;
    game.wordLength  = word.length;
    game.wordChoices = [];
  }

  pickPrompt(game: GameState): string {
    if (game.type === 'guess') {
      // Word choices are handled separately via pickWordChoices/selectWord
      return '';
    }
    const p = randomFrom(BATTLE_PROMPTS);
    game.prompt = p;
    return p;
  }

  startGame(game: GameState): void {
    game.status       = 'countdown';
    game.currentRound = 1;
    game.startedAt    = Date.now();

    if (game.type === 'guess') {
      // Rotate drawers round-robin
      game.drawerQueue = Array.from(game.players.keys());
      game.drawerId    = game.drawerQueue.shift() ?? null;
      if (game.drawerId) {
        const p = game.players.get(game.drawerId);
        if (p) { p.isDrawer = true; p.hasDrawn = true; }
      }
    }

    this.pickPrompt(game);
  }

  submitDrawing(gameId: string, userId: string, canvasData?: string): void {
    const game = this.games.get(gameId);
    if (!game) return;
    const player = game.players.get(userId);
    if (!player) return;
    player.hasDrawn = true;
    game.submissions.set(userId, {
      userId, username: player.username, canvasData, votes: 0,
    });
  }

  recordVote(gameId: string, voterUserId: string, targetUserId: string): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;
    const voter = game.players.get(voterUserId);
    if (!voter || voter.hasVoted || voterUserId === targetUserId) return false;
    voter.hasVoted = true;
    const sub = game.submissions.get(targetUserId);
    if (sub) {
      sub.votes++;
      const target = game.players.get(targetUserId);
      if (target) target.score += 10;
    }
    return true;
  }

  recordGuess(gameId: string, userId: string, guess: string): { correct: boolean; points: number } {
    const game = this.games.get(gameId);
    if (!game || game.type !== 'guess') return { correct: false, points: 0 };
    const normalised = (s: string) => s.toLowerCase().trim();
    if (normalised(guess) !== normalised(game.secretWord)) return { correct: false, points: 0 };
    if (game.correctGuessers.has(userId)) return { correct: false, points: 0 }; // already guessed

    const player = game.players.get(userId);
    if (!player) return { correct: false, points: 0 };

    game.correctGuessers.add(userId);

    // Points: faster guesses earn more; bonus for guessing early
    const elapsed = Date.now() - (game.startedAt ?? Date.now());
    const timeBonus = Math.max(0, game.roundTimeS * 1000 - elapsed);
    const orderBonus = Math.max(0, (3 - game.correctGuessers.size) * 20); // 1st=+40, 2nd=+20, 3rd=0
    const points = 50 + Math.floor(timeBonus / 1000) * 2 + orderBonus;
    player.score += points;

    // Drawer also gets points per correct guesser
    if (game.drawerId) {
      const drawer = game.players.get(game.drawerId);
      if (drawer) drawer.score += 15;
    }

    return { correct: true, points };
  }

  allGuessed(gameId: string): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;
    const guessers = Array.from(game.players.values()).filter(p => p.userId !== game.drawerId);
    return guessers.length > 0 && guessers.every(p => game.correctGuessers.has(p.userId));
  }

  advanceRound(game: GameState): boolean {
    clearTimeout(game.timerRef);
    game.currentRound++;
    if (game.currentRound > game.maxRounds) {
      game.status = 'finished';
      return false;
    }
    // Reset round state
    game.submissions.clear();
    game.correctGuessers.clear();
    game.secretWord  = '';
    game.wordLength  = 0;
    game.wordChoices = [];
    game.players.forEach(p => { p.hasDrawn = false; p.hasVoted = false; });

    if (game.type === 'guess') {
      // Refill the queue when exhausted so extra rounds cycle through players again
      if (game.drawerQueue.length === 0) {
        game.drawerQueue = Array.from(game.players.keys()).filter(id => id !== game.drawerId);
        if (game.drawerQueue.length === 0) {
          game.drawerQueue = Array.from(game.players.keys());
        }
      }
      game.players.forEach(p => { p.isDrawer = false; });
      game.drawerId = game.drawerQueue.shift() ?? Array.from(game.players.keys())[0] ?? null;
      if (game.drawerId) {
        const drawer = game.players.get(game.drawerId);
        if (drawer) { drawer.isDrawer = true; drawer.hasDrawn = true; }
      }
    }

    this.pickPrompt(game);
    game.status = 'countdown';
    return true;
  }

  getLeaderboard(gameId: string): GamePlayer[] {
    const game = this.games.get(gameId);
    if (!game) return [];
    return Array.from(game.players.values()).sort((a, b) => b.score - a.score);
  }

  delete(gameId: string): void {
    const game = this.games.get(gameId);
    if (game) clearTimeout(game.timerRef);
    this.games.delete(gameId);
  }
}

export default new GameManager();
