import mongoose, { Schema, type Document } from 'mongoose';

export interface DoctorDiagnosis {
  chief_complaint?: string;
  primary_diagnosis?: string;
  duration_of_symptoms?: string;
  visual_examination_observation?: string;
  symptom_details?: string;
  notes_on_diagnosis?: string;
  palpation?: string;
}

export interface LineOfTreatment {
  treatment_plan?: string;
  medication_prescribed?: string;
  medication_usage?: string;
  follow_up_appointment?: string;
  patient_instructions?: string;
  extra_observation?: string;
}

export interface ConsultationAttrs {
  start_time?: Date;
  end_time?: Date;
  doctor_diagnosis?: DoctorDiagnosis;
  line_of_treatment?: LineOfTreatment;
  referral?: {
    hospital: string;
    condition: string;
  };
  files?: { id: string; url: string }[];
}

export interface ConsultationDocument extends Document, ConsultationAttrs {}

const doctorDiagnosisSchema = new Schema<DoctorDiagnosis>(
  {
    chief_complaint: String,
    primary_diagnosis: String,
    duration_of_symptoms: String,
    visual_examination_observation: String,
    symptom_details: String,
    notes_on_diagnosis: String,
    palpation: String,
  },
  { _id: false },
);

const lineOfTreatmentSchema = new Schema<LineOfTreatment>(
  {
    treatment_plan: String,
    medication_prescribed: String,
    medication_usage: String,
    follow_up_appointment: String,
    patient_instructions: String,
    extra_observation: String,
  },
  { _id: false },
);

const consultationSchema = new Schema<ConsultationDocument>(
  {
    start_time: Date,
    end_time: Date,
    doctor_diagnosis: doctorDiagnosisSchema,
    line_of_treatment: lineOfTreatmentSchema,
    referral: {
      hospital: String,
      condition: String,
    },
    files: {
      type: [
        {
          id: String,
          url: String,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

consultationSchema.virtual('duration').get(function (this: any) {
  return this.start_time && this.end_time
    ? this.end_time.getTime() - this.start_time.getTime()
    : 0;
});

export const ConsultationModel = mongoose.model<ConsultationDocument>(
  'Consultation',
  consultationSchema,
);

