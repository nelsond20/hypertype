import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCorpusText } from '$lib/application/game/get-corpus-text';
import { enforceRateLimit } from '$lib/infrastructure/security/request-guards';

export const GET: RequestHandler = async (event) => {
  await enforceRateLimit({
    event,
    scope: 'corpus',
    limitEnv: 'CORPUS_RATE_LIMIT_PER_HOUR',
    fallbackLimit: 600,
    windowMs: 60 * 60 * 1000,
  });
  const { url } = event;
  const rawSeed = Number(url.searchParams.get('seed') ?? Date.now());
  const seed = Number.isFinite(rawSeed)
    ? Math.max(0, Math.trunc(rawSeed))
    : Date.now();
  return json(
    getCorpusText({
      difficulty: url.searchParams.get('difficulty'),
      language: url.searchParams.get('language'),
      textLength: url.searchParams.get('textLength'),
      seed,
    }),
  );
};
