import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { isProduction } from '$lib/server/security';

export const GET: RequestHandler = async () => {
  const db = await getDb().catch(() => null);
  return json({
    ok: true,
    service: 'hypertype',
    database: db ? 'connected' : 'missing',
    environment: isProduction() ? 'production' : 'development',
  });
};
