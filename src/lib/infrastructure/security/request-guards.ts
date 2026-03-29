import { error, type RequestEvent } from '@sveltejs/kit';
import { getNumberEnv, isProductionEnv } from '$lib/infrastructure/config/env';
import { consumeRateLimit } from '$lib/infrastructure/persistence/rate-limit-repository';
import { hasPersistentStorage } from '$lib/infrastructure/persistence/score-repository';

export function isProduction() {
  return isProductionEnv();
}

export function getClientIp(event: RequestEvent) {
  const forwardedFor = event.request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  const realIp = event.request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}

export function enforceJsonRequest(event: RequestEvent) {
  const contentType = event.request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw error(415, 'JSON body required');
  }
}

export function enforceRequestSize(event: RequestEvent, maxBytes: number) {
  const contentLength = Number(
    event.request.headers.get('content-length') ?? '0',
  );
  if (contentLength > maxBytes) {
    throw error(413, 'Payload too large');
  }
}

export function enforceSameOrigin(event: RequestEvent) {
  const origin = event.request.headers.get('origin');
  if (!origin) {
    if (isProduction()) {
      throw error(403, 'Origin required');
    }
    return;
  }

  if (origin !== event.url.origin) {
    throw error(403, 'Cross-origin request blocked');
  }
}

export async function requirePersistentStorage() {
  const available = await hasPersistentStorage();
  if (available) return;

  if (isProduction()) {
    throw error(503, 'Persistent storage unavailable');
  }
}

export async function enforceRateLimit(input: {
  event: RequestEvent;
  scope: string;
  limitEnv: string;
  fallbackLimit: number;
  windowMs: number;
}) {
  const result = await consumeRateLimit({
    key: `${input.scope}:${getClientIp(input.event)}`,
    limit: getNumberEnv(input.limitEnv, input.fallbackLimit),
    windowMs: input.windowMs,
  });

  if (!result) {
    if (isProduction()) {
      throw error(503, 'Persistent storage unavailable');
    }
    return;
  }

  if (!result.allowed) {
    throw error(429, 'Too many requests');
  }
}

export function buildSecurityHeaders() {
  const headers = new Headers();

  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  if (isProduction()) {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );
  }

  return headers;
}
