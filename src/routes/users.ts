import { Elysia, t } from 'elysia';
import { authGuard } from '../guards/auth';
import { getUsers, updateProfile } from '../services/users.service';
import { HttpError } from '../guards/http-error';
import { successResponse } from '../swagger-schemas';

export const usersRoutes = (app: Elysia) =>
  app.group('/api/v1/users', (app) =>
    app.use(authGuard).get('/', ({ user: _user, query }) =>
      getUsers(query).then((users) => ({
        success: true,
        message: 'users fetched successfully',
        data: users,
      }))
    , { response: successResponse }).patch('/', ({ user, body }) => {
      if (!user) throw new HttpError(401, 'Unauthorized');
      return updateProfile(user.id, body).then((updated) => ({
        success: true,
        message: 'User profile updated successfully',
        data: updated,
      }));
    }, { body: t.Object({}), response: successResponse }),
  );
