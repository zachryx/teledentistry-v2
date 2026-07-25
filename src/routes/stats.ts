import { Elysia } from 'elysia';
import { authGuard, assertRole } from '../guards/auth';
import { getDailyStats } from '../services/stats.service';
import { successResponse } from '../swagger-schemas';

export const statsRoutes = (app: Elysia) =>
  app.group('/api/v1/stats', (app) =>
    app.use(authGuard).get('/', ({ user }) => {
      assertRole(user, 'HUB');
      return getDailyStats(user.id).then((stats) => ({
        success: true,
        message: 'daily stats fetched successfully',
        data: stats,
      }));
    }, { response: successResponse }),
  );
