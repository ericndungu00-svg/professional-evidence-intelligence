import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
  class AppraisalGenerationError extends Error {
    constructor(public readonly reason: string) { super(reason); }
  }
  return { updates: [] as Array<Record<string, unknown>>, AppraisalGenerationError };
});

vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    insert: vi.fn(() => ({ values: vi.fn(async () => ({ insertId: 77 })) })),
    update: vi.fn(() => ({ set: vi.fn((value: Record<string, unknown>) => ({ where: vi.fn(async () => { state.updates.push(value); }) })) })),
  })),
  getTargetDocument: vi.fn(async () => null),
  getWorkspace: vi.fn(async () => ({
    profile: null,
    documents: [{ id: 11, title: "Evidence source", documentType: "evidence", extractedText: "Extracted text" }],
    requirements: [],
    currentRoleDocument: null,
    currentRoleResponsibilities: [],
    evidence: [{ id: 1, documentId: 11, statement: "Documented contribution", excerpt: "Documented contribution", sourceLocation: "Paragraph 1", category: "Quality improvement", evidenceType: "Project record" }],
    analyses: [], latestAnalysis: null, assessments: [], contradictions: [], objectiveReports: {},
  })),
}));

vi.mock("./evidenceEngine", () => ({
  AppraisalGenerationError: state.AppraisalGenerationError,
  analyseAnnualAppraisal: vi.fn(async () => { throw new state.AppraisalGenerationError("malformed_json"); }),
  analyseJobEvaluation: vi.fn(),
  detectPlainTextConflicts: vi.fn(() => []),
  extractEvidenceItems: vi.fn(), extractRequirements: vi.fn(), locationForParagraph: vi.fn(), mapEvidenceToRequirements: vi.fn(), paragraphize: vi.fn(), parseEvidenceFile: vi.fn(),
}));

vi.mock("./storage", () => ({ storagePut: vi.fn() }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(): TrpcContext {
  return {
    user: { id: 1, email: "objective-b-test@example.com", passwordHash: "$2b$12$abcdefghijklmnopqrstuuvwxyzabcdefghijklmnopqrstuvwxy", name: "Test user", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as TrpcContext["res"],
  };
}

describe("Objective B failed-analysis persistence", () => {
  beforeEach(() => { state.updates.length = 0; });

  it("marks a malformed generation as failed and never saves an empty completed report", async () => {
    const caller = appRouter.createCaller(context());
    // runAnalysis now returns immediately with a "processing" status and runs
    // the generation in the background (see routers.ts runAnalysisJob), so
    // the failure is observed by waiting for the persisted status update
    // rather than by the mutation call rejecting.
    await expect(caller.evidence.runAnalysis({ objective: "B" })).resolves.toMatchObject({ analysisId: 77, status: "processing" });
    await vi.waitFor(() => expect(state.updates).toHaveLength(1));
    expect(state.updates[0]).toMatchObject({ status: "failed", objectiveReport: null });
    expect(state.updates[0]?.generatedSummary).toContain("malformed json");
  });
});
