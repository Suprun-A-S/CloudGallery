// src/controllers/image.controller.ts
import { Request, Response, NextFunction } from 'express';
import {
  uploadImage as uploadImageService,
  getAllImagesByOwner as getAllImagesService,
  getImagesByFolder as getImagesByFolderService,
  getImageById as getImageService,
  deleteImage as deleteImageService,
  rotateImage as rotateImageService,
  updateImageMetadata as updateMetadataService,
  moveImageToFolder as moveImageToFolderService,
} from '../services/image.service';

export const uploadMultipleImagesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || !files.length) {
      return res.status(400).json({ error: 'No files provided under field "file"' });
    }

    const ownerId = req.user!.id;
    const folderId = req.body.folderId || null;
    const created: any[] = [];

    for (const file of files) {
      const rawName = file.originalname;
      const originalName = Buffer.from(rawName, 'latin1').toString('utf8');

      const img = await uploadImageService(
        ownerId,
        file.path,
        folderId,
        originalName,   
        file.mimetype,
        file.size
      );
      created.push(img);
    }

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

export const getAllImagesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.user!.id;
    const images = await getAllImagesService(ownerId);
    res.json(images);
  } catch (err) {
    next(err);
  }
};

export const getImagesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.user!.id;
    const folderId = typeof req.query.folderId === 'string'
      ? req.query.folderId
      : null;

    const images = await getImagesByFolderService(ownerId, folderId);
    res.json(images);
  } catch (err) {
    next(err);
  }
};

export const getImageHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;
    const img = await getImageService(ownerId, id);
    res.json(img);
  } catch (err) {
    next(err);
  }
};

export const listImagesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.user!.id;
    const folderId = req.query.folderId === 'ALL'
      ? null
      : (req.query.folderId as string | undefined) || null;
    let images;
    if (req.query.folderId === 'ALL') {
      images = await getAllImagesService(ownerId);
    } else {
      images = await getImagesByFolderService(ownerId, folderId);
    }
    res.json(images);
  } catch (err) {
    next(err);
  }
};

export const downloadImageHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;
    const image = await getImageService(ownerId, id);
    res.redirect(image.url);
  } catch (err) {
    next(err);
  }
};

export const rotateImageHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;
    const { direction } = req.query as { direction: 'left' | 'right' };
    const updated = await rotateImageService(ownerId, id, direction);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const updateMetadataHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags
        .split(/[ ,]+/) 
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);
    } else if (!Array.isArray(req.body.tags)) {
      delete req.body.tags;
    }

    const updated = await updateMetadataService(id, {
      author: req.body.author,
      title: req.body.title,
      subject: req.body.subject,
      theme: req.body.theme,
      description: req.body.description,
      tags: req.body.tags,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const moveImageToFolderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;
    const { folderId } = req.body;
    await moveImageToFolderService(ownerId, id, folderId || null);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

export const deleteImageHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;
    await deleteImageService(ownerId, id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};
