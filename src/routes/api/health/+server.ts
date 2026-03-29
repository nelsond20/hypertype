import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';

export const GET: RequestHandler = async () => {
  const db = await getDb();
  return json({
    ok: true,
    service: 'hypertype',
    database: db ? 'connected' : 'missing',
  });
};
