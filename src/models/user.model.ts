import mongoose, { Schema } from "mongoose";

export interface UserAttrs {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  city?: string;
  role: string;
  status?: string;
  is_approved?: boolean;
  approved_at?: Date;
  is_verified?: boolean;
  verified_at?: Date;
  gender?: string;
  date_of_birth?: Date;
  mobile_number?: string;
  centre_id?: number;
  hub_name?: string;
  hub_address?: string;
  is_online?: boolean;
  last_seen?: Date;
  current_session_id?: string | null;
}

export interface UserDocument extends mongoose.Document, UserAttrs {}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, index: true, unique: true, required: true },
    password: { type: String, required: true },
    first_name: { type: String, required: false, index: true, trim: true },
    last_name: { type: String, required: false, index: true, trim: true },
    address: { type: String },
    city: { type: String },
    role: { type: String, required: true },
    status: { type: String, default: "ACTIVE" },
    is_approved: { type: Boolean, default: false },
    approved_at: { type: Date },
    is_verified: { type: Boolean, default: false },
    verified_at: { type: Date },
    gender: { type: String },
    date_of_birth: { type: Date },
    mobile_number: { type: String },
    centre_id: { type: Number, required: false, index: true },
    hub_name: { type: String, required: false, index: true, trim: true },
    hub_address: { type: String, required: false, index: true, trim: true },
    is_online: { type: Boolean, default: false },
    last_seen: { type: Date },
    current_session_id: { type: String },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

export const UserModel = mongoose.model<UserDocument>("User", userSchema);
