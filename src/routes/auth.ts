import { Elysia } from 'elysia';
import { authGuard } from '../guards/auth';
import { validateBody } from '../guards/validate';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordRequestSchema,
  resetPasswordUpdateSchema,
} from '../validation/auth.schemas';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  forwardPasswordResetMail,
  resetPassword,
} from '../services/auth.service';
import { findById } from '../services/users.service';
import { HttpError } from '../guards/http-error';
import {
  successResponse,
  authRegisterBody,
  authLoginBody,
  refreshTokenBody,
  resetPasswordRequestBody,
  resetPasswordUpdateBody,
} from '../swagger-schemas';

// ponytail: in-memory rate limiter, per-IP with Redis if distributed
const rateLimits = new Map<string, number>();
function checkRateLimit(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'local';
  const count = (rateLimits.get(ip) || 0) + 1;
  rateLimits.set(ip, count);
  setTimeout(() => rateLimits.delete(ip), 60000);
  if (count > 100) throw new HttpError(429, 'Too many requests');
}

export const authRoutes = (app: Elysia) =>
  app.group('/api/v1/auth', (app) =>
    app.onBeforeHandle(({ request }) => { if (request.method === 'POST') checkRateLimit(request); })
        .post('/register', async ({ body }) => {
          const data = validateBody(registerSchema, body as any);
          const user = await registerUser(data);
          return { success: true, message: 'user registered successfully', data: user };
        }, { body: authRegisterBody, response: successResponse })
        .post('/login', async ({ body }) => {
          const { email, password } = validateBody(loginSchema, body as any);
          const { user, tokens } = await loginUser(email, password);
          return { success: true, message: 'user logged in successfully', data: { user, tokens } };
        }, { body: authLoginBody, response: successResponse })
        .post('/refresh-token', async ({ body }) => {
          const { token } = validateBody(refreshTokenSchema, body as any);
          const tokens = await refreshAccessToken(token);
          return { success: true, message: 'access token refreshed successfully', data: tokens };
        }, { body: refreshTokenBody, response: successResponse })
        .post('/reset-password', async ({ body }) => {
          const { email } = validateBody(resetPasswordRequestSchema, body as any);
          await forwardPasswordResetMail(email);
          return { success: true, message: 'Password reset mail sent successfully' };
        }, { body: resetPasswordRequestBody, response: successResponse })
        .patch('/reset-password', async ({ body }) => {
          const { token, password } = validateBody(resetPasswordUpdateSchema, body as any);
          await resetPassword(token, password);
          return { success: true, message: 'User password reset successfully' };
        }, { body: resetPasswordUpdateBody, response: successResponse }),
    )
    .group('/api/v1/auth', (app) =>
      app.use(authGuard).get('/me', async ({ user }) => {
        const u = await findById(user.id);
        if (!u) throw new HttpError(404, 'User not found');
        return { success: true, message: 'auth user fetched successfully', data: u };
      }, { response: successResponse }),
    );
