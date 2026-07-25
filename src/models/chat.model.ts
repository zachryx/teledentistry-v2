import mongoose, { Schema, type Document } from 'mongoose';

export interface ChatAttrs {
  room_id: string;
  hub: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  last_message_sent?: mongoose.Types.ObjectId;
  last_message_sent_at?: Date;
}

export interface ChatDocument extends Document, ChatAttrs {}

const chatSchema = new Schema<ChatDocument>(
  {
    room_id: { type: String, required: true },
    hub: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    last_message_sent: { type: Schema.Types.ObjectId, ref: 'Message' },
    last_message_sent_at: Date,
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

export const ChatModel = mongoose.model<ChatDocument>('Chat', chatSchema);

