import bcrypt from 'bcrypt';
import { UserModel } from './models/user.model';

export async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await UserModel.findOne({ email });
  if (existing) return;

  const hashed = await bcrypt.hash(password, 10);
  await UserModel.create({
    email,
    password: hashed,
    role: 'ADMIN',
    is_approved: true,
  });
}
