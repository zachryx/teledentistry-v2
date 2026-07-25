import mongoose from 'mongoose';

export async function connectMongo(): Promise<typeof mongoose> {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not set');
  }

  return mongoose.connect(uri);
}

