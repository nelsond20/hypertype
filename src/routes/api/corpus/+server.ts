import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCorpusText } from '$lib/application/game/get-corpus-text';

export const GET: RequestHandler = async ({ url }) => {
  const seed = Number(url.searchParams.get('seed') ?? Date.now());
  return json(
    getCorpusText({
      difficulty: url.searchParams.get('difficulty'),
      language: url.searchParams.get('language'),
      textLength: url.searchParams.get('textLength'),
      seed,
    }),
  );
};
