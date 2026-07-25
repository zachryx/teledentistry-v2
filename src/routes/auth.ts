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

export const authRoutes = (app: Elysia) =>
  app
    .group('/api/v1/auth', (app) =>
      app
        .post('/register', ({ body }) => {
          const data = validateBody(registerSchema, body as any);
          return registerUser(data).then((user) => ({
            success: true,
            message: 'user registered successfully',
            data: user,
          }));
        }, { body: authRegisterBody, response: successResponse })
        .post('/login', ({ body }) => {
          const { email, password } = validateBody(loginSchema, body as any);
          return loginUser(email, password).then(({ user, tokens }) => ({
            success: true,
            message: 'user logged in successfully',
            data: { user, tokens },
          }));
        }, { body: authLoginBody, response: successResponse })
        .post('/refresh-token', ({ body }) => {
          const { token } = validateBody(refreshTokenSchema, body as any);
          return refreshAccessToken(token).then((tokens) => ({
            success: true,
            message: 'access token refreshed successfully',
            data: tokens,
          }));
        }, { body: refreshTokenBody, response: successResponse })
        .post('/reset-password', ({ body }) => {
          const { email } = validateBody(resetPasswordRequestSchema, body as any);
          return forwardPasswordResetMail(email).then(() => ({
            success: true,
            message: 'Password reset mail sent successfully',
          }));
        }, { body: resetPasswordRequestBody, response: successResponse })
        .patch('/reset-password', ({ body }) => {
          const { token, password } = validateBody(resetPasswordUpdateSchema, body as any);
          return resetPassword(token, password).then(() => ({
            success: true,
            message: 'User password reset successfully',
          }));
        }, { body: resetPasswordUpdateBody, response: successResponse }),
    )
    .group('/api/v1/auth', (app) =>
      app.use(authGuard).get('/me', ({ user }) =>
        findById(user.id).then((u) => {
          if (!u) throw new HttpError(404, 'User not found');
          return {
            success: true,
            message: 'auth user fetched successfully',
            data: u,
          };
        })
      , { response: successResponse }),
    );
