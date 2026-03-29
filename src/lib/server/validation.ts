import { z } from 'zod';
import { detectImpossibleRawEvents } from '$lib/shared/scoring';
import { getServerEnv } from '$lib/server/env';
import { difficulties, languages } from '$lib/shared/types';

export const submitSchema = z.object({
  gameId: z.string().min(8),
  userName: z.string().min(1).max(32),
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
        key: z.string(),
        ts: z.number(),
        type: z.enum(['keydown', 'input', 'backspace']),
      }),
    )
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

  const maxWpm = Number(getServerEnv('MAX_WPM') ?? 300);
  if (data.wpm > maxWpm) {
    return { ok: false as const, error: 'WPM too high' };
  }

  if (detectImpossibleRawEvents(data.rawEvents, data.durationMs)) {
    return { ok: false as const, error: 'Impossible input pattern' };
  }

  return { ok: true as const, data };
}
