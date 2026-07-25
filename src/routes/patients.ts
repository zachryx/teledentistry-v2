import { Elysia } from 'elysia';
import { authGuard } from '../guards/auth';
import { validate } from '../guards/validate';
import {
  createPatientSchema,
  hubPatientsQuerySchema,
  updatePatientSchema,
} from '../validation/patient.schemas';
import {
  createPatient,
  findByEmail,
  findById,
  findHubPatients,
  updatePatient,
} from '../services/patients.service';
import { HttpError } from '../guards/http-error';
import { successResponse, createPatientBody, updatePatientBody } from '../swagger-schemas';

export const patientsRoutes = (app: Elysia) =>
  app.group('/api/v1/patients', (app) =>
    app.use(authGuard)
      .post(
        '/',
        ({ body, user }) => {
          if (user.role !== 'HUB') throw new HttpError(403, 'Forbidden');
          return findByEmail(body.email).then((existing) => {
            if (existing) throw new HttpError(400, 'patient already exists');
            return createPatient({ ...body, hub: user.id }).then((patient) => ({
              success: true,
              message: 'patient created successfully',
              data: patient,
            }));
          });
        },
        { body: createPatientBody, response: successResponse },
      )
      .get(
        '/hub',
        ({ query, user }) => {
          if (user.role !== 'HUB') throw new HttpError(403, 'Forbidden');
          return findHubPatients(user.id, query).then((patients) => ({
            success: true,
            message: 'hub patients fetched successfully',
            data: patients,
          }));
        },
        { response: successResponse },
      )
      .get('/:id', ({ params }) =>
        findById(params.id).then((patient) => {
          if (!patient) throw new HttpError(404, 'Patient not found');
          return {
            success: true,
            message: 'Patient fetched successfully',
            data: patient,
          };
        }),
        { response: successResponse },
      )
      .patch(
        '/:id',
        ({ params, body, user }) => {
          if (user.role !== 'HUB') throw new HttpError(403, 'Forbidden');
          return updatePatient(
            { _id: params.id, hub: user.id } as any,
            body,
          ).then((updated) => {
            if (!updated) throw new HttpError(404, 'Patient not found');
            return {
              success: true,
              message: 'Patient updated successfully',
              data: updated,
            };
          });
        },
        { body: updatePatientBody, response: successResponse },
      ),
  );
