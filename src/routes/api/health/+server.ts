import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSystemHealth } from '$lib/application/system/get-system-health';

export const GET: RequestHandler = async () => {
  return json(await getSystemHealth());
};
