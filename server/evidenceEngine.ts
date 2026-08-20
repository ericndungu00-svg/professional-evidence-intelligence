import mammoth from "mammoth";
import { invokeLLM } from "./_core/llm";

export type ParsedUpload = { text: string; status: "ready" | "needs_review"; message?: string };
export type ExtractedItemDraft = {
  statement: string;
  excerpt: string;
  paragraphIndex: number;
  category: string;
  evidenceType: string;
  outcome: string | null;
  confidence: "high" | "medium" | "low";
};
export type RequirementDraft = { category: string; criterion: string; paragraphIndex: number; ordinal: number };

const MAX_TEXT_CHARS = 60000;
const MODEL = "claude-sonnet-5";
const APPRAISAL_MODEL = "claude-haiku-4-5";

function normalizedText(value: string) {
  return value.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

export function paragraphize(text: string) {
  return normalizedText(text)
    .split(/\n\s*\n|\n(?=[A-Z][^\n]{0,80}:)/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 300);
}

export function locationForParagraph(paragraphIndex: number, paragraphs: string[]) {
  if (!paragraphs[paragraphIndex]) return "Location not established";
  const heading = paragraphs
    .slice(0, paragraphIndex)
    .reverse()
    .find(item => item.length <= 96 && !/[.!?]$/.test(item) && !item.startsWith("-"));
  return heading ? `Section: ${heading.replace(/:$/, "")} · Paragraph ${paragraphIndex + 1}` : `Paragraph ${paragraphIndex + 1}`;
}

export async function parseEvidenceFile(fileName: string, mimeType: string, bytes: Buffer): Promise<ParsedUpload> {
  const lower = fileName.toLowerCase();
  if (mimeType === "text/plain" || lower.endsWith(".txt") || lower.endsWith(".md")) {
    return { text: normalizedText(bytes.toString("utf8")), status: "ready" };
  }
  if (mimeType.includes("wordprocessingml") || lower.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer: bytes });
    return { text: normalizedText(result.value), status: "ready" };
  }
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: bytes });
      const output = await parser.getText();
      await parser.destroy();
      return { text: normalizedText(output.text), status: "ready" };
    } catch {
      return { text: "", status: "needs_review", message: "The PDF was stored but its text could not be extracted. Add a text copy for analysis." };
    }
  }
  return { text: "", status: "needs_review", message: "This file was stored but needs a TXT, PDF, or DOCX copy for analysis." };
}

