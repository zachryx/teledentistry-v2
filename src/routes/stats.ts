import { Elysia } from 'elysia';
import { authGuard } from '../guards/auth';
import { getDailyStats } from '../services/stats.service';
import { HttpError } from '../guards/http-error';
import { successResponse } from '../swagger-schemas';

export const statsRoutes = (app: Elysia) =>
  app.group('/api/v1/stats', (app) =>
    app.use(authGuard).get('/', ({ user }) => {
      if (user.role !== 'HUB') throw new HttpError(403, 'Forbidden');
      return getDailyStats(user.id).then((stats) => ({
        success: true,
        message: 'daily stats fetched successfully',
        data: stats,
      }));
    }, { response: successResponse }),
  );
