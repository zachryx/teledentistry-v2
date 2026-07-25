import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ChatSessionManager } from './chat-session-manager';
import { SOCKET_EVENTS } from './socket-events';
import { findById as findUserById } from '../services/users.service';
import { findChatByAppointmentParticipants, findChatById, getTotalUnreadCount } from '../services/chat.service';
import { createMessage, getUnreadCount, markRead } from '../services/message.service';

export function initChatSocket(io: Server): ChatSessionManager {
  const sessionManager = new ChatSessionManager(io);

  io.on('connection', async (socket) => {
    try {
      const token =
        (socket.handshake.auth && (socket.handshake.auth as any).token) ||
        socket.handshake.headers.authorization;

      if (!token) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'No token provided' });
        socket.disconnect(true);
        return;
      }

      const rawToken = String(token).startsWith('Bearer ')
        ? String(token).slice(7)
        : String(token);

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Server misconfigured' });
        socket.disconnect(true);
        return;
      }

      const payload = jwt.verify(rawToken, secret) as { id: string; email: string };
      const user = await findUserById(payload.id);
      if (!user) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'User not found' });
        socket.disconnect(true);
        return;
      }

      (socket as any).user = user;

      socket.emit('connected', {
        message: 'Successfully connected to Teledentistry chat server',
        userId: user._id,
      });

      await sessionManager.addSession(String(user._id), socket);

      // MESSAGE_SEND
      socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (raw) => {
        try {
          const { room_id, ...rest } =
            typeof raw === 'string' ? JSON.parse(raw) : raw;

          const chat = await findChatById(room_id, {});
          if (!chat) return;

          const msg = await createMessage({
            chat: chat._id,
            sender: user._id,
            ...rest,
          } as any);

          await sessionManager.emitToRoom(
            room_id,
            SOCKET_EVENTS.MESSAGE_RECEIVED,
            msg,
          );
        } catch (err) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to send message' });
        }
      });

      // CHAT_START
      socket.on(SOCKET_EVENTS.CHAT_START, async (raw) => {
        try {
          const body = typeof raw === 'string' ? JSON.parse(raw) : raw;
          const { hub, doctor } = body;
          const chat = await findChatByAppointmentParticipants({ hub, doctor });

          await sessionManager.emitToUser(
            String(user._id),
            SOCKET_EVENTS.CHAT_STARTED,
            chat,
          );
        } catch {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to start chat' });
        }
      });

      // CHAT_JOIN
      socket.on(SOCKET_EVENTS.CHAT_JOIN, async (raw) => {
        const body = typeof raw === 'string' ? JSON.parse(raw) : raw;
        await sessionManager.joinRoom(socket.id, body.room_id);
      });

      // CHAT_LEAVE
      socket.on(SOCKET_EVENTS.CHAT_LEAVE, async (raw) => {
        const body = typeof raw === 'string' ? JSON.parse(raw) : raw;
        await sessionManager.leaveRoom(socket.id, body.room_id);
      });

      // NOTIFICATIONS_UNREAD — push total unread count to the requesting user
      socket.on(SOCKET_EVENTS.NOTIFICATIONS_UNREAD, async () => {
        try {
          const result = await getTotalUnreadCount(String(user._id), user.role);
          await sessionManager.emitToUser(
            String(user._id),
            SOCKET_EVENTS.NOTIFICATIONS_UNREAD,
            result,
          );
        } catch {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to fetch unread count' });
        }
      });
    } catch {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication failed' });
      socket.disconnect(true);
    }
  });

  return sessionManager;
}

