import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getScoreModel } from '$lib/server/db';
import { memoryInsert } from '$lib/server/memory';
import {
  enforceJsonRequest,
  enforceRateLimit,
  enforceRequestSize,
  enforceSameOrigin,
  getClientIp,
  requirePersistentStorage,
} from '$lib/server/security';
import { getNumberEnv } from '$lib/server/env';
import { deriveScore } from '$lib/shared/scoring';
import { validateScorePayload } from '$lib/server/validation';
import type { LeaderboardItem } from '$lib/shared/types';

export const POST: RequestHandler = async (event) => {
  enforceSameOrigin(event);
  enforceJsonRequest(event);
  enforceRequestSize(event, 64 * 1024);
  await enforceRateLimit({
    key: `submit:${getClientIp(event)}`,
    limit: getNumberEnv('RATE_LIMIT_PER_HOUR', 30),
    windowMs: 60 * 60 * 1000,
  });

  const { request } = event;
  const payload = await request.json().catch(() => null);
  const validated = validateScorePayload(payload);
  if (!validated.ok) {
    return json({ error: validated.error }, { status: 400 });
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

  await requirePersistentStorage();
  const Score = await getScoreModel();
  if (Score) {
    await Score.findOneAndUpdate(
      { gameId: record.gameId },
      { $setOnInsert: record },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } else {
    memoryInsert(record);
  }

  return json({ ok: true, score: record }, { status: 201 });
};
