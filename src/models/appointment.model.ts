import mongoose, { Schema, type Document } from 'mongoose';
import type { PatientDocument } from './patient.model';
import type { UserDocument } from './user.model';

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  QUEUE: 'queue',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PASSED: 'passed',
  CANCELLED: 'cancelled',
} as const;

export interface Periodontal {
  oral_hygiene: string;
  calculus: boolean;
  recession: boolean;
  recession_detail?: string;
  gingivitis: boolean;
  gingivitis_type?: string;
  pocket: boolean;
  pocket_location?: string;
  periodontitis: boolean;
  periodontitis_type?: string;
  periodontosis: boolean;
  periodontosis_details?: string;
}

export interface TeethAssessment {
  present?: string;
  caries?: string;
  occlusion?: string;
  provisional_diagnosis?: string;
  investigations?: string;
}

export interface AppointmentAttrs {
  schedule_date: Date;
  status?: string;
  patient: mongoose.Types.ObjectId | PatientDocument;
  compplaints?: string;
  relevant_history?: string;
  extra_oral_exam?: string;
  oral_muscosae?: string;
  periodontia?: Periodontal;
  teeth_assessment?: TeethAssessment;
  hub: mongoose.Types.ObjectId | UserDocument;
  latest_dental_visit?: string;
  reason_for_visit?: string;
  level_of_severity?: number;
  has_chronic_conditions?: string;
  on_medications?: string;
  notes?: string;
  start_time?: Date;
  end_time?: Date;
  treatment?: string;
  session_id?: string;
  doctor?: mongoose.Types.ObjectId | UserDocument;
  consultation?: mongoose.Types.ObjectId;
}

export interface AppointmentDocument extends Document, AppointmentAttrs {}

const periodontalSchema = new Schema<Periodontal>(
  {
    oral_hygiene: { type: String, required: true },
    calculus: { type: Boolean, default: false },
    recession: { type: Boolean, default: false },
    recession_detail: String,
    gingivitis: { type: Boolean, default: false },
    gingivitis_type: String,
    pocket: { type: Boolean, default: false },
    pocket_location: String,
    periodontitis: { type: Boolean, default: false },
    periodontitis_type: String,
    periodontosis: { type: Boolean, default: false },
    periodontosis_details: String,
  },
  { _id: false },
);

const teethAssessmentSchema = new Schema<TeethAssessment>(
  {
    present: String,
    caries: String,
    occlusion: { type: String, default: 'NORMAL' },
    provisional_diagnosis: String,
    investigations: String,
  },
  { _id: false },
);

const appointmentSchema = new Schema<AppointmentDocument>(
  {
    schedule_date: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.PENDING,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      index: true,
      required: true,
    },
    compplaints: String,
    relevant_history: String,
    extra_oral_exam: String,
    oral_muscosae: String,
    periodontia: periodontalSchema,
    teeth_assessment: teethAssessmentSchema,
    hub: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    latest_dental_visit: String,
    reason_for_visit: String,
    level_of_severity: Number,
    has_chronic_conditions: String,
    on_medications: String,
    notes: String,
    start_time: Date,
    end_time: Date,
    treatment: String,
    session_id: String,
    doctor: { type: Schema.Types.ObjectId, ref: 'User' },
    consultation: { type: Schema.Types.ObjectId, ref: 'Consultation' },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

export const AppointmentModel = mongoose.model<AppointmentDocument>(
  'Appointment',
  appointmentSchema,
);

