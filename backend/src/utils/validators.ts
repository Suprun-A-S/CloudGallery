// src/utils/validators.ts
import { z } from 'zod';

export const emailSchema = z
  .string()
  .max(128, { message: 'Email must be at most 128 characters.' })
  .email({ message: 'Invalid email format.' });

export const passwordSchema = z
  .string()
  .min(4, { message: 'Password must be at least 4 characters.' })
  .max(64, { message: 'Password must be at most 64 characters.' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' });

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match.',
    path: ['passwordConfirm'],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const nameSchema = z
  .string()
  .min(1, { message: 'Name is required.' })
  .max(64, { message: 'Name must be at most 64 characters.' });

export const createFolderSchema = z.object({
  name: nameSchema,
  parentId: z.string().uuid().optional().nullable(),
});

export const folderSchema = z.object({
  name: nameSchema,
  parentId: z
    .string()
    .uuid({ message: 'parentId must be a valid UUID' })
    .nullable()
    .optional(),
});

export const imageMetadataSchema = z.object({
  author: z.string().max(128).optional(),
  title: z.string().max(128).optional(),
  subject: z.string().max(128).optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().max(512).optional(),
});

import { Request, Response, NextFunction } from 'express';
export const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({ ...req.body, ...req.params, ...req.query });
    next();
  } catch (err: any) {
    const message = err.errors?.map((e: any) => e.message).join(', ') || 'Validation error';
    res.status(400).json({ error: message });
  }
};
