import mongoose, { type FilterQuery } from 'mongoose';
import { ChatModel, type ChatDocument } from '../models/chat.model';
import { getUnreadCount } from './message.service';
import { USER_ROLES } from '../constants/roles';

export async function findChats(query: any) {
  const filter: any = {};
  const options: any = {
    sort: '-last_message_sent_at',
  };

  const userId = query.hub ?? query.doctor;

  if (query.hub) {
    filter.hub = new mongoose.Types.ObjectId(query.hub);
  }

  if (query.doctor) {
    filter.doctor = new mongoose.Types.ObjectId(query.doctor);
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  options.page = page;
  options.limit = limit;
  options.skip = (page - 1) * limit;

  const [docs, totalCount] = await Promise.all([
    ChatModel.find(filter as FilterQuery<ChatDocument>)
      .sort(options.sort)
      .skip(options.skip ?? 0)
      .limit(options.limit ?? 0)
      .populate('hub')
      .populate('doctor')
      .populate('last_message_sent')
      .lean(),
    ChatModel.countDocuments(filter),
  ]);

  const unreadMessages = await Promise.all(
    docs.map(async (chat: any) => {
      return getUnreadCount(String(chat._id), String(userId));
    }),
  );

  const chatsWithUnread = docs.map((chat: any, index) => ({
    ...chat,
    unread_messages: unreadMessages[index],
  }));

  const totalPages = Math.ceil(totalCount / limit) || 1;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    docs: chatsWithUnread,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  };
}

export async function findChatById(id: string, filter: any) {
  return ChatModel.findOne({
    _id: id,
    ...filter,
  } as FilterQuery<ChatDocument>)
    .populate('hub')
    .populate('doctor')
    .lean();
}

export async function findChatByAppointmentParticipants(appointment: {
  hub: string;
  doctor: string;
}) {
  const existing = await ChatModel.findOne({
    hub: appointment.hub,
    doctor: appointment.doctor,
  } as FilterQuery<ChatDocument>).lean();

  if (existing) return existing;

  const roomId = crypto.randomUUID();
  const doc = await ChatModel.create({
    room_id: roomId,
    hub: appointment.hub,
    doctor: appointment.doctor,
  });
  return doc.toObject();
}

export async function getTotalUnreadCount(userId: string, role: string) {
  const filter: any = {};

  if (role === USER_ROLES.HUB) {
    filter.hub = userId;
  }

  if (role === USER_ROLES.DOCTOR) {
    filter.doctor = userId;
  }

  const chats = await ChatModel.find(filter as FilterQuery<ChatDocument>).lean();

  const unreadMessages = await Promise.all(
    chats.map(async (chat: any) =>
      getUnreadCount(String(chat._id), String(userId)),
    ),
  );

  const unread_counts = unreadMessages.reduce((sum, count) => sum + count, 0);

  return { unread_counts };
}

