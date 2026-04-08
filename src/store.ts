import { create } from 'zustand';
import type { Game, Player, Team, Round, SessionConfig } from './types';
import { getSocket, connectSocket } from './socket';
import { getDeviceId } from './deviceId';

export type AppScreen = 'setup' | 'lobby' | 'game' | 'result';

interface Toast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface GameStore {
  // Connection
  connected: boolean;

  // Identity
  playerId: string | null;
  playerName: string;
  playerAvatar: string;

  // Pending join from invite link
  pendingJoinId: string | null;

  // Game state
  game: Game | null;
  screen: AppScreen;

  // Round extras
  timerRemaining: number | null;
  roundsLeft: number | null;
  sessionFinished: boolean;

  // Toasts & errors
  toasts: Toast[];
  lastError: string | null;

  // Setters
  setPlayerName: (name: string) => void;
  setPlayerAvatar: (avatar: string) => void;

  // Socket init
  initSocket: () => void;

  // Socket actions
  createGame: () => void;
  joinGame: (gameId: string) => void;
  generateTeams: () => void;
  configureSession: (config: SessionConfig) => void;
  startNextRound: (timerSeconds?: number) => void;
  addPoints: (teamId: string, points: number) => void;
  startTimer: () => void;
  endRound: () => void;
  leaveGame: () => void;
  resetSession: () => void;

  // UI helpers
  addToast: (message: string, type?: Toast['type']) => void;
  clearError: () => void;
  goToLobby: () => void;
  resetStore: () => void;
}

