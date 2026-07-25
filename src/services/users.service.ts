import { FilterQuery, UpdateQuery } from 'mongoose';
import { UserModel, type UserDocument, type UserAttrs } from '../models/user.model';
import bcrypt from 'bcrypt';

export interface FetchUsersQuery {
  search?: string;
  [key: string]: any;
}

export async function getUsers(query: any): Promise<UserDocument[]> {
  const searchQuery: FetchUsersQuery = { ...query };

  if (searchQuery.search) {
    const searchRegex = new RegExp(searchQuery.search as string, 'gi');

    (searchQuery as any).$or = [
      { first_name: searchRegex },
      { last_name: searchRegex },
      { hub_name: searchRegex },
    ];

    delete searchQuery.search;
  }

  return UserModel.find(searchQuery as FilterQuery<UserDocument>).lean() as any;
}

export async function findByEmail(email: string): Promise<UserDocument | null> {
  return UserModel.findOne({ email } as FilterQuery<UserDocument>).lean() as any;
}

export async function findById(id: string): Promise<UserDocument | null> {
  return UserModel.findById(id).lean() as any;
}

export async function createUser(attrs: UserAttrs): Promise<UserDocument> {
  const hashedPassword = await bcrypt.hash(String(attrs.password), 10);
  const doc = await UserModel.create({
    ...attrs,
    password: hashedPassword,
  });
  return doc.toObject() as any;
}

export async function approveUser(id: string): Promise<UserDocument | null> {
  const updated = await UserModel.findOneAndUpdate(
    { _id: id } as FilterQuery<UserDocument>,
    { approved_at: new Date(), is_approved: true } as UpdateQuery<UserDocument>,
    { new: true },
  ).lean();

  return updated as any;
}

export async function updateProfile(
  userId: string,
  payload: UpdateQuery<UserDocument>,
): Promise<UserDocument | null> {
  const updatedPayload: any = { ...payload };

  if (payload.password) {
    updatedPayload.password = await bcrypt.hash(String(payload.password), 10);
  }

  const updated = await UserModel.findOneAndUpdate(
    { _id: userId } as FilterQuery<UserDocument>,
    updatedPayload,
    { new: true },
  ).lean();

  return updated as any;
}

export async function handleUserConnection(userId: string, sessionId: string) {
  await UserModel.findOneAndUpdate(
    { _id: userId } as FilterQuery<UserDocument>,
    {
      current_session_id: sessionId,
      is_online: true,
    } as UpdateQuery<UserDocument>,
  );
}

export async function handleUserDisconnection(userId: string) {
  await UserModel.findOneAndUpdate(
    { _id: userId } as FilterQuery<UserDocument>,
    {
      is_online: false,
      last_seen: new Date(),
      current_session_id: null,
    } as UpdateQuery<UserDocument>,
  );
}

