import type { LeaderboardItem } from '$lib/shared/types';

const store: LeaderboardItem[] = [];

export function memoryInsert(score: LeaderboardItem) {
  const existing = store.findIndex((entry) => entry.gameId === score.gameId);
  if (existing >= 0) {
    store[existing] = score;
    return;
  }
  store.unshift(score);
}

export function memoryLeaderboard() {
  return [...store];
}