function fallbackExplicitQualifications(paragraphs: string[]): ExtractedItemDraft[] {
  return paragraphs.flatMap((paragraph, paragraphIndex) => {
    if (!/(?:education|cpd|professional development|qualification|certification|training|courses?)/i.test(paragraph)) return [];
    const rows = paragraph.split("\n").map(row => row.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
    return rows.filter(row => /(?:completed|certificate|certification|qualified|course|training|degree|diploma|module|prescrib)/i.test(row)).map(row => ({
      statement: row.slice(0, 240), excerpt: paragraph, paragraphIndex, category: "Qualification", evidenceType: "Explicit qualification / CPD", outcome: null, confidence: "high" as const,
    }));
  });
}

function fallbackEvidence(text: string): ExtractedItemDraft[] {
  const paragraphs = paragraphize(text);
  const qualifications = fallbackExplicitQualifications(paragraphs);
  const general = paragraphs
    .filter(paragraph => paragraph.length > 30)
    .slice(0, 16)
    .map((excerpt, paragraphIndex) => ({
      statement: excerpt.slice(0, 240),
      excerpt,
      paragraphIndex,
      category: "Professional evidence",
      evidenceType: "Documented activity",
      outcome: /\d+\s*(days|%|patients|colleagues)/i.test(excerpt) ? excerpt : null,
      confidence: "medium" as const,
    }));
  return [...qualifications, ...general].slice(0, 16);
}

export async function extractEvidenceItems(text: string): Promise<ExtractedItemDraft[]> {
  const paragraphs = paragraphize(text);
  const source = paragraphs.map((item, index) => `[${index}] ${item}`).join("\n\n").slice(0, MAX_TEXT_CHARS);
  if (!source) return [];
  try {
    const response = await invokeLLM({
      model: MODEL,
      messages: [
        { role: "system", content: "You extract only directly documented professional evidence. Never infer responsibility, leadership, causality, ownership, dates, outcomes, or source locations that are not explicit. Every item must quote or closely paraphrase one numbered source paragraph and identify its exact paragraphIndex. When a document contains structured Education, Qualifications, Certification, Training, Courses, or CPD sections, extract each explicit completed qualification, certificate, course, or training entry as its own atomic item where possible. Label these category Qualification or Professional development and evidenceType Explicit qualification / CPD. Do not replace them with general statements about learning, innovation, or interest. Return JSON only." },
        { role: "user", content: `Extract up to 16 atomic evidence items from this document. Retain the source wording in excerpt. Categories can include clinical practice, leadership, teaching, quality improvement, communication, qualification, or professional development. Prioritise explicit Education / CPD entries over generic learning statements.\n\n${source}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "evidence_items",
          strict: true,
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    statement: { type: "string" }, excerpt: { type: "string" }, paragraphIndex: { type: "integer" }, category: { type: "string" }, evidenceType: { type: "string" }, outcome: { type: ["string", "null"] }, confidence: { type: "string", enum: ["high", "medium", "low"] },
                  },
                  required: ["statement", "excerpt", "paragraphIndex", "category", "evidenceType", "outcome", "confidence"],
                  additionalProperties: false,
                },
              },
            },
            required: ["items"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices[0]?.message.content;
    const result = typeof content === "string" ? JSON.parse(content) : null;
    const items = Array.isArray(result?.items) ? result.items : [];
    const validated = items
      .filter((item: ExtractedItemDraft) => Number.isInteger(item.paragraphIndex) && paragraphs[item.paragraphIndex] && item.excerpt.length > 0)
      .map((item: ExtractedItemDraft) => ({ ...item, excerpt: paragraphs[item.paragraphIndex] }));
    return validated.length ? validated : fallbackEvidence(text);
  } catch {
    return fallbackEvidence(text);
  }
}

function fallbackRequirements(text: string): RequirementDraft[] {
  let category = "Target requirement";
  let ordinal = 1;
  return paragraphize(text).flatMap((paragraph, paragraphIndex) => {
    const rows = paragraph.split("\n").map(row => row.trim()).filter(Boolean);
    return rows.flatMap(row => {
      if (!row.startsWith("-") && row.length < 80 && !/[.!?]$/.test(row)) { category = row.replace(/:$/, ""); return []; }
      if (row.startsWith("-")) return [{ category, criterion: row.replace(/^-\s*/, ""), paragraphIndex, ordinal: ordinal++ }];
      return [];
    });
  });
}

export async function extractRequirements(text: string): Promise<RequirementDraft[]> {
  const paragraphs = paragraphize(text);
  const source = paragraphs.map((item, index) => `[${index}] ${item}`).join("\n\n").slice(0, MAX_TEXT_CHARS);
  if (!source) return [];
  try {
    const response = await invokeLLM({
      model: MODEL,
      messages: [
        { role: "system", content: "You extract explicit selection criteria from a target specification. Preserve the criterion faithfully and use only exact numbered source paragraphs. Do not add implied criteria. Return JSON only." },
        { role: "user", content: `Extract each individual requirement with its group heading and numbered source paragraph.\n\n${source}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "target_requirements",
          strict: true,
          schema: {
            type: "object",
            properties: { requirements: { type: "array", items: { type: "object", properties: { category: { type: "string" }, criterion: { type: "string" }, paragraphIndex: { type: "integer" }, ordinal: { type: "integer" } }, required: ["category", "criterion", "paragraphIndex", "ordinal"], additionalProperties: false } } },
            required: ["requirements"], additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices[0]?.message.content;
    const result = typeof content === "string" ? JSON.parse(content) : null;
    const requirements = Array.isArray(result?.requirements) ? result.requirements : [];
    const validated = requirements.filter((item: RequirementDraft) => Number.isInteger(item.paragraphIndex) && paragraphs[item.paragraphIndex] && item.criterion.trim());
    return validated.length ? validated : fallbackRequirements(text);
  } catch {
    return fallbackRequirements(text);
  }
}

export type MappingInput = { requirementId: number; criterion: string; category: string };
export type EvidenceInput = { id: number; statement: string; excerpt: string; source: string; location: string; category: string; evidenceType: string };
export type EvidenceAssessmentStatus = "directly_evidenced" | "indirectly_relevantly_evidenced" | "inferred" | "not_found" | "contradicted" | "demonstrated" | "partial" | "unsupported";
export type ComponentAssessment = { component: string; assessment: Exclude<EvidenceAssessmentStatus, "demonstrated" | "partial" | "unsupported">; evidenceIds: number[]; interpretation: string; gap: string };
export type MappingDraft = { requirementId: number; assessment: EvidenceAssessmentStatus; strength: "strong" | "moderate" | "weak" | "not_demonstrated" | "contradicted"; evidenceIds: number[]; interpretation: string; gap: string; nextStep: string | null; components?: ComponentAssessment[] };
export type LensFinding = { title: string; statement: string; evidenceIds: number[]; qualification: string; action: string | null };
export type AppraisalReport = { objective: "B"; documentedAchievements: LensFinding[]; documentedImpact: LensFinding[]; evidenceLimitations: LensFinding[]; developmentThemes: LensFinding[]; evidenceGroundedObjectives: LensFinding[]; suggestedEvidenceToRetain: LensFinding[] };
export const appraisalSections = ["documentedAchievements", "documentedImpact", "evidenceLimitations", "developmentThemes", "evidenceGroundedObjectives", "suggestedEvidenceToRetain"] as const;
type AppraisalSection = (typeof appraisalSections)[number];

export class AppraisalGenerationError extends Error {
  constructor(public readonly reason: "api_failure" | "timeout" | "non_string_response" | "truncated_response" | "malformed_json" | "invalid_schema" | "empty_report" | "unlinked_report") {
    super(`Objective B generation failed: ${reason}`);
    this.name = "AppraisalGenerationError";
  }
}
export type FormalResponsibilityInput = { responsibilityId: number; responsibility: string; category: string; source: string; location: string };
export type JobEvaluationAlignment = "aligned" | "potentially_broader_responsibility" | "potentially_narrower_responsibility" | "insufficient_evidence" | "unclear_ambiguous";
export type JobEvaluationComparison = { responsibilityId: number; documentedActualActivity: string; alignment: JobEvaluationAlignment; evidenceIds: number[]; qualification: string; discussionPoint: string; strengtheningEvidence: string };
export type JobEvaluationReport = { objective: "C"; comparisons: JobEvaluationComparison[]; questionsForDiscussion: LensFinding[] };
export type ObjectiveReport = { objective: "A"; mappings: MappingDraft[] } | AppraisalReport | JobEvaluationReport;

const MAX_APPRAISAL_ITEMS = 24;
const MAX_APPRAISAL_PRIMARY_ITEMS = 12;
const MAX_APPRAISAL_FIELD_CHARS = 260;
const APPRAISAL_ATTEMPT_TIMEOUT_MS = 25_000;

function selectAppraisalEvidence(evidence: EvidenceInput[]) {
  const ranked = [...evidence].sort((left, right) => Number(evidencePriority(right) === "explicit_qualification_or_cpd") - Number(evidencePriority(left) === "explicit_qualification_or_cpd"));
  const selected: EvidenceInput[] = [];
  const selectedIds = new Set<number>();
  const categories = new Set<string>();
  for (const item of ranked) {
    const category = item.category.trim().toLowerCase();
    if (!categories.has(category)) {
      selected.push(item);
      selectedIds.add(item.id);
      categories.add(category);
    }
  }
  for (const item of ranked) {
    if (selected.length >= MAX_APPRAISAL_ITEMS) break;
    if (!selectedIds.has(item.id)) {
      selected.push(item);
      selectedIds.add(item.id);
    }
  }
  return selected.slice(0, MAX_APPRAISAL_ITEMS);
}

function sourceOnlyAppraisal(evidence: EvidenceInput[]): AppraisalReport {
  const selected = selectAppraisalEvidence(evidence);
  const sourceName = (item: EvidenceInput) => item.source || "the supplied source";
  const activity = (item: EvidenceInput) => item.statement.replace(/\s+/g, " ").trim();
  const finding = (item: EvidenceInput, title: string, statement: string, qualification: string, action: string | null): LensFinding => ({ title, statement, evidenceIds: [item.id], qualification, action });
  const achievementItems = selected.slice(0, 3);
  const impactItems = selected.filter(item => /\b(?:reduc|improv|increas|decreas|outcome|result|impact|%|days?|patients?)\b/i.test(`${item.statement} ${item.excerpt}`)).slice(0, 3);
  const developmentItems = selected.filter(item => /qualification|training|course|cpd|development|certificate|learning/i.test(`${item.category} ${item.evidenceType} ${item.statement}`)).slice(0, 3);
  const objectiveItems = [...developmentItems, ...selected].filter((item, index, items) => items.findIndex(candidate => candidate.id === item.id) === index).slice(0, 3);
  const retainedItems = selected.slice(0, 3);

  return {
    objective: "B",
    documentedAchievements: achievementItems.map(item => finding(item, "Documented professional activity", `${sourceName(item)} records: ${activity(item)}`, "This is reported as documented activity only; the source does not by itself establish wider ownership, scope, or impact.", null)),
    documentedImpact: impactItems.map(item => finding(item, "Potentially relevant documented outcome", `${sourceName(item)} records: ${activity(item)}`, "The source is retained as outcome-relevant evidence; it does not by itself establish individual causation unless that is stated explicitly.", null)),
    evidenceLimitations: selected.slice(0, 2).map(item => finding(item, "Evidence scope limitation", `${sourceName(item)} records: ${activity(item)}`, "This individual source should not be taken alone as evidence of sustained responsibility, formal leadership, or individual causation beyond what it explicitly states.", "Retain corroborating records that establish role, duration, scope, and outcomes where relevant.")),
    developmentThemes: developmentItems.map(item => finding(item, "Documented development evidence", `${sourceName(item)} records: ${activity(item)}`, "The source supports documented learning or development activity; it does not automatically establish application or competency beyond the stated evidence.", "Keep dated completion evidence and a brief record of how the learning was applied.")),
    evidenceGroundedObjectives: objectiveItems.map(item => finding(item, "Evidence-building objective", `Use the documented activity in ${sourceName(item)} as a starting point for a dated evidence plan.`, "This is a future evidence-building objective, not a claim of current capability or achievement.", "Agree a measurable next step, retain supervisor or service feedback where appropriate, and record the outcome and the user’s role.")),
    suggestedEvidenceToRetain: retainedItems.map(item => finding(item, "Retain source evidence", `Retain ${sourceName(item)} evidence covering: ${activity(item)}`, "The item is retained for traceability to the supplied library only.", "Keep the original dated document and any linked outcome, feedback, or role-scope record.")),
  };
}

async function invokeAppraisalWithinDeadline(params: Parameters<typeof invokeLLM>[0]) {
  const startedAt = Date.now();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = await Promise.race([
      invokeLLM(params),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new AppraisalGenerationError("timeout")), APPRAISAL_ATTEMPT_TIMEOUT_MS);
      }),
    ]);
    console.info("[Objective B] appraisal generation completed", { durationMs: Date.now() - startedAt });
    return response;
  } catch (error) {
    console.error("[Objective B] appraisal generation ended", { durationMs: Date.now() - startedAt, reason: error instanceof AppraisalGenerationError ? error.reason : "api_failure" });
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function parseStructuredResponse(response: Awaited<ReturnType<typeof invokeLLM>>) {
  const content = response.choices[0]?.message.content;
  return typeof content === "string" ? JSON.parse(content) : null;
}

function allowedFinding(item: LensFinding, evidenceIds: Set<number>): LensFinding {
  return { ...item, evidenceIds: item.evidenceIds.filter(id => evidenceIds.has(id)) };
}

function isLensFinding(value: unknown): value is LensFinding {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.title === "string" && typeof item.statement === "string" && Array.isArray(item.evidenceIds) && item.evidenceIds.every(id => Number.isInteger(id)) && typeof item.qualification === "string" && (typeof item.action === "string" || item.action === null);
}

function parseAppraisalJson(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1]?.trim();
  const candidate = fenced ?? trimmed;
  try {
    return JSON.parse(candidate) as Record<string, unknown>;
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
    throw new Error("No complete JSON object in appraisal response");
  }
}

function evidencePriority(item: EvidenceInput) {
  return /(?:qualification|certificate|certification|education|training|cpd|course|degree|diploma|prescrib)/i.test(`${item.category} ${item.evidenceType} ${item.statement} ${item.excerpt}`) ? "explicit_qualification_or_cpd" : "standard";
}

function normalizeComponent(component: ComponentAssessment, allowedEvidence: Set<number>, evidenceById: Map<number, EvidenceInput>): ComponentAssessment {
  const evidenceIds = (component.evidenceIds ?? []).filter(id => allowedEvidence.has(id));
  const statuses: ComponentAssessment["assessment"][] = ["directly_evidenced", "indirectly_relevantly_evidenced", "inferred", "not_found", "contradicted"];
  let assessment = statuses.includes(component.assessment) ? component.assessment : "not_found";
  if (["directly_evidenced", "indirectly_relevantly_evidenced", "inferred", "contradicted"].includes(assessment) && !evidenceIds.length) assessment = "not_found";
  const label = component.component.trim() || "Unspecified component";
  const sourceText = evidenceIds.map(id => evidenceById.get(id)).filter(Boolean).map(item => `${item?.statement} ${item?.excerpt}`).join(" ").toLowerCase();
  const lacksFormalSeniorSupport = /(?:senior support|role model|role modelling|role modeling)/i.test(label) && /(?:informal|advice|advised|guidance|general leadership)/i.test(sourceText) && !/(?:senior support|role model|role modelling|role modeling|designated senior|formal mentor|supervis(?:e|ion|ory))/i.test(sourceText);
  const lacksFormalPolicyAuthority = /(?:policy.*(?:develop|lead)|(?:develop|lead).*policy|formal policy)/i.test(label) && /(?:initiated|originated|contributed|participated|support(?:ed)? implementation|implemented)/i.test(sourceText) && !/(?:policy (?:approved|approval|author|owner|lead)|authorised policy|formal policy responsibility)/i.test(sourceText);
  if (assessment === "directly_evidenced" && (lacksFormalSeniorSupport || lacksFormalPolicyAuthority)) {
    assessment = "indirectly_relevantly_evidenced";
  }
  const gap = assessment === "indirectly_relevantly_evidenced" && (lacksFormalSeniorSupport || lacksFormalPolicyAuthority)
    ? "The selected source is relevant but does not explicitly document the formal responsibility stated in this component."
    : component.gap;
  return { component: label, assessment, evidenceIds, interpretation: component.interpretation, gap };
}

function overallAssessment(components: ComponentAssessment[], fallback: EvidenceAssessmentStatus): EvidenceAssessmentStatus {
  if (!components.length) return fallback;
  if (components.every(item => item.assessment === "directly_evidenced")) return "directly_evidenced";
  if (components.some(item => item.assessment === "directly_evidenced" || item.assessment === "indirectly_relevantly_evidenced")) return "indirectly_relevantly_evidenced";
  if (components.some(item => item.assessment === "inferred")) return "inferred";
  if (components.some(item => item.assessment === "contradicted")) return "contradicted";
  return "not_found";
}

function strengthFor(assessment: EvidenceAssessmentStatus): MappingDraft["strength"] {
  if (assessment === "directly_evidenced" || assessment === "demonstrated") return "strong";
  if (assessment === "indirectly_relevantly_evidenced" || assessment === "partial") return "moderate";
  if (assessment === "inferred") return "weak";
  if (assessment === "contradicted" || assessment === "unsupported") return "contradicted";
  return "not_demonstrated";
}

export async function analyseAnnualAppraisal(evidence: EvidenceInput[]): Promise<AppraisalReport> {
  const compactEvidence = selectAppraisalEvidence(evidence)
    .slice(0, MAX_APPRAISAL_PRIMARY_ITEMS)
    .map(item => ({ id: item.id, statement: item.statement.slice(0, MAX_APPRAISAL_FIELD_CHARS), excerpt: item.excerpt.slice(0, MAX_APPRAISAL_FIELD_CHARS), source: item.source, location: item.location, category: item.category, evidenceType: item.evidenceType }));
  try {
    const response = await invokeAppraisalWithinDeadline({
      model: APPRAISAL_MODEL,
      maxTokens: 900,
      messages: [
        { role: "system", content: "Create a concise, cautious annual appraisal report from supplied evidence only. Return only JSON with exactly six arrays: documentedAchievements, documentedImpact, evidenceLimitations, developmentThemes, evidenceGroundedObjectives, suggestedEvidenceToRetain. Include exactly one concise source-linked finding in each array. Every item must have title, statement, evidenceIds, qualification, and action. Do not use a wrapper, metadata, headings, markdown, prose, or alternative keys. Keep documented contribution, project-level outcome, and evidence limitation separate. Never invent citations, upgrade participation to ownership, or attribute a team outcome to one individual without explicit source support." },
        { role: "user", content: `Use only supplied evidence IDs. Do not infer absence from evidence that was not selected.\n\nEvidence:\n${JSON.stringify(compactEvidence)}` },
      ],
      response_format: { type: "text" },
    });
    const parseAndValidate = (candidate: Awaited<ReturnType<typeof invokeLLM>>) => {
      if (candidate.choices[0]?.finish_reason === "length") throw new AppraisalGenerationError("truncated_response");
      const content = candidate.choices[0]?.message.content;
      if (typeof content !== "string") throw new AppraisalGenerationError("non_string_response");
      let parsed: Record<string, unknown>;
      try {
        parsed = parseAppraisalJson(content);
      } catch {
        throw new AppraisalGenerationError("malformed_json");
      }
      if (!parsed || typeof parsed !== "object" || appraisalSections.some(key => !Array.isArray(parsed[key]) || !(parsed[key] as unknown[]).every(isLensFinding))) throw new AppraisalGenerationError("invalid_schema");
      return parsed;
    };
    let result: Record<string, unknown>;
    try {
      result = parseAndValidate(response);
    } catch (error) {
      if (!(error instanceof AppraisalGenerationError) || !["malformed_json", "invalid_schema"].includes(error.reason)) throw error;
      try {
        const fallbackResponse = await invokeAppraisalWithinDeadline({
          model: APPRAISAL_MODEL,
          maxTokens: 700,
          messages: [
            { role: "system", content: "Return only JSON with exactly six arrays: documentedAchievements, documentedImpact, evidenceLimitations, developmentThemes, evidenceGroundedObjectives, suggestedEvidenceToRetain. Include exactly one concise finding in each array. Each finding must have title, statement, evidenceIds, qualification, and action. Do not use a wrapper, markdown, headings, metadata, or alternate keys. Use supplied evidence only and do not invent citations or ownership." },
            { role: "user", content: `Create a concise annual appraisal report from this representative source-linked evidence set. Use only listed IDs.\n\nEvidence:\n${JSON.stringify(compactEvidence.slice(0, 8))}` },
          ],
          response_format: { type: "text" },
        });
        result = parseAndValidate(fallbackResponse);
      } catch {
        throw error;
      }
    }
    const allowed = new Set(evidence.map(item => item.id));
    const report = appraisalSections.reduce((next, key) => ({ ...next, [key]: (result[key] as LensFinding[]).map(item => allowedFinding(item, allowed)) }), { objective: "B" as const } as AppraisalReport);
    const findings = appraisalSections.flatMap(key => report[key] as LensFinding[]);
    if (!findings.length) throw new AppraisalGenerationError("empty_report");
    if (!findings.some(item => item.evidenceIds.length > 0)) throw new AppraisalGenerationError("unlinked_report");
    return report;
  } catch (error) {
    const reason = error instanceof AppraisalGenerationError ? error.reason : "api_failure";
    if (reason === "api_failure" || reason === "timeout") {
      console.warn("[Objective B] using source-only fallback after remote generation failure", { reason });
      return sourceOnlyAppraisal(evidence);
    }
    throw error;
  }
}

export async function analyseJobEvaluation(responsibilities: FormalResponsibilityInput[], evidence: EvidenceInput[]): Promise<JobEvaluationReport> {
  const compactEvidence = evidence.map(item => ({ id: item.id, statement: item.statement, excerpt: item.excerpt, source: item.source, location: item.location, category: item.category, evidenceType: item.evidenceType }));
  const fallback: JobEvaluationReport = { objective: "C", comparisons: responsibilities.map(responsibility => ({ responsibilityId: responsibility.responsibilityId, documentedActualActivity: "No actual activity has been matched to this formal responsibility.", alignment: "insufficient_evidence", evidenceIds: [], qualification: "The supplied library is insufficient to determine alignment or divergence for this responsibility.", discussionPoint: "Ask whether this responsibility is routinely undertaken and how it is evidenced in the formal role.", strengtheningEvidence: "Retain a current role description, work plan, activity record, or corroborated example that directly addresses this responsibility." })), questionsForDiscussion: [] };
  try {
    const response = await invokeLLM({
      model: MODEL,
      reasoning: { effort: "low" },
      messages: [
        { role: "system", content: "You prepare a cautious job-evaluation preparation report by comparing a supplied current/formal job description with separately supplied documented actual activity. This is not a promotion assessment and must never determine an NHS AfC band, entitlement, rebanding, pay, or legal position. For each formal responsibility choose only one neutral outcome: aligned, potentially_broader_responsibility, potentially_narrower_responsibility, insufficient_evidence, or unclear_ambiguous. Do not assume every difference is higher-level work. Never change facts, invent citations, upgrade participation to ownership, or attribute a team outcome to one individual without explicit support. Discussion questions must remain neutral. Return JSON only." },
        { role: "user", content: `Compare each current/formal role responsibility with documented actual activity. Return the documented activity, neutral alignment outcome, qualification, discussion point, and evidence needed. Then add neutral questions for discussion with a manager, HR, formal job-evaluation process, or professional representative. Use only supplied responsibility IDs and evidence IDs.\n\nCurrent/formal role responsibilities:\n${JSON.stringify(responsibilities)}\n\nDocumented actual activity:\n${JSON.stringify(compactEvidence)}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "job_evaluation_preparation", strict: true,
          schema: { type: "object", properties: { comparisons: { type: "array", items: { type: "object", properties: { responsibilityId: { type: "integer" }, documentedActualActivity: { type: "string" }, alignment: { type: "string", enum: ["aligned", "potentially_broader_responsibility", "potentially_narrower_responsibility", "insufficient_evidence", "unclear_ambiguous"] }, evidenceIds: { type: "array", items: { type: "integer" } }, qualification: { type: "string" }, discussionPoint: { type: "string" }, strengtheningEvidence: { type: "string" } }, required: ["responsibilityId", "documentedActualActivity", "alignment", "evidenceIds", "qualification", "discussionPoint", "strengtheningEvidence"], additionalProperties: false } }, questionsForDiscussion: { type: "array", items: { type: "object", properties: { title: { type: "string" }, statement: { type: "string" }, evidenceIds: { type: "array", items: { type: "integer" } }, qualification: { type: "string" }, action: { type: ["string", "null"] } }, required: ["title", "statement", "evidenceIds", "qualification", "action"], additionalProperties: false } } }, required: ["comparisons", "questionsForDiscussion"], additionalProperties: false },
        },
      },
    });
    const result = parseStructuredResponse(response);
    const allowedEvidence = new Set(evidence.map(item => item.id));
    const byResponsibility = new Map<number, JobEvaluationComparison>();
    (Array.isArray(result?.comparisons) ? result.comparisons : []).forEach((item: JobEvaluationComparison) => {
      if (responsibilities.some(responsibility => responsibility.responsibilityId === item.responsibilityId)) byResponsibility.set(item.responsibilityId, { ...item, evidenceIds: item.evidenceIds.filter(id => allowedEvidence.has(id)) });
    });
    return { objective: "C", comparisons: responsibilities.map(responsibility => byResponsibility.get(responsibility.responsibilityId) ?? fallback.comparisons.find(item => item.responsibilityId === responsibility.responsibilityId)!), questionsForDiscussion: Array.isArray(result?.questionsForDiscussion) ? result.questionsForDiscussion.map((item: LensFinding) => allowedFinding(item, allowedEvidence)) : [] };
  } catch {
    return fallback;
  }
}

export async function mapEvidenceToRequirements(requirements: MappingInput[], evidence: EvidenceInput[]): Promise<MappingDraft[]> {
  const compactEvidence = evidence.map(item => ({ id: item.id, statement: item.statement, excerpt: item.excerpt, source: item.source, location: item.location, category: item.category, evidenceType: item.evidenceType, priority: evidencePriority(item) }));
  try {
    const response = await invokeLLM({
      model: MODEL,
      reasoning: { effort: "low" },
      messages: [
        { role: "system", content: "You are a cautious professional-evidence assessor. Assess only supplied evidence. Decompose every multi-part requirement into substantive components that can be checked separately. The overall requirement is directly_evidenced only when every substantive component is directly supported by selected source passages. Use indirectly_relevantly_evidenced when a source is relevant but does not explicitly prove the stated component. Use inferred only when an interpretation is plausible but not directly demonstrated; make the inference explicit and never call it evidence. Use not_found only for absent meaningful source support, and contradicted only when a selected source explicitly conflicts with the component. General leadership is not senior support or role modelling. Initiating an idea is not formal policy development, approval, or policy leadership. Distinguish participation, contribution, implementation support, implementation leadership, and formal policy authority. When a requirement names groups or populations, assess each named population separately; do not use evidence about patients or staff to claim carers or external agencies. For CPD, qualifications, certificates, education, and training, prioritise supplied evidence marked explicit_qualification_or_cpd over general claims about learning, innovation, or interest. Never upgrade participation to ownership or leadership, and do not attribute a project outcome to one person without explicit source support. A missing citation must mean no selected evidence IDs. Return JSON only." },
        { role: "user", content: `Map each requirement to the supplied evidence. Return a component assessment for every substantive element of each requirement, then a cautious overall interpretation. Each component must have one of directly_evidenced, indirectly_relevantly_evidenced, inferred, not_found, or contradicted. Use only supplied evidence IDs. For a gap, say what documentary evidence is missing. For nextStep, recommend an evidence-building action and documentation to retain, not a claim of current experience.\n\nRequirements:\n${JSON.stringify(requirements)}\n\nEvidence:\n${JSON.stringify(compactEvidence)}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "evidence_mapping",
          strict: true,
          schema: {
            type: "object",
            properties: { mappings: { type: "array", items: { type: "object", properties: { requirementId: { type: "integer" }, assessment: { type: "string", enum: ["directly_evidenced", "indirectly_relevantly_evidenced", "inferred", "not_found", "contradicted"] }, strength: { type: "string", enum: ["strong", "moderate", "weak", "not_demonstrated", "contradicted"] }, evidenceIds: { type: "array", items: { type: "integer" } }, interpretation: { type: "string" }, gap: { type: "string" }, nextStep: { type: ["string", "null"] }, components: { type: "array", items: { type: "object", properties: { component: { type: "string" }, assessment: { type: "string", enum: ["directly_evidenced", "indirectly_relevantly_evidenced", "inferred", "not_found", "contradicted"] }, evidenceIds: { type: "array", items: { type: "integer" } }, interpretation: { type: "string" }, gap: { type: "string" } }, required: ["component", "assessment", "evidenceIds", "interpretation", "gap"], additionalProperties: false } } }, required: ["requirementId", "assessment", "strength", "evidenceIds", "interpretation", "gap", "nextStep", "components"], additionalProperties: false } } },
            required: ["mappings"], additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices[0]?.message.content;
    const result = typeof content === "string" ? JSON.parse(content) : null;
    const allowableIds = new Set(evidence.map(item => item.id));
    const returned = Array.isArray(result?.mappings) ? result.mappings : [];
    const byId = new Map<number, MappingDraft>();
    returned.forEach((mapping: MappingDraft) => {
      if (requirements.some(requirement => requirement.requirementId === mapping.requirementId)) {
        const evidenceById = new Map(evidence.map(item => [item.id, item]));
        const components = Array.isArray(mapping.components) ? mapping.components.map(component => normalizeComponent(component, allowableIds, evidenceById)) : [];
        const mappedAssessment = overallAssessment(components, mapping.assessment);
        byId.set(mapping.requirementId, { ...mapping, assessment: mappedAssessment, strength: strengthFor(mappedAssessment), evidenceIds: mapping.evidenceIds.filter(id => allowableIds.has(id)), components });
      }
    });
    return requirements.map(requirement => byId.get(requirement.requirementId) ?? ({ requirementId: requirement.requirementId, assessment: "not_found", strength: "not_demonstrated", evidenceIds: [], interpretation: "No supplied evidence was selected for this criterion.", gap: "The supplied documents do not currently demonstrate this criterion.", nextStep: "Build and retain source documentation that directly demonstrates this criterion.", components: [{ component: requirement.criterion, assessment: "not_found", evidenceIds: [], interpretation: "No supplied source passage directly demonstrates this criterion.", gap: "Retain a source record that directly addresses this criterion." }] }));
  } catch {
    return requirements.map(requirement => ({ requirementId: requirement.requirementId, assessment: "not_found", strength: "not_demonstrated", evidenceIds: [], interpretation: "Automated mapping could not be completed. No conclusion has been inferred.", gap: "Review the source documents manually and add direct evidence where available.", nextStep: "Retain a dated record that directly demonstrates this criterion.", components: [{ component: requirement.criterion, assessment: "not_found", evidenceIds: [], interpretation: "No automated conclusion has been made.", gap: "Review the supplied source documents manually." }] }));
  }
}

export function detectPlainTextConflicts(documents: { id: number; title: string; extractedText: string }[]) {
  const durationPattern = /(?:\b|approximately\s+)(\d+)\s+years?\s+(?:of\s+)?(?:specialist|post-registration)/gi;
  const matches: { value: string; documentId: number; title: string }[] = [];
  documents.forEach(document => {
    Array.from(document.extractedText.matchAll(durationPattern)).forEach(match => {
      matches.push({ value: match[1], documentId: document.id, title: document.title });
    });
  });
  const values = new Set(matches.map(item => item.value));
  if (values.size < 2) return [];
  return [{ type: "conflicting duration", severity: "review" as const, claim: "Experience duration appears inconsistent across supplied documents.", explanation: `The documents record more than one duration (${Array.from(values).join(" and ")} years). Review the source dates and clarify the correct period rather than silently selecting one value.`, evidenceIds: [] }];
}
