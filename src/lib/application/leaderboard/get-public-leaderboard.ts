import {
  difficulties,
  languages,
  type Difficulty,
  type Language,
  type LeaderboardFilters,
} from '$lib/domain/game/types';
import { listLeaderboard } from '$lib/infrastructure/persistence/score-repository';
type LeaderboardListItem = Awaited<ReturnType<typeof listLeaderboard>>[number];

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
    limit: 500,
  });
  const uniqueItems = pickBestPerPlayerAndLanguage<LeaderboardListItem>(items);

  const total = uniqueItems.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const start = (filters.page - 1) * filters.pageSize;

  return {
    items: uniqueItems.slice(start, start + filters.pageSize),
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages,
    },
  };
}

function normalizePlayerName(value: string) {
  return value.trim().toLowerCase();
}

type RankableScore = {
  userName: string;
  language: string;
  wpm: number;
  accuracy: number;
  createdAt?: Date | string | number | null;
};

function compareScores<T extends RankableScore>(a: T, b: T) {
  if (b.wpm !== a.wpm) return b.wpm - a.wpm;
  if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
  return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
}

function pickBestPerPlayerAndLanguage<T extends RankableScore>(items: T[]) {
  const bestByPlayerAndLanguage = new Map<string, T>();

  for (const item of items) {
    const key = `${normalizePlayerName(item.userName)}::${item.language}`;
    const current = bestByPlayerAndLanguage.get(key);
    if (!current || compareScores(item, current) < 0) {
      bestByPlayerAndLanguage.set(key, item);
    }
  }

  return [...bestByPlayerAndLanguage.values()].sort(compareScores);
}
