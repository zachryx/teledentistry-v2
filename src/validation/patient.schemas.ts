import Joi from 'joi';

export const createPatientSchema = Joi.object({
  full_name: Joi.string().trim().required(),
  email: Joi.string().email().required(),
  date_of_birth: Joi.date().optional(),
  phone_number: Joi.string().trim().required(),
  address: Joi.string().optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  gender: Joi.string().optional(),
  occupation: Joi.string().optional(),
  status: Joi.string().optional(),
  medical_history: Joi.object({
    chronic_conditions: Joi.string().optional(),
    allergies: Joi.string().optional(),
    previous_surgeries: Joi.string().optional(),
    current_medications: Joi.string().optional(),
    history_of_smoking: Joi.string().optional(),
    history_of_alcoholic: Joi.string().optional(),
  }).optional(),
});

export const updatePatientSchema = createPatientSchema.fork(
  Object.keys(createPatientSchema.describe().keys ?? {}),
  (schema) => schema.optional(),
);

export const hubPatientsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().optional(),
});

