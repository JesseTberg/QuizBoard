export type GameStatus = 'lobby' | 'playing' | 'question' | 'buzzed' | 'final_question_wager' | 'final_question_answer' | 'final_question_reveal' | 'ended';

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
  id: number;
  name: string;
  categories: Category[];
  isDoublePoints?: boolean;
}

export interface FinalQuestion {
  category: string;
  question: string;
  answer: string;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  wager?: number;
  finalAnswer?: string;
  isCorrect?: boolean;
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
  boards: GameBoard[];
  currentBoardIndex: number;
  finalQuestion: FinalQuestion;
  players: Player[];
}
