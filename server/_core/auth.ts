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
const RESET_TOKEN_DURATION_MS = 1000 * 60 * 30; // 30 minutes -- short-lived since it's emailed as a plain link
const VERIFICATION_TOKEN_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days -- confirms email ownership, not account access, so unlike a reset link there's no urgency reason to keep this short

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

// Same reasoning as hashSessionToken: the raw token only ever exists in the
// emailed link, and the "reset:" prefix keeps this hash in its own domain
// from session-token hashes even though both reuse ENV.sessionSecret as a
// pepper -- a collision between the two would require breaking SHA-256
// itself, not just reusing the same secret.
function hashResetToken(token: string): string {
  return createHash("sha256").update(`reset:${token}:${ENV.sessionSecret}`).digest("hex");
}

export async function createPasswordResetToken(userId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_DURATION_MS);
  await db.createPasswordResetToken({ id: hashResetToken(token), userId, expiresAt });
  return { token, expiresAt };
}

// Returns the token's own row id (its hash) alongside the user, so the
// caller can mark this exact token used after the password update actually
// succeeds -- not before, so a transient failure doesn't waste the token.
export async function getUserForPasswordResetToken(token: string): Promise<{ user: User; tokenId: string } | null> {
  const record = await db.getPasswordResetToken(hashResetToken(token));
  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) return null;
  const user = await db.getUserById(record.userId);
  if (!user) return null;
  return { user, tokenId: record.id };
}

// Own prefix, own domain -- see hashResetToken's comment; the same
// reasoning applies between this and both other token kinds.
function hashEmailVerificationToken(token: string): string {
  return createHash("sha256").update(`verify-email:${token}:${ENV.sessionSecret}`).digest("hex");
}

export async function createEmailVerificationToken(userId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_DURATION_MS);
  await db.createEmailVerificationToken({ id: hashEmailVerificationToken(token), userId, expiresAt });
  return { token, expiresAt };
}

export async function getUserForEmailVerificationToken(token: string): Promise<{ user: User; tokenId: string } | null> {
  const record = await db.getEmailVerificationToken(hashEmailVerificationToken(token));
  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) return null;
  const user = await db.getUserById(record.userId);
  if (!user) return null;
  return { user, tokenId: record.id };
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
