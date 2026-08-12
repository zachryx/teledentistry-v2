import mongoose, { type FilterQuery } from 'mongoose';
import {
  CallModel,
  type CallDocument,
  type CallAttrs,
  CALL_STATUS,
} from '../models/call.model';
import { AppointmentModel } from '../models/appointment.model';
import { PatientModel } from '../models/patient.model';

export async function createCall(metadata: CallAttrs) {
  const doc = await CallModel.create({
    ...metadata,
    room_id: metadata.room_id ?? crypto.randomUUID(),
    status: CALL_STATUS.INITIATED,
  });
  return doc.toObject();
}

export async function findCallById(id: string) {
  return CallModel.findById(id).lean();
}

export async function findActiveByAppointment(appointmentId: string) {
  return CallModel.findOne({
    appointment: new mongoose.Types.ObjectId(appointmentId),
    status: { $in: [CALL_STATUS.INITIATED, CALL_STATUS.CONNECTED] },
  } as FilterQuery<CallDocument>).lean();
}

export async function updateCall(query: any, payload: any, options?: any) {
  return CallModel.findOneAndUpdate(query, payload, { new: true, ...options }).lean();
}

export async function joinCall(
  callId: string,
  peerId: string,
  user: { id: string; role: string },
) {
  const call = await CallModel.findById(callId).lean();
  if (!call) return null;

  const actor = `${user.role.toLowerCase()}_peer_id`;

  const updatedCall = await CallModel.findOneAndUpdate(
    { _id: call._id } as FilterQuery<CallDocument>,
    {
      [actor]: peerId,
      $addToSet: { participants: new mongoose.Types.ObjectId(String(user.id)) },
    },
    { new: true },
  ).lean();

  const appointment = await AppointmentModel.findById(call.appointment).lean();
  if (appointment) {
    await AppointmentModel.updateOne(
      { _id: appointment._id } as FilterQuery<any>,
      { status: 'in_progress' },
    );

    if (user.role === 'HUB') {
      await PatientModel.updateOne(
        { _id: appointment.patient } as FilterQuery<any>,
        { last_visit: new Date() },
      );
    }
  }

  return updatedCall;
}

