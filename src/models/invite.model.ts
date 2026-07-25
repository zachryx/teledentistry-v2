import mongoose, { Schema, type Document } from 'mongoose';

export interface InviteAttrs {
  email: string;
  role?: string;
  is_active?: boolean;
  expires_at: Date;
}

export interface InviteDocument extends Document, InviteAttrs {}

const inviteSchema = new Schema<InviteDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    role: { type: String },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    expires_at: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    versionKey: false,
  },
);

inviteSchema.index({ email: 1, is_active: 1 });

export const InviteModel = mongoose.model<InviteDocument>('Invite', inviteSchema);

