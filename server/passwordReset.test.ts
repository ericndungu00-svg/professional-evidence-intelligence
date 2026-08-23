import { beforeEach, describe, expect, it, vi } from "vitest";

// A minimal in-memory stand-in for the tables this flow touches, keyed the
// same way the real db.ts helpers are -- lets the test exercise the real
// hashing/expiry/single-use logic in server/_core/auth.ts against something
// that behaves like the database, without needing one connected.
const state = vi.hoisted(() => ({
  users: new Map<number, any>(),
  sessions: new Map<string, any>(),
  resetTokens: new Map<string, any>(),
  sentEmails: [] as { to: string; url: string }[],
  sendShouldFail: false,
}));

vi.mock("./db", () => ({
  getUserByEmail: vi.fn(async (email: string) => [...state.users.values()].find(user => user.email === email)),
  getUserById: vi.fn(async (id: number) => state.users.get(id)),
  createPasswordResetToken: vi.fn(async (values: { id: string; userId: number; expiresAt: Date }) => {
    state.resetTokens.set(values.id, { ...values, usedAt: null, createdAt: new Date() });
  }),
  getPasswordResetToken: vi.fn(async (id: string) => state.resetTokens.get(id)),
  markPasswordResetTokenUsed: vi.fn(async (id: string) => {
    const row = state.resetTokens.get(id);
    if (row) row.usedAt = new Date();
  }),
  updateUserPassword: vi.fn(async (userId: number, passwordHash: string) => {
    const user = state.users.get(userId);
    if (user) user.passwordHash = passwordHash;
  }),
  deleteAllSessionsForUser: vi.fn(async (userId: number) => {
    for (const [key, session] of state.sessions) if (session.userId === userId) state.sessions.delete(key);
  }),
  createSession: vi.fn(async (values: { id: string; userId: number; expiresAt: Date }) => {
    state.sessions.set(values.id, values);
  }),
}));

vi.mock("./_core/email", () => ({
  sendPasswordResetEmail: vi.fn(async (to: string, url: string) => {
    if (state.sendShouldFail) throw new Error("RESEND_API_KEY is not configured -- cannot send password reset email.");
    state.sentEmails.push({ to, url });
  }),
}));

import { appRouter } from "./routers";
import { getUserForPasswordResetToken } from "./_core/auth";
import type { TrpcContext } from "./_core/context";

function context(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {}, get: (name: string) => (name.toLowerCase() === "host" ? "app.example.com" : undefined) } as unknown as TrpcContext["req"],
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("password reset", () => {
  beforeEach(() => {
    state.users.clear();
    state.sessions.clear();
    state.resetTokens.clear();
    state.sentEmails.length = 0;
    state.sendShouldFail = false;
    state.users.set(1, { id: 1, email: "real-user@example.com", passwordHash: "old-hash", name: "Real User", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() });
  });

  it("requestPasswordReset sends an email and creates a token for a real account", async () => {
    const caller = appRouter.createCaller(context());
    const result = await caller.auth.requestPasswordReset({ email: "real-user@example.com" });
    expect(result.message).toContain("If an account exists");
    expect(state.sentEmails).toHaveLength(1);
    expect(state.sentEmails[0]?.to).toBe("real-user@example.com");
    expect(state.sentEmails[0]?.url).toContain("https://app.example.com/reset-password?token=");
    expect(state.resetTokens.size).toBe(1);
  });

  it("requestPasswordReset returns the identical response for an unregistered email, and sends nothing", async () => {
    const caller = appRouter.createCaller(context());
    const registered = await caller.auth.requestPasswordReset({ email: "real-user@example.com" });
    const unregistered = await caller.auth.requestPasswordReset({ email: "nobody@example.com" });
    expect(unregistered).toEqual(registered);
    expect(state.sentEmails).toHaveLength(1); // only the registered address
    expect(state.resetTokens.size).toBe(1); // no token created for the unregistered address
  });

  // Regression test: a first live pass against this exact endpoint let a
  // send failure propagate uncaught, so a registered email got a 500 while
  // an unregistered one still got the plain 200 below -- that response-shape
  // difference is itself an account-enumeration leak, on the one endpoint
  // whose entire design is not having one. Caught live via curl, fixed by
  // wrapping the create+send in try/catch inside the router.
  it("requestPasswordReset still returns the identical generic response when the email send itself fails", async () => {
    const caller = appRouter.createCaller(context());
    const okResult = await caller.auth.requestPasswordReset({ email: "nobody@example.com" });

    state.sendShouldFail = true;
    const failedSendResult = await caller.auth.requestPasswordReset({ email: "real-user@example.com" });

    expect(failedSendResult).toEqual(okResult);
    expect(state.resetTokens.size).toBe(1); // the token itself is still created even though the send failed
  });

  it("resetPassword with a valid token updates the password, ends existing sessions, and signs the user back in", async () => {
    state.sessions.set("some-other-session-hash", { userId: 1, expiresAt: new Date(Date.now() + 100000) });
    const caller = appRouter.createCaller(context());
    await caller.auth.requestPasswordReset({ email: "real-user@example.com" });
    const resetUrl = state.sentEmails[0]!.url;
    const token = new URL(resetUrl).searchParams.get("token")!;

    const user = await caller.auth.resetPassword({ token, newPassword: "brand-new-password-123" });
    expect(user.email).toBe("real-user@example.com");
    expect((user as any).passwordHash).toBeUndefined(); // sanitizeUser must strip it

    expect(state.users.get(1)?.passwordHash).not.toBe("old-hash"); // password actually changed
    expect(state.sessions.has("some-other-session-hash")).toBe(false); // prior session revoked
    expect(state.sessions.size).toBe(1); // the fresh sign-in session from resetPassword itself

    const record = [...state.resetTokens.values()][0];
    expect(record.usedAt).not.toBeNull();
  });

  it("resetPassword rejects a token that was already used", async () => {
    const caller = appRouter.createCaller(context());
    await caller.auth.requestPasswordReset({ email: "real-user@example.com" });
    const token = new URL(state.sentEmails[0]!.url).searchParams.get("token")!;

    await caller.auth.resetPassword({ token, newPassword: "first-new-password-1" });
    await expect(caller.auth.resetPassword({ token, newPassword: "second-new-password-2" })).rejects.toThrow(/invalid or has expired/);
  });

  it("resetPassword rejects an expired token", async () => {
    const caller = appRouter.createCaller(context());
    await caller.auth.requestPasswordReset({ email: "real-user@example.com" });
    const token = new URL(state.sentEmails[0]!.url).searchParams.get("token")!;
    const record = [...state.resetTokens.values()][0];
    record.expiresAt = new Date(Date.now() - 1000); // force it into the past

    await expect(caller.auth.resetPassword({ token, newPassword: "another-new-password-1" })).rejects.toThrow(/invalid or has expired/);
  });

  it("resetPassword rejects a token that was never issued", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.auth.resetPassword({ token: "not-a-real-token", newPassword: "another-new-password-1" })).rejects.toThrow(/invalid or has expired/);
  });

  it("getUserForPasswordResetToken (auth.ts) rejects a token for a user that no longer exists", async () => {
    const caller = appRouter.createCaller(context());
    await caller.auth.requestPasswordReset({ email: "real-user@example.com" });
    const token = new URL(state.sentEmails[0]!.url).searchParams.get("token")!;
    state.users.delete(1);

    expect(await getUserForPasswordResetToken(token)).toBeNull();
  });
});
