import { Elysia } from 'elysia';
import { HttpError } from './http-error';

export const requireRole = (...roles: string[]) => (app: Elysia) =>
  app.onBeforeHandle(({ headers }) => {
    // role comes from JWT payload in real usage; for now check header
    // or derive already attached user — guard runs after authGuard derive
  });

// ponytail: placeholder — actual role check happens per-route in Phase 2
