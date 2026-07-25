import { t } from 'elysia';

export const successResponse = t.Object({
  success: t.Boolean(),
  message: t.String(),
  data: t.Optional(t.Any()),
});

export const authRegisterBody = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 6 }),
  role: t.String(),
  first_name: t.Optional(t.String()),
  last_name: t.Optional(t.String()),
  hub_name: t.Optional(t.String()),
});

export const authLoginBody = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String(),
});

export const refreshTokenBody = t.Object({
  token: t.String(),
});

export const resetPasswordRequestBody = t.Object({
  email: t.String({ format: 'email' }),
});

export const resetPasswordUpdateBody = t.Object({
  token: t.String(),
  password: t.String({ minLength: 6 }),
});

export const createPatientBody = t.Object({
  full_name: t.String(),
  email: t.String({ format: 'email' }),
  date_of_birth: t.Optional(t.String()),
  phone_number: t.String(),
  address: t.Optional(t.String()),
  city: t.Optional(t.String()),
  state: t.Optional(t.String()),
  gender: t.Optional(t.String()),
  occupation: t.Optional(t.String()),
  status: t.Optional(t.String()),
  medical_history: t.Optional(t.Any()),
});

export const updatePatientBody = t.Partial(createPatientBody);

export const createAppointmentBody = t.Object({
  patient: t.String(),
  schedule_date: t.String(),
  compplaints: t.Optional(t.String()),
  relevant_history: t.Optional(t.String()),
  extra_oral_exam: t.Optional(t.String()),
  oral_muscosae: t.Optional(t.String()),
  notes: t.Optional(t.String()),
  level_of_severity: t.Optional(t.Number()),
  has_chronic_conditions: t.Optional(t.String()),
  on_medications: t.Optional(t.String()),
});

export const queueAppointmentBody = t.Object({
  doctor: t.String(),
  latest_dental_visit: t.Optional(t.String()),
  reason_for_visit: t.Optional(t.String()),
  level_of_severity: t.Optional(t.Number()),
  has_chronic_conditions: t.Optional(t.String()),
  on_medications: t.Optional(t.String()),
  compplaints: t.Optional(t.String()),
  relevant_history: t.Optional(t.String()),
  extra_oral_exam: t.Optional(t.String()),
  oral_muscosae: t.Optional(t.String()),
  notes: t.Optional(t.String()),
});

export const submitConsultationBody = t.Object({
  doctor_diagnosis: t.Optional(t.Any()),
  line_of_treatment: t.Optional(t.Any()),
  referral: t.Optional(t.Object({
    hospital: t.String(),
    condition: t.String(),
  })),
});

export const updateNotesBody = t.Object({
  notes: t.String(),
});

export const createCallBody = t.Object({
  peer_id: t.String(),
  appointment_id: t.String(),
});

export const validateCallBody = t.Object({
  appointment_id: t.String(),
  peer_id: t.String(),
});

export const joinCallBody = t.Object({
  call_id: t.String(),
  peer_id: t.String(),
});

export const createInviteBody = t.Object({
  email: t.String({ format: 'email' }),
  role: t.String(),
});

export const deleteAwsFileBody = t.Object({
  fileLocation: t.String(),
});
