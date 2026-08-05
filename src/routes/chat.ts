import { Elysia } from 'elysia';
import { authGuard } from '../guards/auth';
import {
  findChats,
  findChatByAppointmentParticipants,
  findChatById,
  getTotalUnreadCount,
} from '../services/chat.service';
import { markRead, getUnreadCount } from '../services/message.service';
import { HttpError } from '../guards/http-error';
import { successResponse } from '../swagger-schemas';

function roleFilter(role: string, id: string) {
  if (role === 'DOCTOR') return { doctor: id };
  if (role === 'HUB') return { hub: id };
  return {};
}

export const chatRoutes = (app: Elysia) =>
  app.group('/api/v1/chat', (app) =>
    app.use(authGuard)
      .get('/', async ({ query, user }) => {
        const q: any = { ...query, ...roleFilter(user.role, user.id) };
        const result = await findChats(q);
        return { success: true, message: 'user chats fetched successfully', data: result };
      }, { response: successResponse })
      .get('/unread-count', async ({ user }) => {
        const unread = await getTotalUnreadCount(user.id, user.role!);
        return { success: true, message: 'unread chats count fetched successfully', data: unread };
      }, { response: successResponse })
      .patch('/:id/read', async ({ params, user }) => {
        await markRead(params.id, user.id);
        return { success: true, message: 'Messages read successfully' };
      }, { response: successResponse })
      .get('/:id/unread-count', async ({ params, user }) => {
        const unread_messages = await getUnreadCount(params.id, user.id);
        return { success: true, message: 'unread messages count fetched successfully', data: { unread_messages } };
      }, { response: successResponse })
      .get('/:id', async ({ params, user }) => {
        const filter: any = { ...roleFilter(user.role, user.id) };
        const chat = await findChatById(params.id, filter);
        if (!chat) throw new HttpError(404, 'Chat not found');
        return { success: true, message: 'user chat fetched successfully', data: chat };
      }, { response: successResponse })
      .get('/appointment', async ({ query }) => {
        const chat = await findChatByAppointmentParticipants({
          hub: (query as any).hub,
          doctor: (query as any).doctor,
        });
        if (!chat) throw new HttpError(404, 'Chat not found');
        return { success: true, message: 'appointment chat fetched successfully', data: chat };
      }, { response: successResponse })
      .get('/appointment/:id', async ({ params }) => {
        const { findChatByAppointment } = await import('../services/chat.service');
        const chat = await findChatByAppointment(params.id);
        if (!chat) throw new HttpError(404, 'Chat not found');
        return { success: true, message: 'appointment chat fetched successfully', data: chat };
      }, { response: successResponse }),
  );
