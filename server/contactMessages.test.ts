import { beforeEach, describe, expect, it, vi } from "vitest";

// Mirrors the passwordReset.test.ts / commercialEvents.test.ts pattern: an
// in-memory stand-in for the db.ts functions this router actually calls,
// so the test exercises the real router logic (storage-before-email
// ordering, best-effort email failure, admin gating) without a live
// database or a real Resend call.
const state = vi.hoisted(() => ({
  messages: [] as { id: number; name: string | null; email: string; message: string; createdAt: Date }[],
  nextId: 1,
  sentNotifications: [] as { name: string | null; email: string; message: string }[],
  notificationShouldFail: false,
}));

vi.mock("./db", () => ({
  createContactMessage: vi.fn(async (args: { name: string | null; email: string; message: string }) => {
    state.messages.push({ id: state.nextId++, ...args, createdAt: new Date() });
  }),
  listContactMessages: vi.fn(async () => [...state.messages].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())),
}));

vi.mock("./_core/email", () => ({
  sendContactNotificationEmail: vi.fn(async (args: { name: string | null; email: string; message: string }) => {
    if (state.notificationShouldFail) throw new Error("RESEND_API_KEY is not configured -- cannot send contact notification email.");
    state.sentNotifications.push(args);
  }),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function userContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    email: "user1@example.com",
    passwordHash: "$2b$12$abcdefghijklmnopqrstuuvwxyzabcdefghijklmnopqrstuvwxy",
    name: "User One",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return { user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

function guestContext(): TrpcContext {
  return { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

beforeEach(() => {
  state.messages.length = 0;
  state.nextId = 1;
  state.sentNotifications.length = 0;
  state.notificationShouldFail = false;
});

describe("contact.send", () => {
  it("stores the message and sends a notification email for a guest caller", async () => {
    const caller = appRouter.createCaller(guestContext());

    const result = await caller.contact.send({ name: "Jane Visitor", email: "jane@example.com", message: "Quick question about pricing." });

    expect(result).toEqual({ sent: true });
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toMatchObject({ name: "Jane Visitor", email: "jane@example.com", message: "Quick question about pricing." });
    expect(state.sentNotifications).toHaveLength(1);
  });

  it("does not require an account", async () => {
    const caller = appRouter.createCaller(guestContext());
    await expect(caller.contact.send({ email: "guest@example.com", message: "Hi" })).resolves.toEqual({ sent: true });
  });

  it("still stores the message, and still reports success, when the notification email fails to send", async () => {
    state.notificationShouldFail = true;
    const caller = appRouter.createCaller(guestContext());

    const result = await caller.contact.send({ email: "jane@example.com", message: "Quick question." });

    expect(result).toEqual({ sent: true });
    expect(state.messages).toHaveLength(1);
    expect(state.sentNotifications).toHaveLength(0);
  });

  it("rejects an empty message", async () => {
    const caller = appRouter.createCaller(guestContext());
    await expect(caller.contact.send({ email: "jane@example.com", message: "" })).rejects.toThrow();
  });

  it("rejects an invalid email address", async () => {
    const caller = appRouter.createCaller(guestContext());
    await expect(caller.contact.send({ email: "not-an-email", message: "Hi" })).rejects.toThrow();
  });
});

describe("contact.list", () => {
  it("rejects a signed-in user who is not an admin", async () => {
    const caller = appRouter.createCaller(userContext());
    await expect(caller.contact.list()).rejects.toThrow();
  });

  it("rejects an unauthenticated caller", async () => {
    const caller = appRouter.createCaller(guestContext());
    await expect(caller.contact.list()).rejects.toThrow();
  });

  it("returns stored messages for an admin caller", async () => {
    await appRouter.createCaller(guestContext()).contact.send({ email: "jane@example.com", message: "Hello there." });

    const admin = appRouter.createCaller(userContext({ id: 99, email: "owner@example.com", role: "admin" }));
    const result = await admin.contact.list();

    expect(result.total).toBe(1);
    expect(result.messages[0]).toMatchObject({ email: "jane@example.com", message: "Hello there." });
  });
});
