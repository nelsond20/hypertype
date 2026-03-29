import {
  difficulties,
  languages,
  type Difficulty,
  type Language,
  type LeaderboardFilters,
} from '$lib/domain/game/types';
import { listLeaderboard } from '$lib/infrastructure/persistence/score-repository';

export function parseLeaderboardFilters(url: URL): LeaderboardFilters {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const pageSize = Math.min(
    25,
    Math.max(1, Number(url.searchParams.get('pageSize') ?? 10)),
  );
  const difficultyParam = url.searchParams.get('difficulty');
  const languageParam = url.searchParams.get('language');

  return {
    page,
    pageSize,
    difficulty: difficulties.includes(difficultyParam as Difficulty)
      ? (difficultyParam as Difficulty)
      : 'all',
    language: languages.includes(languageParam as Language)
      ? (languageParam as Language)
      : 'all',
  };
}

export async function getPublicLeaderboard(filters: LeaderboardFilters) {
  const items = await listLeaderboard({
    difficulty: filters.difficulty,
    language: filters.language,
    limit: 100,
  });

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const start = (filters.page - 1) * filters.pageSize;

  return {
    items: items.slice(start, start + filters.pageSize),
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages,
    },
  };
}
