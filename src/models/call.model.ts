import mongoose, { Schema, type Document } from 'mongoose';

export const CALL_STATUS = {
  INITIATED: 'initiated',
  CONNECTED: 'connected',
  ENDED: 'ended',
  REJECTED: 'rejected',
  FAILED: 'failed',
} as const;

export interface CallAttrs {
  appointment: mongoose.Types.ObjectId;
  host: string;
  participants?: mongoose.Types.ObjectId[];
  doctor_peer_id?: string;
  hub_peer_id?: string;
  room_id?: string;
  start_time?: Date;
  end_time?: Date;
  call_duration?: number;
  status?: string;
}

export interface CallDocument extends Document, CallAttrs {}

const callSchema = new Schema<CallDocument>(
  {
    appointment: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    host: { type: String, required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    doctor_peer_id: String,
    hub_peer_id: String,
    room_id: String,
    start_time: Date,
    end_time: Date,
    call_duration: Number,
    status: {
      type: String,
      enum: Object.values(CALL_STATUS),
      default: CALL_STATUS.INITIATED,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

export const CallModel = mongoose.model<CallDocument>('Call', callSchema);

