// src/middlewares/multer.middleware.ts
import multer from 'multer';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'uploads');
export const multerUpload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});