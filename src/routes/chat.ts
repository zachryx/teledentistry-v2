import { Elysia } from 'elysia';
import { authGuard } from '../guards/auth';
import {
  findChats,
  findChatByAppointmentParticipants,
  findChatById,
  getTotalUnreadCount,
} from '../services/chat.service';
import { markRead, getUnreadCount } from '../services/message.service';
import { successResponse } from '../swagger-schemas';

export const chatRoutes = (app: Elysia) =>
  app.group('/api/v1/chat', (app) =>
    app.use(authGuard)
      .get('/', ({ query, user }) => {
        const q: any = { ...query };
        if (user.role === 'DOCTOR') q.doctor = user.id;
        else if (user.role === 'HUB') q.hub = user.id;
        return findChats(q).then((result) => ({
          success: true,
          message: 'user chats fetched successfully',
          data: result,
        }));
      }, { response: successResponse })
      .get('/unread-count', ({ user }) =>
        getTotalUnreadCount(user.id, user?.role as string).then((unread) => ({
          success: true,
          message: 'unread chats count fetched successfully',
          data: unread,
        }))
      , { response: successResponse })
      .patch('/:id/read', ({ params, user }) =>
        markRead(params.id, user.id).then(() => ({
          success: true,
          message: 'Messages read successfully',
        }))
      , { response: successResponse })
      .get('/:id/unread-count', ({ params, user }) =>
        getUnreadCount(params.id, user.id).then((unread_messages) => ({
          success: true,
          message: 'unread messages count fetched successfully',
          data: { unread_messages },
        }))
      , { response: successResponse })
      .get('/:id', ({ params, user }) => {
        const filter: any = {};
        if (user.role === 'DOCTOR') filter.doctor = user.id;
        else if (user.role === 'HUB') filter.hub = user.id;
        return findChatById(params.id, filter).then((chat) => ({
          success: true,
          message: 'user chat fetched successfully',
          data: chat,
        }));
      }, { response: successResponse })
      .get('/appointment/:id', ({ query }) =>
        findChatByAppointmentParticipants({
          hub: (query as any).hub,
          doctor: (query as any).doctor,
        }).then((chat) => ({
          success: true,
          message: 'appointment chat fetched successfully',
          data: chat,
        }))
      , { response: successResponse }),
  );
