import { describe, expect, it, vi } from "vitest";
import { demoEvidence, demoObjectiveReports } from "./demoData";

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));

import { invokeLLM } from "./_core/llm";
import { analyseAnnualAppraisal, analyseJobEvaluation } from "./evidenceEngine";

const sharedEvidence = [{ id: 1, statement: "Sarah collected data and helped redesign appointment allocation.", excerpt: "Sarah collected data and helped redesign appointment allocation.", source: "Clinic Follow-up Audit", location: "Paragraph 2", category: "Quality improvement", evidenceType: "Audit report" }];

describe("objective architecture", () => {
  it("uses the same Sarah Mwangi facts while producing materially different A, B, and C outputs", () => {
    const promotion = demoObjectiveReports.A.mappings.find(item => item.requirementId === 205)!;
    const appraisal = demoObjectiveReports.B.documentedAchievements.find(item => item.title === "Quality-improvement contribution")!;
    const evaluation = demoObjectiveReports.C.comparisons.find(item => item.responsibilityId === 405)!;
    const sourceIds = new Set(demoEvidence.map(item => item.id));

    expect(promotion).toMatchObject({ assessment: "indirectly_relevantly_evidenced", evidenceIds: [106, 108] });
    expect(appraisal).toMatchObject({ evidenceIds: [106] });
    expect(evaluation).toMatchObject({ alignment: "potentially_broader_responsibility", evidenceIds: [106, 108] });
    [...promotion.evidenceIds, ...appraisal.evidenceIds, ...evaluation.evidenceIds].forEach(id => expect(sourceIds.has(id)).toBe(true));
    expect(appraisal.statement).toContain("data collection");
    expect(evaluation.documentedActualActivity).toContain("redesign contribution");
  });

  it("recognises Sarah’s QI contribution and project-level impact without inventing leadership or individual causation", () => {
    const contribution = demoObjectiveReports.B.documentedAchievements.find(item => item.title === "Quality-improvement contribution")!;
    const impact = demoObjectiveReports.B.documentedImpact[0]!;
    const limitation = demoObjectiveReports.B.evidenceLimitations[0]!;

    expect(contribution).toMatchObject({ evidenceIds: [106] });
    expect(impact).toMatchObject({ evidenceIds: [107] });
    expect(limitation.evidenceIds).toEqual([107, 108]);
    expect(limitation.qualification).toContain("project leadership and individual causation only");
  });

  it("removes invented citations from the Objective B report while retaining the shared source fact", async () => {
    vi.mocked(invokeLLM).mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ documentedAchievements: [{ title: "QI contribution", statement: "The supplied source records QI activity.", evidenceIds: [1, 999], qualification: "No project ownership is asserted.", action: null }], documentedImpact: [], evidenceLimitations: [], developmentThemes: [], evidenceGroundedObjectives: [], suggestedEvidenceToRetain: [] }) } }] } as any);
    const report = await analyseAnnualAppraisal(sharedEvidence);
    expect(report.documentedAchievements[0]).toMatchObject({ evidenceIds: [1], statement: "The supplied source records QI activity." });
  });

  it("keeps Objective C as a neutral current-role comparison rather than a target-role assessment", async () => {
    vi.mocked(invokeLLM).mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ comparisons: [{ responsibilityId: 7, documentedActualActivity: "The source records data collection and redesign contribution.", alignment: "potentially_broader_responsibility", evidenceIds: [1, 999], qualification: "Participation is documented; leadership is not.", discussionPoint: "Discuss how this activity is reflected in the formal current role.", strengtheningEvidence: "Retain an allocated responsibility and decision record." }], questionsForDiscussion: [{ title: "Scope", statement: "Which activity is routinely expected?", evidenceIds: [1, 999], qualification: "Neutral clarification only.", action: null }] }) } }] } as any);
    const report = await analyseJobEvaluation([{ responsibilityId: 7, responsibility: "Contribute to service improvement", category: "Quality improvement", source: "Current role description", location: "Paragraph 3" }], sharedEvidence);
    expect(report.comparisons[0]).toMatchObject({ alignment: "potentially_broader_responsibility", evidenceIds: [1] });
    expect(report.comparisons[0].documentedActualActivity).toContain("data collection");
    expect(report.questionsForDiscussion[0]).toMatchObject({ evidenceIds: [1] });
  });
});
