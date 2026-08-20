import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));

import { invokeLLM } from "./_core/llm";
import { extractEvidenceItems, mapEvidenceToRequirements } from "./evidenceEngine";

const evidence = [
  { id: 1, statement: "Colleagues seek Sarah's advice on complex clinical decisions.", excerpt: "Colleagues seek Sarah's advice on complex clinical decisions.", source: "Manager feedback", location: "Paragraph 2", category: "Leadership", evidenceType: "Manager feedback" },
  { id: 2, statement: "Sarah originated a local patient-information initiative and contributed to its implementation.", excerpt: "Sarah originated a local patient-information initiative and contributed to its implementation.", source: "Project record", location: "Paragraph 4", category: "Quality improvement", evidenceType: "Project record" },
  { id: 3, statement: "Provided health promotion advice to patients attending the clinic.", excerpt: "Provided health promotion advice to patients attending the clinic.", source: "Clinic record", location: "Paragraph 2", category: "Health promotion", evidenceType: "Clinical record" },
  { id: 4, statement: "Delivered a health-promotion briefing to nursing staff.", excerpt: "Delivered a health-promotion briefing to nursing staff.", source: "Teaching record", location: "Paragraph 3", category: "Health promotion", evidenceType: "Teaching record" },
  { id: 5, statement: "Describes interest in innovation and lifelong learning.", excerpt: "Describes interest in innovation and lifelong learning.", source: "Personal statement", location: "Paragraph 1", category: "Professional development", evidenceType: "Personal statement" },
  { id: 6, statement: "Completed the accredited Advanced HIV Practice Certificate in 2025.", excerpt: "Education / CPD: Completed the accredited Advanced HIV Practice Certificate in 2025.", source: "CV", location: "Section: Education / CPD · Paragraph 7", category: "Qualification", evidenceType: "Explicit qualification / CPD" },
];

function mockMapping(mapping: unknown) {
  vi.mocked(invokeLLM).mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ mappings: [mapping] }) } }] } as any);
}

