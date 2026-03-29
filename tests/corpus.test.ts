import { describe, expect, it } from 'vitest';
import { generateCorpusText } from '$lib/shared/corpus';

describe('corpus', () => {
  it('is deterministic for the same seed', () => {
    const first = generateCorpusText({
      difficulty: 'medium',
      language: 'typescript',
      seed: 123,
      textLength: 'short',
    });
    const second = generateCorpusText({
      difficulty: 'medium',
      language: 'typescript',
      seed: 123,
      textLength: 'short',
    });

    expect(first.text).toBe(second.text);
  });

  it('changes across different seeds', () => {
    const first = generateCorpusText({
      difficulty: 'medium',
      language: 'typescript',
      seed: 123,
      textLength: 'short',
    });
    const second = generateCorpusText({
      difficulty: 'medium',
      language: 'typescript',
      seed: 456,
      textLength: 'short',
    });

    expect(first.text).not.toBe(second.text);
  });
});
