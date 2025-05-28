// src/models/image.model.ts
import { db } from '../config/db';
import { ImageModel } from '../types';

enum ImageFields {
  URL = 'url',
}

export const createImage = async (
  ownerId: string,
  folderId: string | null,
  publicId: string,
  url: string,
  originalName: string,
  mimeType: string,
  sizeBytes: number
): Promise<ImageModel> => {
  const result = await db.query<ImageModel>(
    `INSERT INTO images
       (owner_id, folder_id, public_id, url, original_name, mime_type, size_bytes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
    [ownerId, folderId, publicId, url, originalName, mimeType, sizeBytes]
  );
  return result.rows[0];
};

export const getImageById = async (
  id: string,
  ownerId: string
): Promise<ImageModel | null> => {
  const result = await db.query<ImageModel>(
    `SELECT * FROM images WHERE id = $1 AND owner_id = $2`,
    [id, ownerId]
  );
  return result.rows[0] || null;
};

export const getAllImagesByOwner = async (
  ownerId: string
): Promise<ImageModel[]> => {
  const result = await db.query<ImageModel>(
    `SELECT * FROM images WHERE owner_id = $1 ORDER BY created_at DESC`,
    [ownerId]
  );
  return result.rows;
};

export const getImagesByFolder = async (
  ownerId: string,
  folderId: string | null
): Promise<ImageModel[]> => {
  const result = await db.query<ImageModel>(
    `SELECT * FROM images
       WHERE owner_id = $1 AND folder_id ${
      folderId ? '= $2' : 'IS NULL'
    }
     ORDER BY created_at DESC`,
    folderId ? [ownerId, folderId] : [ownerId]
  );
  return result.rows;
};

export const updateImageFolder = async (
  imageId: string,
  folderId: string | null
): Promise<void> => {
  await db.query(
    `UPDATE images SET folder_id = $1, updated_at = NOW() WHERE id = $2`,
    [folderId, imageId]
  );
};

export const updateImageMetadata = async (
  imageId: string,
  data: Partial<Pick<ImageModel, 'author' | 'title' | 'subject' | 'theme' | 'description' | 'tags'>>
): Promise<ImageModel> => {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.author !== undefined) {
    fields.push(`author = $${idx}`);
    values.push(data.author);
    idx++;
  }
  if (data.title !== undefined) {
    fields.push(`title = $${idx}`);
    values.push(data.title);
    idx++;
  }
  if (data.subject !== undefined) {
    fields.push(`subject = $${idx}`);
    values.push(data.subject);
    idx++;
  }
  if (data.theme !== undefined) {
    fields.push(`theme = $${idx}`);
    values.push(data.theme);
    idx++;
  }
  if (data.description !== undefined) {
    fields.push(`description = $${idx}`);
    values.push(data.description);
    idx++;
  }
  if (data.tags !== undefined) {
    fields.push(`tags = $${idx}`);
    values.push(data.tags);
    idx++;
  }

  if (fields.length === 0) {
    throw new Error('No metadata fields to update');
  }

  const setClause = fields.join(', ');
  const result = await db.query<ImageModel>(
    `UPDATE images
        SET ${setClause},
            updated_at = NOW()
      WHERE id = $${idx}
    RETURNING *`,
    [...values, imageId]
  );

  return result.rows[0];
};

export const updateImageUrl = async (
  imageId: string,
  newUrl: string
): Promise<ImageModel> => {
  const result = await db.query<ImageModel>(
    `UPDATE images SET url = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [newUrl, imageId]
  );
  return result.rows[0];
};

export const deleteImage = async (
  imageId: string
): Promise<void> => {
  await db.query(
    `DELETE FROM images WHERE id = $1`,
    [imageId]
  );
};
