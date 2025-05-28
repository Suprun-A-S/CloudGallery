// src/models/user.model.ts
import { db } from '../config/db';
import { UserModel } from '../types';

export const createUser = async (email: string, passwordHash: string): Promise<UserModel> => {
  const result = await db.query<UserModel>(
    `INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *`,
    [email, passwordHash]
  );
  return result.rows[0];
};

export const findUserByEmail = async (email: string): Promise<UserModel | null> => {
  const result = await db.query<UserModel>(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
};

export const findUserById = async (id: string): Promise<UserModel | null> => {
  const result = await db.query<UserModel>(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};