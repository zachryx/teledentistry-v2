import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

interface UploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

const s3 = new S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function uploadFileToS3(file: UploadFile): Promise<string> {
  const bucket = process.env.AWS_BUCKET_NAME;
  if (!bucket) {
    throw new Error('AWS_BUCKET_NAME not configured');
  }

  const key = `${uuidv4()}-${file.originalname}`;

  const result = await s3
    .upload({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
    .promise();

  return result.Location;
}

export async function deleteFileFromS3(fileLocation: string): Promise<void> {
  const bucket = process.env.AWS_BUCKET_NAME;
  if (!bucket) {
    throw new Error('AWS_BUCKET_NAME not configured');
  }

  const bucketUrl = `https://${bucket}.s3.amazonaws.com/`;
  if (!fileLocation.startsWith(bucketUrl)) {
    throw new Error('Invalid file location URL.');
  }
  const key = fileLocation.replace(bucketUrl, '');

  await s3
    .deleteObject({
      Bucket: bucket,
      Key: key,
    })
    .promise();
}

