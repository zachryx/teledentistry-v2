import Joi from 'joi';

export const createCallSchema = Joi.object({
  appointment_id: Joi.string().hex().length(24).required(),
  peer_id: Joi.string().required(),
});

export const validateCallSchema = createCallSchema;

export const joinCallSchema = Joi.object({
  call_id: Joi.string().hex().length(24).required(),
  peer_id: Joi.string().required(),
});

