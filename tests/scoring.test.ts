import { describe, expect, it } from 'vitest';
import {
  calculateAccuracy,
  calculateWpm,
  detectImpossibleRawEvents,
} from '$lib/domain/game/scoring';

describe('scoring', () => {
  it('calculates wpm from correct chars and duration', () => {
    expect(calculateWpm(250, 60000)).toBe(50);
  });

  it('calculates accuracy from correct and keystrokes', () => {
    expect(calculateAccuracy(95, 100)).toBe(95);
  });

  it('detects impossible raw event rates', () => {
    expect(
      detectImpossibleRawEvents(
        [
          { key: 'a', ts: 0, type: 'input' },
          { key: 'b', ts: 1, type: 'input' },
          { key: 'c', ts: 2, type: 'input' },
        ],
        1000,
      ),
    ).toBe(true);
  });
});
