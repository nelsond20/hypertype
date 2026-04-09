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
  try {
    const reset = await RateLimitModel.findOneAndUpdate(
      {
        key: input.key,
        $or: [{ expiresAt: { $lte: now } }, { expiresAt: { $exists: false } }],
      },
      { $set: { count: 1, expiresAt } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    if (reset) {
      return { allowed: true as const };
    }
  } catch (err) {
    const maybeMongoError = err as { code?: number };
    if (maybeMongoError.code !== 11000) {
      throw err;
    }
  }

  const incremented = await RateLimitModel.findOneAndUpdate(
    {
      key: input.key,
      expiresAt: { $gt: now },
      count: { $lt: input.limit },
    },
    { $inc: { count: 1 } },
    { new: true },
  ).lean();

  if (!incremented) {
    return { allowed: false as const };
  }

  return { allowed: true as const };
}
