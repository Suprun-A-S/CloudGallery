// src/services/folder.service.ts
import {
  createFolder as createFolderModel,
  getFoldersByOwner as getFoldersModel,
  getFolderById as getFolderByIdModel,
  getFolderByName as getFolderByNameModel,
  deleteFolder as deleteFolderModel,
  updateFolderParent as updateFolderParentModel,
} from '../models/folder.model';
import { FolderModel } from '../types';

export async function createFolder(
  ownerId: string,
  name: string,
  parentId: string | null = null
) {
  if (name === 'Home')                      // защита от попытки создать вторую Home
    throw { status: 400, message: 'Name "Home" is reserved' };

  const dup = await getFolderByNameModel(ownerId, name, parentId);
  if (dup)
    throw { status: 409, message: 'Folder with this name already exists.' };

  return createFolderModel(ownerId, name, parentId);
}


export async function getFolders(
  ownerId: string
): Promise<FolderModel[]> {
  return getFoldersModel(ownerId);
}

export async function getFolderById(
  ownerId: string,
  folderId: string
): Promise<FolderModel> {
  const folder = await getFolderByIdModel(folderId, ownerId);
  if (!folder) throw { status: 404, message: 'Folder not found' };
  return folder;
}

export async function moveFolder(
  ownerId: string,
  folderId: string,
  newParentId: string | null
) {
  const folder = await getFolderByIdModel(folderId, ownerId);
  if (!folder) throw { status: 404, message: 'Folder not found' };

  if (folder.name === 'Home' && folder.parent_id === null) {
    throw { status: 400, message: 'Cannot move Home folder' };
  }

  const dup = await getFolderByNameModel(ownerId, folder.name, newParentId);
  if (dup) {
    throw { status: 409, message: 'Folder with the same name exists in target location' };
  }

  const updated = await updateFolderParentModel(folderId, newParentId);
  return updated;
}

export async function deleteFolderService(
  ownerId: string,
  folderId: string
): Promise<void> {
  const folder = await getFolderByIdModel(folderId, ownerId);
  if (!folder) throw { status: 404, message: 'Folder not found' };
  await deleteFolderModel(folderId);
}