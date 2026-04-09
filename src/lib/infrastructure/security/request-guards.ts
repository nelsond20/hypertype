import { error, type RequestEvent } from '@sveltejs/kit';
import { isIP } from 'node:net';
import {
  getNumberEnv,
  getServerEnv,
  isProductionEnv,
} from '$lib/infrastructure/config/env';
import { consumeRateLimit } from '$lib/infrastructure/persistence/rate-limit-repository';
import { hasPersistentStorage } from '$lib/infrastructure/persistence/score-repository';

export function isProduction() {
  return isProductionEnv();
}

export function getClientIp(event: RequestEvent) {
  const direct = event.getClientAddress?.().trim();
  if (direct && isIP(direct)) {
    return direct;
  }

  const trustProxyHeaders =
    !isProduction() || getServerEnv('TRUST_PROXY_HEADERS') === 'true';
  if (trustProxyHeaders) {
    const forwardedFor = event.request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      const candidate = forwardedFor
        .split(',')
        .map((entry) => entry.trim())
        .find((entry) => Boolean(entry) && isIP(entry));
      if (candidate) return candidate;
    }

    const realIp = event.request.headers.get('x-real-ip')?.trim();
    if (realIp && isIP(realIp)) return realIp;
  }

  return 'unknown';
}

export function enforceJsonRequest(event: RequestEvent) {
  const contentType = event.request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw error(415, 'JSON body required');
  }
}

export function enforceRequestSize(event: RequestEvent, maxBytes: number) {
  const rawLength = event.request.headers.get('content-length');
  if (!rawLength) return;
  const contentLength = Number(rawLength);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw error(413, 'Payload too large');
  }
}

export async function parseJsonBodyWithLimit(
  event: RequestEvent,
  maxBytes: number,
) {
  const body = event.request.body;
  if (!body) {
    throw error(400, 'Request body required');
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      throw error(413, 'Payload too large');
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const raw = new TextDecoder().decode(merged).trim();
  if (!raw) {
    throw error(400, 'Request body required');
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw error(400, 'Invalid JSON payload');
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
  const clientIp = getClientIp(input.event);
  const userAgent = input.event.request.headers.get('user-agent')?.slice(0, 80);
  const identity =
    clientIp === 'unknown' ? `unknown:${userAgent ?? 'no-ua'}` : clientIp;
  const result = await consumeRateLimit({
    key: `${input.scope}:${identity}`,
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
