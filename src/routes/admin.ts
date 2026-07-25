import { Elysia } from 'elysia';
import { authGuard, requireRole } from '../guards/auth';
import { validate, validateBody } from '../guards/validate';
import {
  createInvite,
  deleteInvite,
  fetchAppointments,
  fetchUsers,
  findInvite,
  findInviteByEmail,
  findInvites,
} from '../services/admin.service';
import {
  approveUser,
  findByEmail,
  findById as findUserById,
} from '../services/users.service';
import {
  createInviteSchema,
  fetchAppointmentsAdminQuerySchema,
  fetchInvitesQuerySchema,
  fetchUsersQuerySchema,
} from '../validation/admin.schemas';
import { sendInviteEmail } from '../services/mailer.service';
import { HttpError } from '../guards/http-error';
import { successResponse, createInviteBody } from '../swagger-schemas';

export const adminRoutes = (app: Elysia) =>
  app.group('/api/v1/admin', (app) =>
    app.use(authGuard).use(requireRole('ADMIN'))
      .post('/invites', ({ body }) => {
        const { email, role } = validateBody(createInviteSchema, body as any);
        return findByEmail(email).then((exists) => {
          if (exists) throw new HttpError(400, 'Email address is already registered');
          return findInviteByEmail(email).then((inviteExists) => {
            if (inviteExists) throw new HttpError(400, 'An active invite already exists for this email');
            return createInvite({ email, role }).then((invite) =>
              sendInviteEmail(email).then(() => ({
                success: true,
                message: 'Invite created successfully',
                data: invite,
              })),
            );
          });
        });
      }, { body: createInviteBody, response: successResponse })
      .get('/invites/:id/resend', ({ params }) =>
        findInvite(params.id).then((invite) => {
          if (!invite) throw new HttpError(404, 'Invite not found');
          return { success: true, message: 'Invite resent successfully' };
        }),
        { response: successResponse },
      )
      .delete('/invites/:id', ({ params }) =>
        deleteInvite(params.id).then((invite) => {
          if (!invite) throw new HttpError(404, 'Invite not found');
          return { success: true, message: 'Invite deleted successfully' };
        }),
        { response: successResponse },
      )
      .get('/invites', ({ query }) =>
        findInvites(query).then((invites) => ({
          success: true,
          message: 'Invites fetched successfully',
          data: invites,
        })),
        { response: successResponse },
      )
      .get('/invites/:id', ({ params }) =>
        findInvite(params.id).then((invite) => {
          if (!invite) throw new HttpError(404, 'Invite not found');
          return { success: true, message: 'Invite fetched successfully', data: invite };
        }),
        { response: successResponse },
      )
      .get('/users', ({ query }) =>
        fetchUsers(query).then((users) => ({
          success: true,
          message: 'Users fetched successfully',
          data: users,
        })),
        { response: successResponse },
      )
      .get('/users/:id', ({ params }) =>
        findUserById(params.id).then((user) => {
          if (!user) throw new HttpError(404, 'User not found');
          return { success: true, message: 'User fetched successfully', data: user };
        }),
        { response: successResponse },
      )
      .get('/appointments', ({ query }) =>
        fetchAppointments(query).then((appointments) => ({
          success: true,
          message: 'Appointments fetched successfully',
          data: appointments,
        })),
        { response: successResponse },
      )
      .patch('/users/:id/approve', ({ params }) =>
        findUserById(params.id).then((user) => {
          if (!user) throw new HttpError(404, 'User not found');
          return approveUser(params.id).then((approved) => ({
            success: true,
            message: 'User account approved successfully',
            data: approved,
          }));
        }),
        { response: successResponse },
      ),
  );
