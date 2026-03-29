import {
  difficulties,
  languages,
  sessionLengths,
  textLengths,
  type Difficulty,
  type GameSettings,
  type Language,
  type SessionLength,
  type TextLength,
} from '$lib/domain/game/types';

const key = 'hypertype:preferences';

export const defaultPreferences: GameSettings = {
  difficulty: 'medium',
  language: 'typescript',
  durationSeconds: 60,
  textLength: 'medium',
  playerName: 'Guest123',
  theme: 'aurora',
};

function normalizePreferences(value: unknown): GameSettings {
  const candidate =
    value && typeof value === 'object'
      ? (value as Partial<GameSettings>)
      : {};

  return {
    difficulty: difficulties.includes(candidate.difficulty as Difficulty)
      ? (candidate.difficulty as Difficulty)
      : defaultPreferences.difficulty,
    language: languages.includes(candidate.language as Language)
      ? (candidate.language as Language)
      : defaultPreferences.language,
    durationSeconds: sessionLengths.includes(
      candidate.durationSeconds as SessionLength,
    )
      ? (candidate.durationSeconds as SessionLength)
      : defaultPreferences.durationSeconds,
    textLength: textLengths.includes(candidate.textLength as TextLength)
      ? (candidate.textLength as TextLength)
      : defaultPreferences.textLength,
    playerName:
      typeof candidate.playerName === 'string' && candidate.playerName.trim()
        ? candidate.playerName.trim().slice(0, 32)
        : defaultPreferences.playerName,
    theme:
      candidate.theme === 'midnight' || candidate.theme === 'aurora'
        ? candidate.theme
        : defaultPreferences.theme,
  };
}

export function loadPreferences(): GameSettings {
  if (typeof localStorage === 'undefined') return defaultPreferences;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultPreferences;
    return normalizePreferences(JSON.parse(raw));
  } catch {
    return defaultPreferences;
  }
}

export function savePreferences(preferences: GameSettings) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(normalizePreferences(preferences)));
}
