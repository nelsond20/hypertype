import type { RawKeyEvent } from './types';

export function calculateWpm(correctChars: number, durationMs: number) {
  if (durationMs <= 0) return 0;
  return correctChars / 5 / (durationMs / 60000) || 0;
}

export function calculateAccuracy(correctChars: number, keystrokes: number) {
  if (keystrokes <= 0) return 0;
  return (correctChars / keystrokes) * 100;
}

export function clampScore(value: number) {
  return Number.isFinite(value) ? Math.max(0, Number(value.toFixed(1))) : 0;
}

export function deriveScore(input: {
  correctChars: number;
  keystrokes: number;
  durationMs: number;
}) {
  return {
    wpm: clampScore(calculateWpm(input.correctChars, input.durationMs)),
    accuracy: clampScore(
      calculateAccuracy(input.correctChars, input.keystrokes),
    ),
  };
}

export function detectImpossibleRawEvents(
  events: RawKeyEvent[] | undefined,
  durationMs: number,
) {
  if (!events || events.length < 2 || durationMs <= 0) return false;
  const sorted = [...events].sort((a, b) => a.ts - b.ts);
  const span = sorted[sorted.length - 1].ts - sorted[0].ts;
  if (span <= 0) return true;
  const rate = (sorted.length / span) * 1000;
  return rate > 28;
}
