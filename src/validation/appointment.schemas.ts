import Joi from 'joi';

export const createAppointmentSchema = Joi.object({
  patient: Joi.string().hex().length(24).required(),
  schedule_date: Joi.date().required(),
  compplaints: Joi.string().optional(),
  relevant_history: Joi.string().optional(),
  extra_oral_exam: Joi.string().optional(),
  oral_muscosae: Joi.string().optional(),
  notes: Joi.string().optional(),
  level_of_severity: Joi.number().integer().min(0).optional(),
  has_chronic_conditions: Joi.string().optional(),
  on_medications: Joi.string().optional(),
});

export const queueAppointmentSchema = Joi.object({
  doctor: Joi.string().hex().length(24).required(),
  latest_dental_visit: Joi.string().optional(),
  reason_for_visit: Joi.string().optional(),
  level_of_severity: Joi.number().integer().min(0).optional(),
  has_chronic_conditions: Joi.string().optional(),
  on_medications: Joi.string().optional(),
  compplaints: Joi.string().optional(),
  relevant_history: Joi.string().optional(),
  extra_oral_exam: Joi.string().optional(),
  oral_muscosae: Joi.string().optional(),
  notes: Joi.string().optional(),
});

export const appointmentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sort: Joi.string().optional(),
  status: Joi.string().optional(),
  search: Joi.string().optional(),
});

export const submitConsultationSchema = Joi.object({
  doctor_diagnosis: Joi.object().optional(),
  line_of_treatment: Joi.object().optional(),
  referral: Joi.object({
    hospital: Joi.string().required(),
    condition: Joi.string().required(),
  }).optional(),
});

export const updateNotesSchema = Joi.object({
  notes: Joi.string().required(),
});

