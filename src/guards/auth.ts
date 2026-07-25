import { Elysia } from 'elysia';
import { HttpError } from './http-error';

export interface AuthUserPayload {
  id: string;
  email: string;
  role?: string;
}

export const authGuard = (app: Elysia) =>
  app.derive(async ({ headers, jwt }) => {
    const auth = headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new HttpError(401, 'Missing or invalid authorization header');
    }
    const token = auth.slice(7);
    const payload = await jwt.verify(token);
    if (!payload) {
      throw new HttpError(401, 'Invalid or expired token');
    }
    return {
      user: { id: payload.id as string, email: payload.email as string, role: payload.role as string },
    };
  });

export const requireRole = (...roles: string[]) => (app: Elysia) =>
  app.guard({
    beforeHandle({ user }) {
      if (!user || !roles.includes(user.role)) throw new HttpError(403, 'Forbidden');
    },
  });

export function assertRole(user: { role?: string } | undefined, ...roles: string[]) {
  if (!user || !roles.includes(user.role)) throw new HttpError(403, 'Forbidden');
}
