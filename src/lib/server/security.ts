import { error, type RequestEvent } from '@sveltejs/kit';
import { isProductionEnv } from './env';
import { getDb } from './db';
import { RateLimitModel } from './rate-limit.model';

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
  const db = await getDb();
  if (db) return db;

  if (isProduction()) {
    throw error(503, 'Persistent storage unavailable');
  }

  return null;
}

export async function enforceRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const db = await getDb();
  if (!db) {
    if (isProduction()) {
      throw error(503, 'Persistent storage unavailable');
    }
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + options.windowMs);
  const existing = await RateLimitModel.findOne({ key: options.key }).lean();

  if (!existing || new Date(existing.expiresAt).getTime() <= now.getTime()) {
    await RateLimitModel.findOneAndUpdate(
      { key: options.key },
      { $set: { count: 1, expiresAt } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return;
  }

  if (existing.count >= options.limit) {
    throw error(429, 'Too many requests');
  }

  await RateLimitModel.updateOne({ key: options.key }, { $inc: { count: 1 } });
}

export function buildSecurityHeaders() {
  const headers = new Headers();

  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  );
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
