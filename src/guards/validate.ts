import Joi from 'joi';
import { Elysia } from 'elysia';
import { HttpError } from './http-error';

/** Run Joi validation inline in a handler. Throws HttpError on failure. */
export function validateBody<T>(schema: Joi.ObjectSchema<T>, data: unknown): T {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    throw new HttpError(
      400,
      'Validation failed',
      error.details.map((d) => ({ message: d.message, path: d.path })),
    );
  }
  return value;
}

/** ElysiaJS plugin: derive that validates & replaces body/query/params */
export const validate = (
  schema: Joi.ObjectSchema,
  location: 'body' | 'query' | 'params' = 'body',
) => (app: Elysia) =>
  app.derive(({ [location]: data }) => ({
    [location]: validateBody(schema, data),
  }));
