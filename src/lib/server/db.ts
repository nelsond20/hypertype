import { MongoClient, type Db, type Collection } from 'mongodb';
import type { LeaderboardItem } from '$lib/shared/types';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

function getMongoUri() {
  return process.env.MONGODB_URI;
}

export async function getDb(): Promise<Db | null> {
  const uri = getMongoUri();
  if (!uri) return null;

  if (!clientPromise) {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }

  const connected = await clientPromise;
  return connected.db();
}

export async function getScoresCollection(): Promise<Collection<LeaderboardItem> | null> {
  const db = await getDb();
  if (!db) return null;
  const collection = db.collection<LeaderboardItem>('scores');
  await collection.createIndexes([
    { key: { difficulty: 1, language: 1, wpm: -1, createdAt: -1 } },
    { key: { createdAt: -1 } },
    { key: { gameId: 1 }, unique: true },
  ]);
  return collection;
}
