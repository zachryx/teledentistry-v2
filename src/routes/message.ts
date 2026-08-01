import { Elysia } from 'elysia';
import { authGuard } from '../guards/auth';
import { deleteMessage, findMessages } from '../services/message.service';
import { HttpError } from '../guards/http-error';
import { successResponse } from '../swagger-schemas';

export const messageRoutes = (app: Elysia) =>
  app.group('/api/v1/message', (app) =>
    app.use(authGuard)
      .get('/:id', ({ params, query }) =>
        findMessages(params.id, query).then((result) => ({
          success: true,
          message: 'chat messages fetched successfully',
          data: result,
        })),
        { response: successResponse },
      )
      .delete('/:id', ({ params, user }) =>
        deleteMessage(params.id, user.id).then((message) => {
          if (!message) throw new HttpError(404, 'Message not found');
          return { success: true, message: 'Message deleted successfully' };
        }),
        { response: successResponse },
      ),
  );
