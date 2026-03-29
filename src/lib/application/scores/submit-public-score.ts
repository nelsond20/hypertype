import { deriveScore } from '$lib/domain/game/scoring';
import type { LeaderboardItem } from '$lib/domain/game/types';
import { saveScore } from '$lib/infrastructure/persistence/score-repository';
import { validateScorePayload } from '$lib/infrastructure/validation/score-submission';

export async function submitPublicScore(payload: unknown) {
  const validated = validateScorePayload(payload);
  if (!validated.ok) {
    return validated;
  }

  const derived = deriveScore({
    correctChars: validated.data.correctChars,
    keystrokes: validated.data.keystrokes,
    durationMs: validated.data.durationMs,
  });

  const record: LeaderboardItem = {
    ...validated.data,
    wpm: derived.wpm,
    accuracy: derived.accuracy,
    wrongChars: Math.max(
      0,
      validated.data.keystrokes - validated.data.correctChars,
    ),
    userName: validated.data.userName.trim(),
    createdAt: new Date(),
  };

  await saveScore(record);

  return {
    ok: true as const,
    score: record,
  };
}
