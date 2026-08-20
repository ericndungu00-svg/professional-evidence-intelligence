import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./evidenceEngine", () => ({
  paragraphize: (text: string) => [text],
  locationForParagraph: () => "Paragraph 1",
  extractEvidenceItems: async () => [{ statement: "Conducts independent clinics.", excerpt: "Conducts independent clinics.", paragraphIndex: 0, category: "Clinical practice", evidenceType: "Appraisal", outcome: null, confidence: "high" }],
  extractRequirements: async () => [{ category: "Experience", criterion: "Autonomous practice", paragraphIndex: 0, ordinal: 1 }],
  mapEvidenceToRequirements: async () => [{ requirementId: 1, assessment: "demonstrated", strength: "strong", evidenceIds: [1], interpretation: "The supplied passage directly supports the criterion.", gap: "No material gap identified.", nextStep: null }],
  detectPlainTextConflicts: () => [],
  parseEvidenceFile: async () => ({ text: "", status: "ready" }),
}));

import { appRouter } from "./routers";

describe("guest analysis access boundary", () => {
  it("creates a temporary Objective A evidence map without an authenticated user", async () => {
    const ctx = { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;
    const caller = appRouter.createCaller(ctx);
    // Guest analysis runs as a background job (see routers.ts runGuestAnalysisJob)
    // so long submissions don't block a single synchronous request; the
    // mutation just returns a jobId, and the client polls analyseStatus.
    const { jobId } = await caller.guest.startAnalyse({
      currentRole: "Specialist Nurse",
      profession: "Registered Nurse",
      targetRole: "Band 7 Specialist Nurse",
      evidenceText: "Conducts independent clinics and manages a documented caseload.",
      targetText: "Autonomous practice is required for this role.",
    });

    const job = await vi.waitFor(async () => {
      const status = await caller.guest.analyseStatus({ jobId });
      expect(status.status).not.toBe("processing");
      return status;
    });
    if (job.status !== "complete") throw new Error(`Expected guest analysis to complete, got ${job.status}`);
    const result = job.result;

    expect(result.isGuest).toBe(true);
    expect(result.label).toContain("not saved");
    expect(result.assessments[0]).toMatchObject({ assessment: "demonstrated", evidenceIds: [1] });
    expect(result.documents.map(document => document.fileName)).toEqual(["not-saved.txt", "not-saved-target.txt"]);
  });
});
