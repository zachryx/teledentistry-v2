import mongoose, { Schema, type Document } from 'mongoose';

export interface MessageAttrs {
  content?: string;
  file?: string;
  sender: mongoose.Types.ObjectId;
  chat: mongoose.Types.ObjectId;
  is_read?: boolean;
}

export interface MessageDocument extends Document, MessageAttrs {}

const messageSchema = new Schema<MessageDocument>(
  {
    content: { type: String, trim: true },
    file: String,
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      immutable: true,
    },
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
      immutable: true,
    },
    is_read: { type: Boolean, default: false },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

export const MessageModel = mongoose.model<MessageDocument>(
  'Message',
  messageSchema,
);

