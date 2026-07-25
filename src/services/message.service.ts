import mongoose, { type FilterQuery } from 'mongoose';
import {
  MessageModel,
  type MessageDocument,
  type MessageAttrs,
} from '../models/message.model';

export async function findMessages(chatId: string) {
  return MessageModel.find({
    chat: new mongoose.Types.ObjectId(chatId),
  } as FilterQuery<MessageDocument>).sort({ created_at: 1 }).lean();
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

