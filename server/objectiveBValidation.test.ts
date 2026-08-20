import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));

import { invokeLLM } from "./_core/llm";
import { analyseAnnualAppraisal, AppraisalGenerationError } from "./evidenceEngine";

const evidence = [{ id: 1, statement: "Completed an accredited course and delivered a clinic improvement contribution.", excerpt: "Completed an accredited course and delivered a clinic improvement contribution.", source: "CV", location: "Section: Education / CPD · Paragraph 3", category: "Qualification", evidenceType: "Explicit qualification / CPD" }];

const emptyReport = {
  documentedAchievements: [], documentedImpact: [], evidenceLimitations: [], developmentThemes: [], evidenceGroundedObjectives: [], suggestedEvidenceToRetain: [],
};

const validReport = {
  ...emptyReport,
  documentedAchievements: [{ title: "Accredited course", statement: "The supplied CV records an accredited course.", evidenceIds: [1], qualification: "The source does not establish an outcome beyond completion.", action: null }],
};

function response(content: unknown) {
  vi.mocked(invokeLLM).mockResolvedValueOnce({ choices: [{ message: { content } }] } as any);
}

describe("Objective B validated report generation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a source-linked fallback rather than an empty appraisal when the remote generator fails", async () => {
    vi.mocked(invokeLLM).mockRejectedValueOnce(new Error("upstream unavailable"));
    await expect(analyseAnnualAppraisal(evidence)).resolves.toMatchObject({ objective: "B", documentedAchievements: [{ evidenceIds: [1] }] });
  });

  it("returns a source-linked fallback before a gateway timeout when the remote generator exceeds the deadline", async () => {
    vi.useFakeTimers();
    vi.mocked(invokeLLM).mockImplementationOnce(() => new Promise(() => undefined) as any);
    try {
      const appraisal = analyseAnnualAppraisal(evidence);
      await vi.advanceTimersByTimeAsync(25_000);
      await expect(appraisal).resolves.toMatchObject({ objective: "B", documentedAchievements: [{ evidenceIds: [1] }] });
    } finally {
      vi.useRealTimers();
    }
  });

  it("reports a truncated model completion distinctly from malformed JSON", async () => {
    vi.mocked(invokeLLM).mockResolvedValueOnce({ choices: [{ finish_reason: "length", message: { content: "{\"documentedAchievements\":" } }] } as any);
    await expect(analyseAnnualAppraisal(evidence)).rejects.toMatchObject<AppraisalGenerationError>({ reason: "truncated_response" });
  });

  it("rejects non-string and malformed JSON model content", async () => {
    response([]);
    await expect(analyseAnnualAppraisal(evidence)).rejects.toMatchObject<AppraisalGenerationError>({ reason: "non_string_response" });
    response("not json");
    await expect(analyseAnnualAppraisal(evidence)).rejects.toMatchObject<AppraisalGenerationError>({ reason: "malformed_json" });
  });

  it("accepts a valid appraisal object enclosed in a JSON code fence", async () => {
    response(`\`\`\`json\n${JSON.stringify(validReport)}\n\`\`\``);
    await expect(analyseAnnualAppraisal(evidence)).resolves.toMatchObject({ objective: "B", documentedAchievements: [{ evidenceIds: [1] }] });
  });

  it("accepts a complete appraisal object enclosed by harmless model prose", async () => {
    response(`Here is the requested report.\n${JSON.stringify(validReport)}\nEnd of report.`);
    await expect(analyseAnnualAppraisal(evidence)).resolves.toMatchObject({ objective: "B", documentedAchievements: [{ evidenceIds: [1] }] });
  });

  it("retries a malformed primary response with a shorter provider-compatible appraisal request", async () => {
    response("not json");
    response(JSON.stringify(validReport));
    await expect(analyseAnnualAppraisal(evidence)).resolves.toMatchObject({ objective: "B", documentedAchievements: [{ evidenceIds: [1] }] });
    expect(vi.mocked(invokeLLM)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(invokeLLM).mock.calls[1]?.[0]).toMatchObject({ model: "claude-haiku-4-5", response_format: { type: "text" }, maxTokens: 700 });
  });

  it("rejects missing appraisal sections and all-empty reports", async () => {
    response(JSON.stringify({ documentedAchievements: [] }));
    await expect(analyseAnnualAppraisal(evidence)).rejects.toMatchObject<AppraisalGenerationError>({ reason: "invalid_schema" });
    response(JSON.stringify(emptyReport));
    await expect(analyseAnnualAppraisal(evidence)).rejects.toMatchObject<AppraisalGenerationError>({ reason: "empty_report" });
  });

  it("rejects malformed finding objects even when every expected section is present", async () => {
    response(JSON.stringify({ ...validReport, documentedAchievements: [{ title: "Malformed", statement: "Missing source identifiers", qualification: "Invalid payload", action: null }] }));
    await expect(analyseAnnualAppraisal(evidence)).rejects.toMatchObject<AppraisalGenerationError>({ reason: "invalid_schema" });
  });

  it("rejects reports with no valid source-linked finding", async () => {
    response(JSON.stringify({ ...validReport, documentedAchievements: [{ ...validReport.documentedAchievements[0], evidenceIds: [999] }] }));
    await expect(analyseAnnualAppraisal(evidence)).rejects.toMatchObject<AppraisalGenerationError>({ reason: "unlinked_report" });
  });

  it("returns a schema-valid source-linked appraisal report", async () => {
    response(JSON.stringify(validReport));
    await expect(analyseAnnualAppraisal(evidence)).resolves.toMatchObject({ objective: "B", documentedAchievements: [{ evidenceIds: [1] }] });
  });

  it("uses bounded, concise generation settings for a large evidence library", async () => {
    response(JSON.stringify(validReport));
    await analyseAnnualAppraisal(Array.from({ length: 140 }, (_, index) => ({ ...evidence[0], id: index + 1, statement: `Evidence ${index + 1}` })));
    expect(vi.mocked(invokeLLM)).toHaveBeenCalledWith(expect.objectContaining({ model: "claude-haiku-4-5" }));
    const invocation = vi.mocked(invokeLLM).mock.calls[0]?.[0] as any;
    expect(invocation).toMatchObject({ model: "claude-haiku-4-5", response_format: { type: "text" }, maxTokens: 900 });
    expect(invocation.messages[1].content).toContain('"id":12');
    expect(invocation.messages[1].content).not.toContain('"id":13');
  });
});
