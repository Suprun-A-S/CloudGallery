// src/services/image.service.ts
import { ImageModel } from '../types';
import {
  createImage as createImageModel,
  getAllImagesByOwner as getAllImagesByOwnerModel,
  getImagesByFolder as getImagesByFolderModel,
  getImageById as getImageByIdModel,
  updateImageFolder as updateImageFolderModel,
  updateImageMetadata as updateImageMetadataModel,
  updateImageUrl as updateImageUrlModel,
  deleteImage as deleteImageModel
} from '../models/image.model';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';
import { v2 as cloudinary } from 'cloudinary';

export async function uploadImage(
  ownerId: string,
  filePath: string,
  folderId: string | null,
  originalName: string,
  mimeType: string,
  sizeBytes: number
) {
  let folderName = 'Home';
  if (folderId) {
    const folder = await getFolderById(ownerId, folderId);
    if (folder) folderName = folder.name;
  }
  const result = await uploadToCloudinary(filePath, folderName);
  return createImageModel(
    ownerId,
    folderId,
    result.public_id,
    result.secure_url,
    originalName,
    mimeType,
    sizeBytes
  );
}

export async function getAllImagesByOwner(
  ownerId: string
): Promise<ImageModel[]> {
  return getAllImagesByOwnerModel(ownerId);
}

export async function getImagesByFolder(
  ownerId: string,
  folderId: string | null
) {
  return getImagesByFolderModel(ownerId, folderId);
}

export async function getImageById(
  ownerId: string,
  imageId: string
): Promise<ImageModel> {
  const img = await getImageByIdModel(imageId, ownerId);
  if (!img) throw { status: 404, message: 'Image not found' };
  return img;
}

export async function rotateImage(
  ownerId: string,
  imageId: string,
  direction: 'left' | 'right'
): Promise<ImageModel> {
  const img = await getImageByIdModel(imageId, ownerId);
  if (!img) throw { status: 404, message: 'Image not found' };

  const angle = direction === 'left' ? 90 : -90;

  const result = await cloudinary.uploader.upload(
    img.url,
    {
      public_id: img.public_id,
      overwrite: true,
      transformation: [{ angle }]
    }
  );

  const updated = await updateImageUrlModel(imageId, result.secure_url);
  return updated;
}


export async function updateImageMetadata(
  imageId: string,
  data: Partial<Pick<ImageModel, 'author' | 'title' | 'subject' | 'theme' | 'description' | 'tags'>>
): Promise<ImageModel> {
  return updateImageMetadataModel(imageId, data);
}

export async function moveImageToFolder(
  ownerId: string,
  imageId: string,
  folderId: string | null
): Promise<void> {
  const img = await getImageByIdModel(imageId, ownerId);
  if (!img) throw { status: 404, message: 'Image not found' };
  await updateImageFolderModel(imageId, folderId);
}

export async function deleteImage(
  ownerId: string,
  imageId: string
): Promise<void> {
  const img = await getImageByIdModel(imageId, ownerId);
  if (!img) throw { status: 404, message: 'Image not found' };

  await deleteFromCloudinary(img.public_id);
  await deleteImageModel(imageId);
}
async function getFolderById(ownerId: string, folderId: string): Promise<{ name: string } | null> {
  return { name: 'ExampleFolder' };
}

