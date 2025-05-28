// src/routes/folder.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  createFolderHandler,
  getFoldersHandler,
  getFolderByIdHandler,
  moveFolderHandler,    
  deleteFolderHandler,
} from '../controllers/folder.controller';
import { validate } from '../utils/validators';
import { folderSchema } from '../utils/validators';

const router = Router();

router.post(
  '/',
  authMiddleware,
  validate(folderSchema),
  createFolderHandler
);

router.get('/', authMiddleware, getFoldersHandler);

router.get('/:id', authMiddleware, getFolderByIdHandler);

router.patch('/:id/parent', authMiddleware, moveFolderHandler);

router.delete('/:id', authMiddleware, deleteFolderHandler);

export default router;