describe("component-level evidence discipline", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not convert general leadership evidence into senior support or role modelling", async () => {
    mockMapping({ requirementId: 1, assessment: "indirectly_relevantly_evidenced", strength: "moderate", evidenceIds: [1], interpretation: "Advice-seeking is relevant to informal leadership only.", gap: "Senior support and role modelling are not explicitly documented.", nextStep: "Retain documented senior support and role-modelling examples.", components: [
      { component: "Provide senior support", assessment: "indirectly_relevantly_evidenced", evidenceIds: [1], interpretation: "Advice-seeking is relevant but does not explicitly establish a senior support remit.", gap: "A defined senior support responsibility is not documented." },
      { component: "Act as a role model for junior staff", assessment: "not_found", evidenceIds: [], interpretation: "No source explicitly describes role modelling of junior staff.", gap: "Retain junior feedback or a formal mentoring remit." },
    ] });
    const [report] = await mapEvidenceToRequirements([{ requirementId: 1, criterion: "Provide senior support and act as a role model for junior staff", category: "Leadership" }], evidence);
    expect(report).toMatchObject({ assessment: "indirectly_relevantly_evidenced", strength: "moderate" });
    expect(report.components).toMatchObject([{ assessment: "indirectly_relevantly_evidenced", evidenceIds: [1] }, { assessment: "not_found", evidenceIds: [] }]);
  });

  it("downgrades a model's direct senior-support label when the selected source contains informal advice only", async () => {
    mockMapping({ requirementId: 5, assessment: "directly_evidenced", strength: "strong", evidenceIds: [1], interpretation: "The source shows support.", gap: "No gap.", nextStep: null, components: [{ component: "Provide senior support", assessment: "directly_evidenced", evidenceIds: [1], interpretation: "Advice is recorded.", gap: "No gap." }] });
    const [report] = await mapEvidenceToRequirements([{ requirementId: 5, criterion: "Provide senior support", category: "Leadership" }], evidence);
    expect(report).toMatchObject({ assessment: "indirectly_relevantly_evidenced", strength: "moderate" });
    expect(report.components?.[0]).toMatchObject({ assessment: "indirectly_relevantly_evidenced", evidenceIds: [1] });
    expect(report.components?.[0]?.gap).toContain("does not explicitly document");
  });

  it("separates initiating and contributing to implementation from formal policy development or leadership", async () => {
    mockMapping({ requirementId: 2, assessment: "indirectly_relevantly_evidenced", strength: "moderate", evidenceIds: [2], interpretation: "The initiative and implementation contribution are documented, but formal policy authority is not.", gap: "Formal policy development, approval, and policy leadership are not demonstrated.", nextStep: "Retain a policy remit, draft, approval trail, and leadership record.", components: [
      { component: "Develop policy changes", assessment: "not_found", evidenceIds: [], interpretation: "No policy development or approval record is supplied.", gap: "Retain formal policy documents and approval evidence." },
      { component: "Implement policy changes", assessment: "directly_evidenced", evidenceIds: [2], interpretation: "Contribution to implementation is documented.", gap: "The source does not establish implementation leadership." },
      { component: "Lead policy changes", assessment: "not_found", evidenceIds: [], interpretation: "Originating an initiative is not formal policy leadership.", gap: "Retain an allocated policy-lead remit and decision authority." },
    ] });
    const [report] = await mapEvidenceToRequirements([{ requirementId: 2, criterion: "Develop, implement and lead policy changes within the HIV service", category: "Policy" }], evidence);
    expect(report.assessment).toBe("indirectly_relevantly_evidenced");
    expect(report.components?.map(item => item.assessment)).toEqual(["not_found", "directly_evidenced", "not_found"]);
  });

  it("keeps named populations separate instead of aggregating patient and staff evidence into carers or external agencies", async () => {
    mockMapping({ requirementId: 3, assessment: "indirectly_relevantly_evidenced", strength: "moderate", evidenceIds: [3, 4], interpretation: "Patient and staff activity is documented; carers and external agencies are not.", gap: "Retain sources for carers and external agencies where these are part of the requirement.", nextStep: "Retain feedback or records for each named population.", components: [
      { component: "Patients", assessment: "directly_evidenced", evidenceIds: [3], interpretation: "Patient advice is explicitly documented.", gap: "No material gap in the supplied source." },
      { component: "Carers", assessment: "not_found", evidenceIds: [], interpretation: "No carer activity is documented.", gap: "Retain carer-facing advice or feedback." },
      { component: "Staff", assessment: "directly_evidenced", evidenceIds: [4], interpretation: "Staff briefing is explicitly documented.", gap: "No material gap in the supplied source." },
      { component: "External agencies", assessment: "not_found", evidenceIds: [], interpretation: "No external-agency activity is documented.", gap: "Retain interagency communication or session records." },
    ] });
    const [report] = await mapEvidenceToRequirements([{ requirementId: 3, criterion: "Provide expert advice and health promotion to patients, carers, staff and external agencies", category: "Communication" }], evidence);
    expect(report.components?.map(item => ({ component: item.component, assessment: item.assessment }))).toEqual([
      { component: "Patients", assessment: "directly_evidenced" },
      { component: "Carers", assessment: "not_found" },
      { component: "Staff", assessment: "directly_evidenced" },
      { component: "External agencies", assessment: "not_found" },
    ]);
  });

  it("makes explicit Education and CPD evidence available as the priority source for CPD requirements", async () => {
    mockMapping({ requirementId: 4, assessment: "directly_evidenced", strength: "strong", evidenceIds: [6], interpretation: "The accredited certificate is directly documented.", gap: "No material gap in the supplied evidence.", nextStep: null, components: [{ component: "Relevant CPD or qualification", assessment: "directly_evidenced", evidenceIds: [6], interpretation: "The Education / CPD source explicitly records a completed accredited certificate.", gap: "No material gap in the supplied evidence." }] });
    const [report] = await mapEvidenceToRequirements([{ requirementId: 4, criterion: "Evidence of relevant CPD", category: "Qualifications" }], evidence);
    expect(report).toMatchObject({ assessment: "directly_evidenced", evidenceIds: [6] });
    const request = vi.mocked(invokeLLM).mock.calls[0]?.[0];
    const userMessage = request?.messages.find((message: any) => message.role === "user")?.content ?? "";
    expect(userMessage).toContain("explicit_qualification_or_cpd");
    expect(userMessage).toContain('"id":6');
  });

  it("extracts explicit structured Education and CPD entries as high-priority evidence during fallback processing", async () => {
    vi.mocked(invokeLLM).mockRejectedValueOnce(new Error("temporary model failure"));
    const items = await extractEvidenceItems("CV\n\nEducation / CPD\n- Completed Advanced HIV Practice Certificate\n- Completed independent prescribing course");
    expect(items).toEqual(expect.arrayContaining([
      expect.objectContaining({ statement: "Completed Advanced HIV Practice Certificate", category: "Qualification", evidenceType: "Explicit qualification / CPD", confidence: "high" }),
      expect.objectContaining({ statement: "Completed independent prescribing course", category: "Qualification", evidenceType: "Explicit qualification / CPD", confidence: "high" }),
    ]));
  });
});
