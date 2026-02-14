
export interface WordData {
  id: string | number;
  hitza: string;
  sinonimoak: string[];
}

export interface Player {
  id: number;
  name: string;
  score: number;
  time: number;
}

export interface Question {
  wordData: WordData;
  correctAnswer: string;
  options: string[];
}

export interface HistoryTabStats {
  level: number;
  words: number;
  correct: number;
  wrong: number;
  percentage: number;
  sessions: number;
}

export type DifficultyLevel = 1 | 2 | 3 | 4;

export enum GameStatus {
  SETUP = 'SETUP',
  INTERMISSION = 'INTERMISSION',
  PLAYING = 'PLAYING',
  SUMMARY = 'SUMMARY',
  REVIEW = 'REVIEW',
  AUTH = 'AUTH',
  CONTRIBUTE = 'CONTRIBUTE'
}
