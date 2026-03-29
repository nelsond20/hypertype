import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getScoreModel } from '$lib/server/db';
import { memoryLeaderboard } from '$lib/server/memory';
import { getNumberEnv } from '$lib/server/env';
import {
  enforceRateLimit,
  getClientIp,
  requirePersistentStorage,
} from '$lib/server/security';
import { difficulties, languages } from '$lib/shared/types';

function parseQuery(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const pageSize = Math.min(
    25,
    Math.max(1, Number(url.searchParams.get('pageSize') ?? 10)),
  );
  const difficulty = url.searchParams.get('difficulty');
  const language = url.searchParams.get('language');

  return {
    page,
    pageSize,
    difficulty: difficulties.includes(difficulty as never)
      ? (difficulty as (typeof difficulties)[number])
      : 'all',
    language: languages.includes(language as never)
      ? (language as (typeof languages)[number])
      : 'all',
  };
}

export const GET: RequestHandler = async (event) => {
  await enforceRateLimit({
    key: `leaderboard:${getClientIp(event)}`,
    limit: getNumberEnv('LEADERBOARD_RATE_LIMIT_PER_HOUR', 240),
    windowMs: 60 * 60 * 1000,
  });
  const { url } = event;
  const { page, pageSize, difficulty, language } = parseQuery(url);
  const filter: Record<string, string> = {};
  if (difficulty !== 'all') filter.difficulty = difficulty;
  if (language !== 'all') filter.language = language;

  await requirePersistentStorage();
  const Score = await getScoreModel();
  let items = Score
    ? await Score.find(filter)
        .sort({ wpm: -1, accuracy: -1, createdAt: -1 })
        .limit(100)
        .lean()
    : memoryLeaderboard().filter((score) => {
        return (
          (difficulty === 'all' || score.difficulty === difficulty) &&
          (language === 'all' || score.language === language)
        );
      });

  items = items.sort((a, b) => {
    if (b.wpm !== a.wpm) return b.wpm - a.wpm;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return (
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
    );
  });

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);

  return json({
    items: data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  });
};
