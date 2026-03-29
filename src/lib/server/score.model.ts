import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import type { LeaderboardItem } from '$lib/shared/types';

const scoreSchema = new Schema(
  {
    gameId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: false },
    userName: { type: String, required: true },
    wpm: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    correctChars: { type: Number, required: true },
    wrongChars: { type: Number, required: true },
    keystrokes: { type: Number, required: true },
    durationMs: { type: Number, required: true },
    difficulty: { type: String, required: true, index: true },
    language: { type: String, required: true, index: true },
    seed: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    versionKey: false,
  },
);

scoreSchema.index({ difficulty: 1, language: 1, wpm: -1, createdAt: -1 });
scoreSchema.index({ createdAt: -1 });

export type ScoreDocument = InferSchemaType<typeof scoreSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type ScoreModelType = mongoose.Model<ScoreDocument>;

export const ScoreModel =
  (mongoose.models.Score as ScoreModelType | undefined) ??
  mongoose.model<ScoreDocument>('Score', scoreSchema);

export function toLeaderboardItem(score: ScoreDocument): LeaderboardItem {
  return {
    gameId: score.gameId,
    userId: score.userId ?? undefined,
    userName: score.userName,
    wpm: score.wpm,
    accuracy: score.accuracy,
    correctChars: score.correctChars,
    wrongChars: score.wrongChars,
    keystrokes: score.keystrokes,
    durationMs: score.durationMs,
    difficulty: score.difficulty as LeaderboardItem['difficulty'],
    language: score.language as LeaderboardItem['language'],
    seed: score.seed,
    createdAt: score.createdAt,
  };
}
