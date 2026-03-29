export const difficulties = ['easy', 'medium', 'hard'] as const;
export const languages = [
  'typescript',
  'javascript',
  'python',
  'rust',
  'sql',
  'go',
] as const;
export const sessionLengths = [30, 45, 60] as const;
export const textLengths = ['short', 'medium', 'long'] as const;

export type Difficulty = (typeof difficulties)[number];
export type Language = (typeof languages)[number];
export type SessionLength = (typeof sessionLengths)[number];
export type TextLength = (typeof textLengths)[number];

export type RawKeyEvent = {
  key: string;
  ts: number;
  type: 'keydown' | 'input' | 'backspace';
};

export type GameSettings = {
  difficulty: Difficulty;
  language: Language;
  durationSeconds: SessionLength;
  textLength: TextLength;
  playerName: string;
  theme: 'aurora' | 'midnight';
};

export type ScoreRecord = {
  gameId: string;
  userId?: string;
  userName: string;
  wpm: number;
  accuracy: number;
  correctChars: number;
  wrongChars: number;
  keystrokes: number;
  durationMs: number;
  difficulty: Difficulty;
  language: Language;
  seed: number;
  createdAt?: Date;
};

export type LeaderboardItem = ScoreRecord & {
  _id?: string;
};

export type GeneratedText = {
  text: string;
  seed: number;
  difficulty: Difficulty;
  language: Language;
  targetChars: number;
};

export type SubmitPayload = {
  gameId: string;
  userName: string;
  wpm: number;
  accuracy: number;
  correctChars: number;
  wrongChars: number;
  keystrokes: number;
  durationMs: number;
  difficulty: Difficulty;
  language: Language;
  seed: number;
  rawEvents?: RawKeyEvent[];
};

export type LeaderboardFilters = {
  difficulty: Difficulty | 'all';
  language: Language | 'all';
  page: number;
  pageSize: number;
};
