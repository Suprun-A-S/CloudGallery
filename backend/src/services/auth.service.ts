// src/services/auth.service.ts
import { createUser, findUserByEmail } from '../models/user.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JWTUser } from '../types';

export async function registerUser(
  email: string,
  password: string,
  passwordConfirm: string
): Promise<{ user: JWTUser; token: string }> {
  if (password !== passwordConfirm) {
    throw { status: 400, message: 'Passwords do not match.' };
  }
  const existing = await findUserByEmail(email);
  if (existing) {
    throw { status: 409, message: 'Email already in use.' };
  }
  const hash = await bcrypt.hash(password, 12);
  const user = await createUser(email, hash);
  const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: '7d',
  });
  return { user: { id: user.id, email: user.email }, token };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ user: JWTUser; token: string }> {
  const userRec = await findUserByEmail(email);
  if (!userRec) {
    throw { status: 401, message: 'Invalid email or password.' };
  }
  const match = await bcrypt.compare(password, userRec.password);
  if (!match) {
    throw { status: 401, message: 'Invalid email or password.' };
  }
  const token = jwt.sign({ id: userRec.id, email: userRec.email }, env.JWT_SECRET, {
    expiresIn: '7d',
  });
  return { user: { id: userRec.id, email: userRec.email }, token };
}