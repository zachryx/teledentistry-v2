import { Elysia } from 'elysia';
import { authGuard } from '../guards/auth';
import { deleteFileFromS3, uploadFileToS3 } from '../services/aws-s3.service';
import { HttpError } from '../guards/http-error';
import { successResponse, deleteAwsFileBody } from '../swagger-schemas';

export const miscRoutes = (app: Elysia) =>
  app.group('/api/v1/misc', (app) =>
    app.use(authGuard)
      .post('/aws/upload', async ({ request }) => {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) throw new HttpError(400, 'No file uploaded');
        if (file.size > 10 * 1024 * 1024) throw new HttpError(400, 'File too large (max 10MB)');
        const buffer = Buffer.from(await file.arrayBuffer());
        const multerFile = {
          buffer,
          originalname: file.name,
          mimetype: file.type,
          size: file.size,
          fieldname: 'file',
          encoding: '7bit',
          destination: '',
          filename: file.name,
          path: '',
        } as any;
        return uploadFileToS3(multerFile).then((fileUrl) => ({
          success: true,
          message: 'File uploaded successfully',
          data: { fileUrl },
        }));
      }, { response: successResponse })
      .delete('/aws/delete', ({ body }) => {
        const { fileLocation } = body as { fileLocation?: string };
        if (!fileLocation) throw new HttpError(400, 'File location is required');
        return deleteFileFromS3(fileLocation).then(() => ({
          success: true,
          message: 'File deleted successfully',
        }));
      }, { body: deleteAwsFileBody, response: successResponse }),
  );
