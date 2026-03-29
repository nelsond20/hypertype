import mongoose from 'mongoose';
import { getServerEnv } from './env';
import { ScoreModel } from './score.model';

function getMongoUri() {
  return getServerEnv('MONGODB_URI');
}

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function getDb(): Promise<typeof mongoose | null> {
  const uri = getMongoUri();
  if (!uri) return null;

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri, {
      dbName: 'hypertype',
    });
  }

  return connectionPromise;
}

export async function getScoreModel() {
  const db = await getDb();
  if (!db) return null;
  return ScoreModel;
}
