import mongoose, { type FilterQuery } from 'mongoose';
import { UserModel, type UserDocument } from '../models/user.model';
import {
  AppointmentModel,
  type AppointmentDocument,
} from '../models/appointment.model';
import { InviteModel, type InviteDocument } from '../models/invite.model';

export async function fetchUsers(query: any) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);

  const filter: any = {
    role: { $ne: 'ADMIN' },
  };

  if (query.role) {
    filter.role = query.role;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search, 'gi');
    filter.$or = [
      { first_name: searchRegex },
      { last_name: searchRegex },
      { hub_name: searchRegex },
    ];
  }

  const [docs, totalCount] = await Promise.all([
    UserModel.find(filter as FilterQuery<UserDocument>)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    UserModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    docs,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  };
}

export async function fetchAppointments(query: any) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);

  const filter: any = {};

  if (query.search) {
    const searchRegex = new RegExp(query.search, 'gi');
    filter.$or = [{ 'patient.full_name': searchRegex }];
  }
  if (query.doctor) filter.doctor = new mongoose.Types.ObjectId(String(query.doctor));
  if (query.hub) filter.hub = new mongoose.Types.ObjectId(String(query.hub));
  if (query.patient) filter.patient = new mongoose.Types.ObjectId(String(query.patient));

  const [docs, totalCount] = await Promise.all([
    AppointmentModel.find(filter as FilterQuery<AppointmentDocument>)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('patient')
      .populate('hub')
      .populate('doctor')
      .lean(),
    AppointmentModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    docs,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  };
}

export async function findInviteByEmail(email: string) {
  return InviteModel.findOne({ email } as FilterQuery<InviteDocument>).lean();
}

export async function createInvite(payload: { email: string; role?: string }) {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  const doc = await InviteModel.create({
    email: payload.email,
    role: payload.role,
    expires_at: expires,
  });
  return doc.toObject();
}

export async function deleteInvite(id: string) {
  return InviteModel.findOneAndDelete({
    _id: id,
  } as FilterQuery<InviteDocument>).lean();
}

export async function findInvite(id: string) {
  return InviteModel.findById(id).lean();
}

export async function findInvites(query: any) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);

  const filter: any = {};
  if (query.search) {
    const searchRegex = new RegExp(query.search, 'gi');
    filter.$or = [{ email: searchRegex }];
  }

  const [docs, totalCount] = await Promise.all([
    InviteModel.find(filter as FilterQuery<InviteDocument>)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    InviteModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    docs,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  };
}

