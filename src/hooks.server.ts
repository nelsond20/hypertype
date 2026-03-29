import type { Handle } from '@sveltejs/kit';
import { buildSecurityHeaders } from '$lib/infrastructure/security/request-guards';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  const securityHeaders = buildSecurityHeaders();

  securityHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });

  if (event.url.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
};
