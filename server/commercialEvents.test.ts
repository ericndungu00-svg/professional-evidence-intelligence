import { beforeEach, describe, expect, it, vi } from "vitest";

// Mirrors the passwordReset.test.ts pattern: a minimal in-memory stand-in
// for the db.ts functions this router actually calls, keyed the same way,
// so the test exercises the real router logic (idempotency, server-side
// analysis-count computation, admin gating) without a live database.
const state = vi.hoisted(() => ({
  analysesByUser: new Map<number, number>(),
  events: [] as { id: number; userId: number; eventType: string; analysesCompletedAtTimeOfInterest: number; objective: string | null; source: string | null; createdAt: Date }[],
  nextId: 1,
}));

vi.mock("./db", () => ({
  countAnalysesForUser: vi.fn(async (userId: number) => state.analysesByUser.get(userId) ?? 0),
  // Mirrors the real unique-index behaviour: a second call for the same
  // (userId, eventType) is a silent no-op, not a duplicate row or a thrown
  // error.
  recordCommercialEvent: vi.fn(async (args: { userId: number; eventType: string; analysesCompletedAtTimeOfInterest: number; objective?: string | null; source?: string | null }) => {
    const exists = state.events.some(event => event.userId === args.userId && event.eventType === args.eventType);
    if (exists) return;
    state.events.push({ id: state.nextId++, userId: args.userId, eventType: args.eventType, analysesCompletedAtTimeOfInterest: args.analysesCompletedAtTimeOfInterest, objective: args.objective ?? null, source: args.source ?? null, createdAt: new Date() });
  }),
  listCommercialEvents: vi.fn(async (eventType: string) =>
    state.events
      .filter(event => event.eventType === eventType)
      .map(event => ({ ...event, email: `user${event.userId}@example.com`, name: `User ${event.userId}` }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  ),
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
  state.analysesByUser.clear();
  state.events.length = 0;
  state.nextId = 1;
});

describe("commercial.recordProInterest", () => {
  it("creates a pro_interest event associated with the authenticated user", async () => {
    state.analysesByUser.set(1, 3);
    const caller = appRouter.createCaller(userContext());

    const result = await caller.commercial.recordProInterest({ objective: "A", source: "header" });

    expect(result).toEqual({ recorded: true });
    expect(state.events).toHaveLength(1);
    expect(state.events[0]).toMatchObject({ userId: 1, eventType: "pro_interest", analysesCompletedAtTimeOfInterest: 3, objective: "A", source: "header" });
  });

  // The count is the whole point of the record -- it must reflect the
  // user's real, server-known usage, not whatever the client happens to
  // claim (the input schema doesn't even accept it as a field).
  it("computes analysesCompletedAtTimeOfInterest from the server, never from client input", async () => {
    state.analysesByUser.set(1, 7);
    const caller = appRouter.createCaller(userContext());

    await caller.commercial.recordProInterest({});

    expect(state.events[0]?.analysesCompletedAtTimeOfInterest).toBe(7);
  });

  it("does not create a duplicate record when the same user expresses interest twice", async () => {
    const caller = appRouter.createCaller(userContext());

    await caller.commercial.recordProInterest({});
    await caller.commercial.recordProInterest({});

    expect(state.events).toHaveLength(1);
  });

  it("requires authentication", async () => {
    const caller = appRouter.createCaller(guestContext());
    await expect(caller.commercial.recordProInterest({})).rejects.toThrow();
    expect(state.events).toHaveLength(0);
  });
});

describe("commercial.listProInterest", () => {
  it("rejects a signed-in user who is not an admin", async () => {
    const caller = appRouter.createCaller(userContext());
    await expect(caller.commercial.listProInterest()).rejects.toThrow();
  });

  it("rejects an unauthenticated caller", async () => {
    const caller = appRouter.createCaller(guestContext());
    await expect(caller.commercial.listProInterest()).rejects.toThrow();
  });

  it("returns recorded events, with the interested user's details, for an admin caller", async () => {
    state.analysesByUser.set(1, 2);
    await appRouter.createCaller(userContext()).commercial.recordProInterest({ source: "header" });

    const admin = appRouter.createCaller(userContext({ id: 99, email: "owner@example.com", role: "admin" }));
    const result = await admin.commercial.listProInterest();

    expect(result.total).toBe(1);
    expect(result.events[0]).toMatchObject({ userId: 1, email: "user1@example.com", analysesCompletedAtTimeOfInterest: 2, source: "header" });
  });

  // The one thing this whole feature must never do: let a normal user see
  // who else expressed interest. There's no procedure that takes a userId
  // and returns another user's events -- listProInterest is admin-only and
  // returns everyone's, recordProInterest only ever writes for ctx.user.id.
  it("gives a normal user no path to another user's interest record", async () => {
    state.analysesByUser.set(1, 1);
    state.analysesByUser.set(2, 5);
    await appRouter.createCaller(userContext({ id: 1 })).commercial.recordProInterest({});
    await appRouter.createCaller(userContext({ id: 2, email: "user2@example.com" })).commercial.recordProInterest({});

    const caller = appRouter.createCaller(userContext({ id: 1 }));
    await expect(caller.commercial.listProInterest()).rejects.toThrow();
  });
});
