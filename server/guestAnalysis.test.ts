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
    const result = await appRouter.createCaller(ctx).guest.analyse({
      currentRole: "Specialist Nurse",
      profession: "Registered Nurse",
      targetRole: "Band 7 Specialist Nurse",
      evidenceText: "Conducts independent clinics and manages a documented caseload.",
      targetText: "Autonomous practice is required for this role.",
    });

    expect(result.isGuest).toBe(true);
    expect(result.label).toContain("not saved");
    expect(result.assessments[0]).toMatchObject({ assessment: "demonstrated", evidenceIds: [1] });
    expect(result.documents.map(document => document.fileName)).toEqual(["not-saved.txt", "not-saved-target.txt"]);
  });
});
