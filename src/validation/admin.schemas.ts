import Joi from 'joi';

export const createInviteSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('ADMIN', 'HUB', 'DOCTOR').required(),
});

export const fetchUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  role: Joi.string().optional(),
  search: Joi.string().optional(),
  sortBy: Joi.string()
    .valid('created_at', 'updated_at', 'first_name', 'last_name', 'email', 'role', 'status', 'hub_name')
    .optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});

export const fetchInvitesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().optional(),
});

export const fetchAppointmentsAdminQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().optional(),
  doctor: Joi.string().hex().length(24).optional(),
  hub: Joi.string().hex().length(24).optional(),
  patient: Joi.string().hex().length(24).optional(),
});

