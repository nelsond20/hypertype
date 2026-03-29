import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const rateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    count: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  {
    versionKey: false,
  },
);

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RateLimitDocument = InferSchemaType<typeof rateLimitSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type RateLimitModelType = mongoose.Model<RateLimitDocument>;

export const RateLimitModel =
  (mongoose.models.RateLimit as RateLimitModelType | undefined) ??
  mongoose.model<RateLimitDocument>('RateLimit', rateLimitSchema);
