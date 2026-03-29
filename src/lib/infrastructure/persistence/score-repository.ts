import type { LeaderboardItem } from '$lib/domain/game/types';
import {
  listScoresFromMemory,
  saveScoreInMemory,
} from './memory/score-memory-store';
import { getPersistenceConnection } from './mongoose/connection';
import { ScoreModel } from './mongoose/models/score.model';

export async function hasPersistentStorage() {
  const connection = await getPersistenceConnection();
  return Boolean(connection);
}

export async function saveScore(score: LeaderboardItem) {
  const connection = await getPersistenceConnection();
  if (!connection) {
    saveScoreInMemory(score);
    return;
  }

  await ScoreModel.findOneAndUpdate(
    { gameId: score.gameId },
    { $setOnInsert: score },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export async function listLeaderboard(input: {
  difficulty: LeaderboardItem['difficulty'] | 'all';
  language: LeaderboardItem['language'] | 'all';
  limit: number;
}) {
  const filter: Record<string, string> = {};
  if (input.difficulty !== 'all') filter.difficulty = input.difficulty;
  if (input.language !== 'all') filter.language = input.language;

  const connection = await getPersistenceConnection();
  const items = connection
    ? await ScoreModel.find(filter)
        .sort({ wpm: -1, accuracy: -1, createdAt: -1 })
        .limit(input.limit)
        .lean()
    : listScoresFromMemory().filter((score) => {
        return (
          (input.difficulty === 'all' ||
            score.difficulty === input.difficulty) &&
          (input.language === 'all' || score.language === input.language)
        );
      });

  return items.sort((a, b) => {
    if (b.wpm !== a.wpm) return b.wpm - a.wpm;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return (
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
    );
  });
}
