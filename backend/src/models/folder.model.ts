// src/models/folder.model.ts
import { db } from '../config/db';
import { FolderModel } from '../types';

export const createFolder = async (
  ownerId: string,
  name: string,
  parentId: string | null = null
): Promise<FolderModel> => {
  const result = await db.query<FolderModel>(
    `INSERT INTO folders (owner_id, parent_id, name) VALUES ($1, $2, $3) RETURNING *`,
    [ownerId, parentId, name]
  );
  return result.rows[0];
};

export const getFoldersByOwner = async (
  ownerId: string
): Promise<FolderModel[]> => {
  const result = await db.query<FolderModel>(
    `SELECT * FROM folders WHERE owner_id = $1 ORDER BY created_at DESC`,
    [ownerId]
  );
  return result.rows;
};

export const getFolderById = async (
  id: string,
  ownerId: string
): Promise<FolderModel | null> => {
  const result = await db.query<FolderModel>(
    `SELECT * FROM folders WHERE id = $1 AND owner_id = $2`,
    [id, ownerId]
  );
  return result.rows[0] || null;
};

export const getFolderByName = async (
  ownerId: string,
  name: string,
  parentId: string | null
): Promise<FolderModel | null> => {
  const result = await db.query<FolderModel>(
    `SELECT * FROM folders
      WHERE owner_id = $1 AND name = $2
        AND parent_id ${parentId ? '= $3' : 'IS NULL'}
      LIMIT 1`,
    parentId ? [ownerId, name, parentId] : [ownerId, name]
  );
  return result.rows[0] || null;
};

export const updateFolderParent = async (
  folderId: string,
  newParentId: string | null
): Promise<FolderModel> => {
  const result = await db.query<FolderModel>(
    `UPDATE folders
        SET parent_id = $1
      WHERE id = $2
      RETURNING *`,
    [newParentId, folderId]
  );
  return result.rows[0];
};

export const deleteFolder = async (
  folderId: string
): Promise<void> => {
  await db.query(
    `DELETE FROM folders WHERE id = $1`,
    [folderId]
  );
};

