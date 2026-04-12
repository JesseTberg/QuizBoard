export type GameStatus = 'lobby' | 'playing' | 'question' | 'buzzed' | 'ended';

export interface Question {
  id: number;
  text: string;
  answer: string;
  points: number;
  isAnswered: boolean;
}

export interface Category {
  id: number;
  title: string;
  questions: Question[];
}

export interface GameBoard {
  categories: Category[];
}

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface GameState {
  id: string;
  hostId: string;
  status: GameStatus;
  currentQuestion: {
    categoryId: number;
    questionId: number;
  } | null;
  buzzedPlayerId: string | null;
  buzzedAt: number | null;
  board: GameBoard;
  players: Player[];
}
