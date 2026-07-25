import jwt from 'jsonwebtoken';
import { findByEmail, createUser, findById, updateProfile } from './users.service';
import { sendPasswordResetEmail } from './mailer.service';
import type { AuthUserPayload } from '../guards/auth';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export async function registerUser(body: any) {
  const existing = await findByEmail(body.email);
  if (existing) {
    throw new Error('user already registered');
  }
  return createUser(body);
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ user: any; tokens: Tokens }> {
  const user = await findByEmail(email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (!user.is_approved) {
    throw new Error('User awaiting approval');
  }

  // Password is already hashed; compare via bcrypt through users.service if needed.
  // For simplicity, assume bcrypt was used when creating users; compare here:
  const bcrypt = await import('bcrypt');
  const match = await bcrypt.compare(password, String(user.password));
  if (!match) {
    throw new Error('incorrect password');
  }

  const tokens = generateTokens({
    email: user.email,
    id: String(user._id),
    role: user.role,
  });

  return { user, tokens };
}

export function generateTokens(payload: AuthUserPayload): Tokens {
  const accessSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
    throw new Error('JWT secrets not configured');
  }

  const accessToken = jwt.sign(payload, accessSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: '7d' });

  return { accessToken, refreshToken };
}

export async function forwardPasswordResetMail(email: string) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET not configured');

  const token = jwt.sign({ email }, jwtSecret, { expiresIn: '15m' });
  const appUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const link = `${appUrl}/reset-password/${token}`;

  await sendPasswordResetEmail(email, link);
}

export async function resetPassword(token: string, password: string) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET not configured');

  const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload & { email: string };
  const user = await findByEmail(decoded.email);
  if (!user) throw new Error('User not found');

  await updateProfile(String(user._id), { password } as any);
}

export async function refreshAccessToken(token: string): Promise<Tokens> {
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET not configured');
  }

  const decoded = jwt.verify(token, refreshSecret) as jwt.JwtPayload & AuthUserPayload;
  const user = await findById(decoded.id);
  if (!user) {
    throw new Error('user not found');
  }

  return generateTokens({
    email: user.email,
    id: String(user._id),
    role: user.role,
  });
}

