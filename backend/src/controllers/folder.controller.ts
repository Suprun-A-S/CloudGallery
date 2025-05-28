// src/controllers/folder.controller.ts
import { Request, Response, NextFunction } from 'express';
import {
  createFolder,
  getFolders,
  getFolderById,
  moveFolder,
  deleteFolderService
} from '../services/folder.service';

export const createFolderHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerId = req.user!.id;
    const { name, parentId } = req.body;
    const folder = await createFolder(ownerId, name, parentId ?? null);
    res.status(201).json(folder);
  } catch (err) {
    next(err);
  }
};

export const getFoldersHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerId = req.user!.id;
    const folders = await getFolders(ownerId);
    res.json(folders);
  } catch (err) {
    next(err);
  }
};

export const getFolderByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;
    const folder = await getFolderById(ownerId, id);
    res.json(folder);
  } catch (err) {
    next(err);
  }
};

export const moveFolderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;
    // parentId может быть строкой UUID или null
    const { parentId } = req.body;
    const updatedFolder = await moveFolder(ownerId, id, parentId ?? null);
    res.json(updatedFolder);
  } catch (err) {
    next(err);
  }
};

export const deleteFolderHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;
    await deleteFolderService(ownerId, id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};