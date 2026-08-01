import type { FilterQuery } from 'mongoose';
import {
  PatientModel,
  type PatientAttrs,
  type PatientDocument,
} from '../models/patient.model';

export async function findByEmail(email: string): Promise<PatientDocument | null> {
  return PatientModel.findOne({ email } as FilterQuery<PatientDocument>).lean() as any;
}

export async function createPatient(
  attrs: Omit<PatientAttrs, 'patient_id'>,
): Promise<PatientDocument> {
  const doc = await PatientModel.create(attrs);
  return doc.toObject() as any;
}

export async function findHubPatients(
  hubId: string,
  query: any,
): Promise<{ patients: PatientDocument[]; total: number; page: number; limit: number }> {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const { search } = query;
  const filter: any = { hub: hubId };

  if (search) {
    const regex = new RegExp(String(search), 'gi');
    filter.$or = [{ full_name: regex }, { email: regex }];
  }

  const [patients, total] = await Promise.all([
    PatientModel.find(filter as FilterQuery<PatientDocument>)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as any,
    PatientModel.countDocuments(filter as FilterQuery<PatientDocument>),
  ]);

  return { patients, total, page, limit };
}

export async function findById(id: string): Promise<PatientDocument | null> {
  return PatientModel.findById(id).lean() as any;
}

export async function updatePatient(
  filter: FilterQuery<PatientDocument>,
  update: Partial<PatientAttrs>,
): Promise<PatientDocument | null> {
  return PatientModel.findOneAndUpdate(filter, update, {
    new: true,
  }).lean() as any;
}

