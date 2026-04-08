// ─── Game type identifiers ────────────────────────────────────────────────────

export type GameType =
  | 'adivina-la-pelicula'
  | 'tres-pistas-una-palabra'
  | 'pictionary'
  | 'respuesta-incorrecta-gana';

export type MovieModality = 'actua' | 'dialogo' | 'personaje';

// ─── Round content ────────────────────────────────────────────────────────────

export interface MovieRoundContent {
  type: 'movie';
  modality: MovieModality;
  movie: string;
  reveal: string;
  image: string;
}

export interface ThreeCluesRoundContent {
  type: 'three-clues';
  word: string;
  clues: string[];
}

export interface PictionaryRoundContent {
  type: 'pictionary';
  word: string;
}

export interface AnswerWrongRoundContent {
  type: 'answer-wrong';
  question: string;
}

export type RoundContent =
  | MovieRoundContent
  | ThreeCluesRoundContent
  | PictionaryRoundContent
  | AnswerWrongRoundContent;

// ─── Core entities ────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  avatar: string;
  teamId: string | null;
  socketId: string;
}

export interface Team {
  id: string;
  name: string;
  avatar: string;
  points: number;
  players: Player[];
  roundRobinIndex: number;
}

export type RoundStatus = 'waiting' | 'playing' | 'finished';

export interface Round {
  gameType: GameType;
  /** null for everyone except the active player */
  content: RoundContent | null;
  activePlayerId: string;
  teamId: string;
  status: RoundStatus;
  timer: number;
  timerMax: number;
}

export interface SessionConfig {
  totalGames: number;
  gameTypes: GameType[];
}

export interface Game {
  id: string;
  hostId: string;
  players: Player[];
  teams: Team[];
  currentRound: Round | null;
  status: 'lobby' | 'playing' | 'finished';
  sessionConfig: SessionConfig | null;
  queue: unknown[];
  roundsCompleted: number;
}

// ─── Game definitions (UI metadata) ──────────────────────────────────────────

export interface GameDefinition {
  name: string;
  description: string;
  rules: string;
  /** Which player selection strategy this game uses */
  playerSelection: 'round-robin' | 'random';
}

export const GAME_DEFINITIONS: Record<GameType, GameDefinition> = {
  'adivina-la-pelicula': {
    name: 'Adivina la Película',
    description:
      'Un jugador del equipo activo debe dar pistas sobre una película mientras sus compañeros intentan adivinarla.',
    rules:
      'Hay tres modalidades que se alternan automáticamente:\n• Actúa: el jugador activo actúa la película en silencio.\n• Diálogo: el jugador dice una frase de la película sin nombrarla.\n• Personaje: el jugador nombra o actúa a un personaje de la película.\nSolo el jugador activo ve el contenido. El anfitrión otorga puntos al equipo que adivine correctamente.',
    playerSelection: 'round-robin',
  },
  'tres-pistas-una-palabra': {
    name: '3 Pistas, 1 Palabra',
    description:
      'Un jugador da exactamente tres pistas para que su equipo adivine una palabra.',
    rules:
      'El sistema elige una palabra en secreto. Solo el jugador activo la ve. Debe dar tres pistas, una a la vez. No puede decir palabras que rimen ni letras de la palabra. El equipo tiene el tiempo del cronómetro para adivinar. El anfitrión otorga los puntos.',
    playerSelection: 'round-robin',
  },
  pictionary: {
    name: 'Pictionary',
    description:
      'Un jugador dibuja una palabra y su equipo intenta adivinarla.',
    rules:
      'El sistema elige una palabra. Solo el jugador activo la ve. Debe dibujarla sin usar letras, números ni hablar. Su equipo adivina antes de que se acabe el tiempo. El anfitrión otorga los puntos.',
    playerSelection: 'round-robin',
  },
  'respuesta-incorrecta-gana': {
    name: 'Respuesta Incorrecta Gana',
    description:
      'Todos los equipos responden una pregunta. Gana quien dé la respuesta más creativa e incorrecta.',
    rules:
      'El sistema elige una pregunta y la muestra a todos. Cada equipo escribe en secreto la respuesta incorrecta más divertida o creativa. El anfitrión lee todas las respuestas en voz alta y elige la ganadora. Los puntos se otorgan al equipo ganador.',
    playerSelection: 'random',
  },
};

export const MODALITY_LABELS: Record<MovieModality, string> = {
  actua: 'Actúa la película',
  dialogo: 'Di un diálogo',
  personaje: 'Nombra un personaje',
};
