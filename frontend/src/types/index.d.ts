// src/types/index.d.ts
import { Request } from 'express';

export interface JWTUser {
  id: string;
  email: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: JWTUser;
  }
}

export interface User {
  id: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  owner_id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
}

export interface Image {
  id: string;
  owner_id: string;
  folder_id: string | null;
  public_id: string;
  url: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  author: string | null;
  title: string | null;
  subject: string | null;
  theme: string | null;
  description: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}
