import { generateCorpusText } from '$lib/domain/game/corpus';
import {
  difficulties,
  languages,
  textLengths,
  type Difficulty,
  type Language,
  type TextLength,
} from '$lib/domain/game/types';

export function getCorpusText(input: {
  difficulty: string | null;
  language: string | null;
  textLength: string | null;
  seed: number;
}) {
  const difficulty = difficulties.includes(input.difficulty as Difficulty)
    ? (input.difficulty as Difficulty)
    : 'medium';
  const language = languages.includes(input.language as Language)
    ? (input.language as Language)
    : 'typescript';
  const textLength = textLengths.includes(input.textLength as TextLength)
    ? (input.textLength as TextLength)
    : 'medium';

  return generateCorpusText({
    difficulty,
    language,
    seed: input.seed,
    textLength,
  });
}