let toastCounter = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  connected: false,
  playerId: null,
  playerName: '',
  playerAvatar: '🐸',
  pendingJoinId: null,
  game: null,
  screen: 'setup',
  timerRemaining: null,
  roundsLeft: null,
  sessionFinished: false,
  toasts: [],
  lastError: null,

  setPlayerName: (name) => set({ playerName: name }),
  setPlayerAvatar: (avatar) => set({ playerAvatar: avatar }),

  // ─── Socket initialisation ────────────────────────────────────────────────

  initSocket: () => {
    const socket = getSocket();

    socket.on('connect', () => {
      set({ connected: true });
      // Only attempt session restore when the user is NOT following an invite link.
      // If pendingJoinId is set they explicitly want to join a new game.
      if (!get().pendingJoinId) {
        socket.emit('reconnectPlayer', { deviceId: getDeviceId() });
      }
    });
    socket.on('disconnect', () => set({ connected: false }));

    socket.on('gameCreated', ({ game, playerId }: { game: Game; playerId: string }) => {
      set({ game, playerId, screen: 'lobby' });
      get().addToast('¡Partida creada! Comparte el enlace.', 'success');
    });

    socket.on('joinedGame', ({ game, playerId }: { game: Game; playerId: string }) => {
      set({ game, playerId, screen: 'lobby', pendingJoinId: null });
      get().addToast('¡Te uniste a la partida!', 'success');
    });

    socket.on('playersUpdated', ({ players }: { players: Player[] }) => {
      set((s) => ({ game: s.game ? { ...s.game, players } : s.game }));
    });

    socket.on('teamsUpdated', ({ teams, players }: { teams: Team[]; players: Player[] }) => {
      set((s) => ({ game: s.game ? { ...s.game, teams, players } : s.game }));
      get().addToast('¡Equipos generados!', 'info');
    });

    socket.on(
      'sessionConfigured',
      ({ config, queueLength }: { config: SessionConfig; queueLength: number }) => {
        set((s) => ({
          game: s.game ? { ...s.game, sessionConfig: config } : s.game,
          roundsLeft: queueLength,
        }));
        get().addToast(`Sesión lista: ${queueLength} rondas en cola.`, 'success');
      },
    );

    socket.on(
      'roundStarted',
      ({ round, roundsLeft }: { round: Round; roundsLeft: number }) => {
        set((s) => ({
          game: s.game ? { ...s.game, currentRound: round, status: 'playing' } : s.game,
          screen: 'game',
          timerRemaining: round.timerMax,
          roundsLeft,
          sessionFinished: false,
        }));
      },
    );

    socket.on('timerUpdate', ({ remaining }: { remaining: number }) => {
      set({ timerRemaining: remaining });
    });

    socket.on('scoreUpdated', ({ teams }: { teams: Team[] }) => {
      set((s) => ({ game: s.game ? { ...s.game, teams } : s.game }));
    });

    socket.on(
      'roundEnded',
      ({
        round,
        teams,
        sessionFinished,
        roundsLeft,
      }: {
        round: Round;
        teams: Team[];
        sessionFinished: boolean;
        roundsLeft: number;
      }) => {
        set((s) => ({
          game: s.game ? { ...s.game, currentRound: round, teams } : s.game,
          screen: 'result',
          timerRemaining: null,
          sessionFinished,
          roundsLeft,
        }));
        get().addToast('¡Ronda terminada!', 'info');
      },
    );

    socket.on('error', ({ message }: { message: string }) => {
      set({ lastError: message });
      get().addToast(message, 'error');
    });

    socket.on(
      'reconnected',
      ({
        game,
        playerId,
        screen,
      }: {
        game: Game;
        playerId: string;
        screen: AppScreen;
      }) => {
        set({ game, playerId, screen });
        get().addToast('¡Sesión restaurada!', 'success');
      },
    );

    // Server found no matching player — stay on setup screen (nothing to restore)
    socket.on('reconnectFailed', () => {
      // no-op: user is on setup screen already
    });

    // Left game voluntarily
    socket.on('leftGame', () => {
      get().resetStore();
    });

    // Host abandoned the game — kick everyone back to setup
    socket.on('gameEnded', ({ reason }: { reason: string }) => {
      get().resetStore();
      get().addToast(reason, 'info');
    });

    // Host reset the session — go back to lobby with fresh state
    socket.on('sessionReset', ({ game }: { game: Game }) => {
      set({ game, screen: 'lobby', sessionFinished: false, roundsLeft: null, timerRemaining: null });
      get().addToast('Sesión reiniciada. Configura una nueva.', 'info');
    });

    connectSocket();
  },

  // ─── Socket actions ───────────────────────────────────────────────────────

  createGame: () => {
    const { playerName, playerAvatar } = get();
    getSocket().emit('createGame', { name: playerName, avatar: playerAvatar, deviceId: getDeviceId() });
  },

  joinGame: (gameId) => {
    const { playerName, playerAvatar } = get();
    getSocket().emit('joinGame', { gameId, name: playerName, avatar: playerAvatar, deviceId: getDeviceId() });
  },

  generateTeams: () => {
    const { game } = get();
    if (!game) return;
    getSocket().emit('generateTeams', { gameId: game.id });
  },

  configureSession: (config) => {
    const { game } = get();
    if (!game) return;
    getSocket().emit('configureSession', { gameId: game.id, config });
  },

  startNextRound: (timerSeconds = 60) => {
    const { game } = get();
    if (!game) return;
    getSocket().emit('startNextRound', { gameId: game.id, timerSeconds });
  },

  addPoints: (teamId, points) => {
    const { game } = get();
    if (!game) return;
    getSocket().emit('addPoints', { gameId: game.id, teamId, points });
  },

  startTimer: () => {
    const { game } = get();
    if (!game) return;
    getSocket().emit('startTimer', { gameId: game.id });
  },

  endRound: () => {
    const { game } = get();
    if (!game) return;
    getSocket().emit('endRound', { gameId: game.id });
  },

  leaveGame: () => {
    getSocket().emit('leaveGame', {});
    // resetStore is called when leftGame event is received
  },

  resetSession: () => {
    const { game } = get();
    if (!game) return;
    getSocket().emit('resetSession', { gameId: game.id });
  },

  // ─── UI helpers ───────────────────────────────────────────────────────────

  addToast: (message, type = 'info') => {
    const id = ++toastCounter;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },

  clearError: () => set({ lastError: null }),

  goToLobby: () => set({ screen: 'lobby' }),

  resetStore: () =>
    set({
      game: null,
      playerId: null,
      screen: 'setup',
      timerRemaining: null,
      roundsLeft: null,
      sessionFinished: false,
      pendingJoinId: null,
    }),
}));
