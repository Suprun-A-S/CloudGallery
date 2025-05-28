// src/routes/image.routes.ts
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getAllImagesHandler,          
  listImagesHandler,            
  getImageHandler,
  uploadMultipleImagesHandler,  
  downloadImageHandler,         
  rotateImageHandler,           
  updateMetadataHandler,        
  moveImageToFolderHandler,     
  deleteImageHandler            
} from '../controllers/image.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } 
});

router.use(authMiddleware);

router.get('/all', getAllImagesHandler);

router.get('/', listImagesHandler);

router.get('/:id', getImageHandler);

router.post(
  '/',
  upload.array('file'),
  async (req, res, next) => {
    try {
      await uploadMultipleImagesHandler(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id/download', downloadImageHandler);

router.post('/:id/rotate', rotateImageHandler);

router.patch('/:id/folder', moveImageToFolderHandler);

router.patch('/:id', updateMetadataHandler);

router.delete('/:id', deleteImageHandler);

export default router;
