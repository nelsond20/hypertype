import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { submitPublicScore } from '$lib/application/scores/submit-public-score';
import {
  enforceJsonRequest,
  enforceRateLimit,
  enforceRequestSize,
  enforceSameOrigin,
  parseJsonBodyWithLimit,
} from '$lib/infrastructure/security/request-guards';

export const POST: RequestHandler = async (event) => {
  const maxPayloadBytes = 64 * 1024;
  enforceSameOrigin(event);
  enforceJsonRequest(event);
  enforceRequestSize(event, maxPayloadBytes);
  await enforceRateLimit({
    event,
    scope: 'submit',
    limitEnv: 'RATE_LIMIT_PER_HOUR',
    fallbackLimit: 30,
    windowMs: 60 * 60 * 1000,
  });

  const payload = await parseJsonBodyWithLimit(event, maxPayloadBytes);
  const result = await submitPublicScore(payload);
  if (!result.ok) {
    return json({ error: result.error }, { status: 400 });
  }

  return json({ ok: true, score: result.score }, { status: 201 });
};
