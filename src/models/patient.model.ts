import mongoose, { Schema, type Document } from 'mongoose';

export interface MedicalHistory {
  chronic_conditions?: string;
  allergies?: string;
  previous_surgeries?: string;
  current_medications?: string;
  history_of_smoking?: string;
  history_of_alcoholic?: string;
}

export interface PatientAttrs {
  patient_id?: number;
  full_name: string;
  email: string;
  date_of_birth?: Date;
  phone_number: string;
  address?: string;
  city?: string;
  state?: string;
  gender?: string;
  occupation?: string;
  status?: string;
  hub: mongoose.Types.ObjectId;
  last_visit?: Date;
  medical_history?: MedicalHistory;
  deleted_at?: Date | null;
}

export interface PatientDocument extends Document, PatientAttrs {}

const medicalHistorySchema = new Schema<MedicalHistory>(
  {
    chronic_conditions: String,
    allergies: String,
    previous_surgeries: String,
    current_medications: String,
    history_of_smoking: String,
    history_of_alcoholic: String,
  },
  { _id: false },
);

const patientSchema = new Schema<PatientDocument>(
  {
    patient_id: { type: Number, index: true, unique: true, immutable: true },
    full_name: { type: String, index: true, trim: true, required: true },
    email: {
      type: String,
      index: true,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    date_of_birth: { type: Date },
    phone_number: { type: String, required: true },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    gender: { type: String },
    occupation: { type: String },
    status: { type: String, default: 'ACTIVE' },
    hub: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    last_visit: { type: Date, index: true },
    medical_history: { type: medicalHistorySchema },
    deleted_at: { type: Date },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

patientSchema.index({ full_name: 'text', email: 'text' });

patientSchema.virtual('age').get(function (this: any) {
  if (!this.date_of_birth) return null;
  return Math.floor((Date.now() - this.date_of_birth.getTime()) / 31557600000);
});

patientSchema.pre('save', async function (next) {
  const patientModel: mongoose.Model<PatientDocument> = this
    .constructor as mongoose.Model<PatientDocument>;

  const highestPatientId = await patientModel.findOne().sort({ patient_id: -1 });

  (this as any).patient_id = highestPatientId ? Number(highestPatientId.patient_id) + 1 : 1;

  next();
});

export const PatientModel = mongoose.model<PatientDocument>('Patient', patientSchema);

