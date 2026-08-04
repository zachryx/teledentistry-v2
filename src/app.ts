import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { jwt } from '@elysiajs/jwt';
import { cron } from '@elysiajs/cron';
import { successResponse } from './swagger-schemas';
import mongoose from 'mongoose';
import { connectMongo } from './config/mongo';
import { HttpError } from './guards/http-error';
import { AppointmentModel, APPOINTMENT_STATUS } from './models/appointment.model';
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

const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing required env: ${key}`);
    process.exit(1);
  }
}

const app = new Elysia()
  .use(cors())
  .use(swagger({ path: '/api-docs' }))
  .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET!, expiresIn: '2d' }))
  .onError(({ error, set }) => {
    const e = error as any;
    if (e.status && typeof e.status === 'number') {
      set.status = e.status;
      return { success: false, message: e.message, ...(e.details ? { errors: e.details } : {}) };
    }
    set.status = 500;
    return { success: false, message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : e.message };
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
  })
  .use(cron({
    name: 'appointment-cleanup',
    pattern: '*/5 * * * *',
    run: async () => {
      const now = new Date();
      await AppointmentModel.updateMany(
        { status: APPOINTMENT_STATUS.PENDING, schedule_date: { $lt: now } },
        { $set: { status: APPOINTMENT_STATUS.PASSED } },
      );
      const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
      await AppointmentModel.updateMany(
        { status: APPOINTMENT_STATUS.IN_PROGRESS, start_time: { $lt: thirtyMinAgo } },
        { $set: { status: APPOINTMENT_STATUS.COMPLETED } },
      );
    },
  }))
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
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

export { app };
