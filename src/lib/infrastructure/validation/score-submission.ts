import { z } from 'zod';
import {
  deriveScore,
  detectImpossibleRawEvents,
} from '$lib/domain/game/scoring';
import { difficulties, languages } from '$lib/domain/game/types';
import { getNumberEnv } from '$lib/infrastructure/config/env';

export const submitSchema = z.object({
  gameId: z.string().min(8),
  userName: z
    .string()
    .trim()
    .min(1)
    .max(32)
    .regex(/^[\w .-]{1,32}$/),
  wpm: z.number().nonnegative(),
  accuracy: z.number().min(0).max(100),
  correctChars: z.number().int().nonnegative(),
  wrongChars: z.number().int().nonnegative(),
  keystrokes: z.number().int().positive(),
  durationMs: z.number().int().positive(),
  difficulty: z.enum(difficulties),
  language: z.enum(languages),
  seed: z.number().int().nonnegative(),
  rawEvents: z
    .array(
      z.object({
        key: z.string().min(1).max(24),
        ts: z.number(),
        type: z.enum(['keydown', 'input', 'backspace']),
      }),
    )
    .max(2500)
    .optional(),
});

export function validateScorePayload(payload: unknown) {
  const parsed = submitSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false as const, error: 'Invalid payload' };
  }

  const data = parsed.data;
  if (data.durationMs < 1000) {
    return { ok: false as const, error: 'Duration too short' };
  }

  if (data.correctChars > data.keystrokes) {
    return { ok: false as const, error: 'Keystrokes mismatch' };
  }

  if (data.wrongChars > data.keystrokes) {
    return { ok: false as const, error: 'Wrong chars mismatch' };
  }

  const expectedWrongChars = Math.max(0, data.keystrokes - data.correctChars);
  if (data.wrongChars !== expectedWrongChars) {
    return { ok: false as const, error: 'Wrong chars mismatch' };
  }

  const maxKeystrokes = getNumberEnv('MAX_KEYSTROKES', 5000);
  if (data.keystrokes > maxKeystrokes) {
    return { ok: false as const, error: 'Too many keystrokes' };
  }

  const maxDurationMs = getNumberEnv('MAX_DURATION_MS', 3 * 60 * 1000);
  if (data.durationMs > maxDurationMs) {
    return { ok: false as const, error: 'Duration too long' };
  }

  const derived = deriveScore({
    correctChars: data.correctChars,
    keystrokes: data.keystrokes,
    durationMs: data.durationMs,
  });
  const maxWpm = getNumberEnv('MAX_WPM', 300);
  if (derived.wpm > maxWpm) {
    return { ok: false as const, error: 'WPM too high' };
  }

  if (Math.abs(data.wpm - derived.wpm) > 0.5) {
    return { ok: false as const, error: 'Score mismatch' };
  }

  if (Math.abs(data.accuracy - derived.accuracy) > 0.5) {
    return { ok: false as const, error: 'Score mismatch' };
  }

  if (detectImpossibleRawEvents(data.rawEvents, data.durationMs)) {
    return { ok: false as const, error: 'Impossible input pattern' };
  }

  return { ok: true as const, data };
}
