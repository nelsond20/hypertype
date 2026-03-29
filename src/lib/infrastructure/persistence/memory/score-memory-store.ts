import type { LeaderboardItem } from '$lib/domain/game/types';

const memoryScores: LeaderboardItem[] = [];

export function saveScoreInMemory(score: LeaderboardItem) {
  const existing = memoryScores.findIndex(
    (entry) => entry.gameId === score.gameId,
  );
  if (existing >= 0) {
    memoryScores[existing] = score;
    return;
  }

  memoryScores.unshift(score);
}

export function listScoresFromMemory() {
  return [...memoryScores];
}
