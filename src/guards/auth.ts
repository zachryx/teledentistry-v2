import jwt from 'jsonwebtoken';
import { Elysia } from 'elysia';
import { HttpError } from './http-error';

export interface AuthUserPayload {
  id: string;
  email: string;
  role?: string;
}

export const authGuard = (app: Elysia) =>
  app.derive(({ headers }) => {
    const auth = headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new HttpError(401, 'Missing or invalid authorization header');
    }
    const token = auth.slice(7);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthUserPayload;
      return {
        user: { id: payload.id, email: payload.email, role: payload.role },
      };
    } catch {
      throw new HttpError(401, 'Invalid or expired token');
    }
  });
