import { Elysia } from 'elysia';
import { authGuard, assertRole } from '../guards/auth';
import { validate } from '../guards/validate';
import {
  appointmentsQuerySchema,
  createAppointmentSchema,
  queueAppointmentSchema,
  submitConsultationSchema,
  updateNotesSchema,
} from '../validation/appointment.schemas';
import {
  addAppointmentToQueue,
  createAppointment,
  deleteAppointment,
  findAppointmentById,
  findDoctorAppointments,
  findHubAppointments,
  hasSimilarAppointment,
  isUserAffiliatedWithAppointment,
  submitConsultation,
  updateAppointment,
  updateAppointmentForHub,
} from '../services/appointments.service';
import { updatePatient } from '../services/patients.service';
import { APPOINTMENT_STATUS } from '../models/appointment.model';
import { HttpError } from '../guards/http-error';
import {
  successResponse,
  createAppointmentBody,
  queueAppointmentBody,
  submitConsultationBody,
  updateNotesBody,
} from '../swagger-schemas';

export const appointmentsRoutes = (app: Elysia) =>
  app.group('/api/v1/appointments', (app) =>
    app.use(authGuard)
      .post(
        '/',
        ({ body, user }) => {
          assertRole(user, 'HUB');
          return hasSimilarAppointment(body.patient, new Date(body.schedule_date)).then((similar) => {
            if (similar) throw new HttpError(409, 'A similar appointment already exists for this patient at the given time.');
            return createAppointment({ ...body, hub: user.id }).then((appointment) => ({
              success: true,
              message: 'Appointment scheduled successfully',
              data: appointment,
            }));
          });
        },
        { body: createAppointmentBody, response: successResponse },
      )
      .patch('/:id/start', ({ params, user }) =>
        isUserAffiliatedWithAppointment(user.id, params.id).then((affiliated) => {
          if (!affiliated) throw new HttpError(400, 'User not affiliated with appointment');
          return updateAppointment(params.id, { status: APPOINTMENT_STATUS.IN_PROGRESS } as any).then(() => ({
            success: true,
            message: 'Appointment started successfully.',
          }));
        }),
        { response: successResponse },
      )
      .get('/doctor', ({ query, user }) => {
        assertRole(user, 'DOCTOR');
        return findDoctorAppointments(user.id, query).then((result) => ({
          success: true,
          message: "Doctor's appointments fetched successfully",
          data: result,
        }));
      }, { response: successResponse })
      .get('/hub', ({ query, user }) => {
        assertRole(user, 'HUB');
        return findHubAppointments(user.id, query).then((result) => ({
          success: true,
          message: 'Hub appointments fetched successfully',
          data: result,
        }));
      }, { response: successResponse })
      .get('/:id', ({ params }) =>
        findAppointmentById(params.id).then((appointment) => {
          if (!appointment) throw new HttpError(404, `Appointment with ID ${params.id} not found.`);
          return { success: true, message: 'Appointment fetched successfully.', data: appointment };
        }),
        { response: successResponse },
      )
      .post('/:id/queue', ({ params, body, user }) => {
        assertRole(user, 'HUB');
        return addAppointmentToQueue(params.id, user.id, body).then((appointment) => ({
          success: true,
          message: 'Appointment added to queue',
          data: appointment,
        }));
      }, { body: queueAppointmentBody, response: successResponse })
      .get('/:id/history', ({ params, query }) =>
        findHubAppointments('', { ...query, patient: params.id }).then((result) => ({
          success: true,
          message: 'Patient consultation history fetched successfully',
          data: result,
        })),
        { response: successResponse },
      )
      .patch('/:id', ({ params, body, user }) => {
        assertRole(user, 'HUB');
        return updateAppointmentForHub(params.id, user.id, body).then((updated) => {
          if (!updated) throw new HttpError(404, 'Appointment not found');
          return { success: true, message: 'Appointment updated successfully', data: updated };
        });
      }, { body: createAppointmentBody, response: successResponse })
      .patch('/:id/consultation', ({ params, body }) =>
        findAppointmentById(params.id).then((appointment) => {
          if (!appointment || !appointment.consultation) throw new HttpError(404, 'Appointment not found');
          return submitConsultation(String(appointment.consultation), body).then(() =>
            findAppointmentById(params.id),
          ).then((refreshed) => ({
            success: true,
            message: 'Consultation submitted successfully',
            data: refreshed,
          }));
        }),
        { body: submitConsultationBody, response: successResponse },
      )
      .patch('/:id/notes', ({ params, body }) =>
        findAppointmentById(params.id).then((appointment) => {
          if (!appointment) throw new HttpError(404, 'Appointment not found');
          return updateAppointment(params.id, body as any).then(() => ({
            success: true,
            message: 'Notes updated successfully',
          }));
        }),
        { body: updateNotesBody, response: successResponse },
      )
      .patch('/:id/end', ({ params, user }) =>
        findAppointmentById(params.id).then((appointment) => {
          if (!appointment) throw new HttpError(404, 'Appointment not found');
          return isUserAffiliatedWithAppointment(user.id, params.id).then((affiliated) => {
            if (!affiliated) throw new HttpError(400, 'User not affiliated with appointment');
            return updateAppointment(params.id, { status: APPOINTMENT_STATUS.COMPLETED } as any)
              .then(() => updatePatient({ _id: appointment.patient } as any, { last_visit: new Date() }))
              .then(() => ({ success: true, message: 'Appointment ended successfully' }));
          });
        }),
        { response: successResponse },
      ),
  );
