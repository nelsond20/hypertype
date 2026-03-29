import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  getPublicLeaderboard,
  parseLeaderboardFilters,
} from '$lib/application/leaderboard/get-public-leaderboard';
import { enforceRateLimit } from '$lib/infrastructure/security/request-guards';

export const GET: RequestHandler = async (event) => {
  await enforceRateLimit({
    event,
    scope: 'leaderboard',
    limitEnv: 'LEADERBOARD_RATE_LIMIT_PER_HOUR',
    fallbackLimit: 240,
    windowMs: 60 * 60 * 1000,
  });
  return json(await getPublicLeaderboard(parseLeaderboardFilters(event.url)));
};
