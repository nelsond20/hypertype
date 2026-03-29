import type { GameSettings } from './types';

const key = 'hypertype:preferences';

export const defaultPreferences: GameSettings = {
  difficulty: 'medium',
  language: 'typescript',
  durationSeconds: 60,
  textLength: 'medium',
  playerName: 'Guest123',
  theme: 'aurora',
};

export function loadPreferences(): GameSettings {
  if (typeof localStorage === 'undefined') return defaultPreferences;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultPreferences;
    return { ...defaultPreferences, ...JSON.parse(raw) };
  } catch {
    return defaultPreferences;
  }
}

export function savePreferences(preferences: GameSettings) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(preferences));
}
