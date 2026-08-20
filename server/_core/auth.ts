import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { COOKIE_NAME } from "@shared/const";
import type { Request, Response } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

const BCRYPT_ROUNDS = 12;
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// The raw session token only ever lives in the browser's cookie. The server
// stores a salted hash of it (never the raw token), so a database read alone
// can't be replayed as a valid session cookie.
function hashSessionToken(token: string): string {
  return createHash("sha256").update(`${token}:${ENV.sessionSecret}`).digest("hex");
}

export async function createSession(userId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.createSession({ id: hashSessionToken(token), userId, expiresAt });
  return { token, expiresAt };
}

export async function getUserForSessionToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const session = await db.getSession(hashSessionToken(token));
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await db.deleteSession(session.id);
    return null;
  }
  const user = await db.getUserById(session.userId);
  return user ?? null;
}

export async function destroySessionToken(token: string | undefined): Promise<void> {
  if (!token) return;
  await db.deleteSession(hashSessionToken(token));
}

export function setSessionCookie(req: Request, res: Response, token: string, expiresAt: Date) {
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, expires: expiresAt });
}

export function clearSessionCookie(req: Request, res: Response) {
  const cookieOptions = getSessionCookieOptions(req);
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
}

// Never send a user's password hash to the client — every auth response
// (signup/login/me) must go through this before leaving the server.
export function sanitizeUser(user: User): Omit<User, "passwordHash"> {
  const { passwordHash, ...safe } = user;
  return safe;
}
