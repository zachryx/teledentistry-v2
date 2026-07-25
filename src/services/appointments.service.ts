import mongoose, { type FilterQuery, type UpdateQuery } from 'mongoose';
import {
  AppointmentModel,
  type AppointmentDocument,
  type AppointmentAttrs,
  APPOINTMENT_STATUS,
} from '../models/appointment.model';
import { ConsultationModel } from '../models/consultation.model';

export async function createAppointment(
  payload: Omit<AppointmentAttrs, 'hub' | 'patient'> & {
    hub: string;
    patient: string;
  },
): Promise<AppointmentDocument> {
  const doc = await AppointmentModel.create({
    ...payload,
    hub: new mongoose.Types.ObjectId(String(payload.hub)),
    patient: new mongoose.Types.ObjectId(String(payload.patient)),
  });
  return doc.toObject() as any;
}

export async function hasSimilarAppointment(
  patientId: string,
  scheduleDate: Date,
): Promise<boolean> {
  const startDate = new Date(scheduleDate);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(scheduleDate);
  endDate.setHours(23, 59, 59, 999);

  const existingAppointment = await AppointmentModel.findOne({
    patient: new mongoose.Types.ObjectId(patientId),
    schedule_date: {
      $gte: startDate,
      $lte: endDate,
    },
  });

  return !!existingAppointment;
}

export async function addAppointmentToQueue(
  id: string,
  hubId: string,
  payload: { doctor: string } & Partial<AppointmentAttrs>,
) {
  const consultation = await ConsultationModel.create({});

  const updated = await AppointmentModel.findOneAndUpdate(
    {
      _id: id,
      hub: hubId,
    } as FilterQuery<AppointmentDocument>,
    {
      ...payload,
      doctor: new mongoose.Types.ObjectId(payload.doctor),
      status: APPOINTMENT_STATUS.QUEUE,
      consultation: consultation._id,
    } as UpdateQuery<AppointmentDocument>,
    { new: true },
  )
    .populate('patient')
    .populate('hub')
    .populate('doctor')
    .lean();

  return updated;
}

export async function findDoctorAppointments(doctorId: string, query: any) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const { sort = '-created_at', status } = query;

  const filter: any = { doctor: doctorId };
  if (status) filter.status = status;

  const [docs, totalCount] = await Promise.all([
    AppointmentModel.find(filter)
      .sort(sort)
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

export async function findHubAppointments(hubId: string, query: any) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const { sort = '-created_at', status, search } = query;

  const filter: any = {};
  if (hubId) filter.hub = hubId;
  if (query.doctor) filter.doctor = query.doctor;
  if (query.patient) filter.patient = query.patient;
  if (status) filter.status = status;
  if (search) {
    const regex = new RegExp(String(search), 'gi');
    filter.$or = [{ 'patient.full_name': regex }];
  }

  const [docs, totalCount] = await Promise.all([
    AppointmentModel.find(filter)
      .sort(sort)
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

export async function findAppointmentById(
  id: string,
): Promise<AppointmentDocument | null> {
  return AppointmentModel.findById(id)
    .populate('patient')
    .populate('hub')
    .populate('doctor')
    .lean() as any;
}

export async function deleteAppointment(id: string, hubId: string) {
  return AppointmentModel.findOneAndDelete({
    _id: id,
    hub: hubId,
  } as FilterQuery<AppointmentDocument>).lean();
}

export async function updateAppointmentForHub(
  id: string,
  hubId: string,
  body: Partial<AppointmentAttrs>,
) {
  return AppointmentModel.findOneAndUpdate(
    { _id: id, hub: hubId } as FilterQuery<AppointmentDocument>,
    body as UpdateQuery<AppointmentDocument>,
    { new: true },
  )
    .populate('patient')
    .populate('hub')
    .populate('doctor')
    .lean();
}

export async function isUserAffiliatedWithAppointment(
  userId: string,
  appointmentId: string,
) {
  return AppointmentModel.findOne({
    _id: appointmentId,
    $or: [{ hub: userId }, { doctor: userId }],
    status: { $in: [APPOINTMENT_STATUS.QUEUE, APPOINTMENT_STATUS.IN_PROGRESS] },
  }).lean();
}

export async function submitConsultation(
  consultationId: string,
  payload: any,
) {
  return ConsultationModel.findOneAndUpdate(
    { _id: consultationId },
    payload,
    { new: true },
  ).lean();
}

export async function updateAppointment(
  id: string,
  body: UpdateQuery<AppointmentDocument>,
) {
  return AppointmentModel.findOneAndUpdate(
    { _id: id } as FilterQuery<AppointmentDocument>,
    body,
    { new: true },
  ).lean();
}

