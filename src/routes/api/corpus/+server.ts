import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateCorpusText } from '$lib/shared/corpus';
import { difficulties, languages, textLengths } from '$lib/shared/types';

export const GET: RequestHandler = async ({ url }) => {
  const difficulty = url.searchParams.get('difficulty');
  const language = url.searchParams.get('language');
  const textLength = url.searchParams.get('textLength');
  const seed = Number(url.searchParams.get('seed') ?? Date.now());

  const safeDifficulty = difficulties.includes(difficulty as never)
    ? (difficulty as (typeof difficulties)[number])
    : 'medium';
  const safeLanguage = languages.includes(language as never)
    ? (language as (typeof languages)[number])
    : 'typescript';
  const safeLength = textLengths.includes(textLength as never)
    ? (textLength as (typeof textLengths)[number])
    : 'medium';

  return json(
    generateCorpusText({
      difficulty: safeDifficulty,
      language: safeLanguage,
      seed,
      textLength: safeLength,
    }),
  );
};
