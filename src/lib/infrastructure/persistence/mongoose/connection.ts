import mongoose from 'mongoose';
import { getServerEnv, isProductionEnv } from '$lib/infrastructure/config/env';

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function getPersistenceConnection(): Promise<
  typeof mongoose | null
> {
  const uri = getServerEnv('MONGODB_URI');
  if (!uri) {
    if (isProductionEnv()) {
      throw new Error('MONGODB_URI is required in production');
    }
    return null;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri, {
      dbName: 'hypertype',
    });
  }

  return connectionPromise;
}
