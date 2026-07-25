import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { successResponse } from './swagger-schemas';
import mongoose from 'mongoose';
import { connectMongo } from './config/mongo';
import { HttpError } from './guards/http-error';
import { authRoutes } from './routes/auth';
import { usersRoutes } from './routes/users';
import { patientsRoutes } from './routes/patients';
import { appointmentsRoutes } from './routes/appointments';
import { messageRoutes } from './routes/message';
import { chatRoutes } from './routes/chat';
import { callsRoutes } from './routes/calls';
import { adminRoutes } from './routes/admin';
import { statsRoutes } from './routes/stats';
import { miscRoutes } from './routes/misc';
import { seedAdmin } from './seed';
import { startAppointmentCron } from './cron';

const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing required env: ${key}`);
    process.exit(1);
  }
}

const app = new Elysia()
  .use(cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }))
  .use(swagger({ path: '/api-docs' }))
  .onError(({ error, set }) => {
    if (error instanceof HttpError) {
      set.status = error.status;
      return {
        success: false,
        message: error.message,
        ...(error.details ? { errors: error.details } : {}),
      };
    }
    const err = error as Error;
    if ('status' in err) {
      set.status = (err as any).status as number;
      return { success: false, message: err.message };
    }
    set.status = 500;
    return { success: false, message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message };
  })
  .onRequest(({ request }) => {
    console.log(`${request.method} ${request.url}`);
  })
  .get('/api/v1', () => ({ success: true, message: 'Teledentistry API' }), { response: successResponse })
  .get('/api/v1/health', () => {
    const dbOk = mongoose.connection.readyState === 1;
    return {
      success: dbOk,
      message: dbOk ? 'OK' : 'Database not connected',
      db: dbOk ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }, { response: successResponse })
  .use(authRoutes)
  .use(usersRoutes)
  .use(patientsRoutes)
  .use(appointmentsRoutes)
  .use(messageRoutes)
  .use(chatRoutes)
  .use(callsRoutes)
  .use(adminRoutes)
  .use(statsRoutes)
  .use(miscRoutes);

connectMongo()
  .then(() => {
    seedAdmin().catch((err) => console.error('Admin seed error:', err));
    startAppointmentCron();
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

export { app };
