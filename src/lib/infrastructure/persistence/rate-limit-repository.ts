import { getPersistenceConnection } from './mongoose/connection';
import { RateLimitModel } from './mongoose/models/rate-limit.model';

export async function consumeRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const connection = await getPersistenceConnection();
  if (!connection) return null;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + input.windowMs);
  const existing = await RateLimitModel.findOne({ key: input.key }).lean();

  if (!existing || new Date(existing.expiresAt).getTime() <= now.getTime()) {
    await RateLimitModel.findOneAndUpdate(
      { key: input.key },
      { $set: { count: 1, expiresAt } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return { allowed: true as const };
  }

  if (existing.count >= input.limit) {
    return { allowed: false as const };
  }

  await RateLimitModel.updateOne({ key: input.key }, { $inc: { count: 1 } });
  return { allowed: true as const };
}
