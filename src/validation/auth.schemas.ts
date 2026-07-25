import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('ADMIN', 'HUB', 'DOCTOR').required(),
  first_name: Joi.string().trim().optional(),
  last_name: Joi.string().trim().optional(),
  hub_name: Joi.string().trim().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
});

export const refreshTokenSchema = Joi.object({
  token: Joi.string().required(),
});

export const resetPasswordRequestSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordUpdateSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required(),
});

