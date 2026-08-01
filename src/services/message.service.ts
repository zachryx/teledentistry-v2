import mongoose, { type FilterQuery } from 'mongoose';
import {
  MessageModel,
  type MessageDocument,
  type MessageAttrs,
} from '../models/message.model';

export async function findMessages(chatId: string, query: any = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 30);
  const filter = { chat: new mongoose.Types.ObjectId(chatId) } as FilterQuery<MessageDocument>;

  const [messages, total] = await Promise.all([
    MessageModel.find(filter)
      .sort({ created_at: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    MessageModel.countDocuments(filter),
  ]);

  return { messages, total, page, limit };
}

export async function createMessage(attrs: MessageAttrs) {
  const doc = await MessageModel.create(attrs);
  return doc.toObject();
}

export async function deleteMessage(id: string, userId: string) {
  return MessageModel.findOneAndDelete({
    _id: id,
    sender: userId,
  } as FilterQuery<MessageDocument>).lean();
}

export async function markRead(chatId: string, userId: string) {
  return MessageModel.updateMany(
    {
      chat: chatId,
      sender: { $ne: userId },
      is_read: false,
    } as FilterQuery<MessageDocument>,
    { $set: { is_read: true } },
  );
}

export async function getUnreadCount(chatId: string, userId: string) {
  return MessageModel.countDocuments({
    chat: chatId,
    sender: { $ne: userId },
    is_read: false,
  } as FilterQuery<MessageDocument>);
}

