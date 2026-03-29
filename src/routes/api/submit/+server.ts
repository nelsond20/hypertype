import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getScoreModel } from '$lib/server/db';
import { memoryInsert } from '$lib/server/memory';
import { validateScorePayload } from '$lib/server/validation';
import type { LeaderboardItem } from '$lib/shared/types';

export const POST: RequestHandler = async ({ request }) => {
  const payload = await request.json().catch(() => null);
  const validated = validateScorePayload(payload);
  if (!validated.ok) {
    return json({ error: validated.error }, { status: 400 });
  }

  const record: LeaderboardItem = {
    ...validated.data,
    createdAt: new Date(),
  };

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
