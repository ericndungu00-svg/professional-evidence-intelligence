import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  criterionAssessments,
  evidenceAnalyses,
  evidenceContradictions,
  evidenceDocuments,
  evidenceProfiles,
  extractedEvidence,
  targetRequirements,
} from "../drizzle/schema";
import { createUser, getDb, getTargetDocument, getUserByEmail, getWorkspace, touchUserLastSignedIn } from "./db";
import { DEMO_LABEL, demoAssessments, demoContradictions, demoCurrentRole, demoCurrentRoleResponsibilities, demoDocuments, demoEvidence, demoObjectiveReports, demoProfile, demoRequirements, demoTarget } from "./demoData";
import { analyseAnnualAppraisal, analyseJobEvaluation, AppraisalGenerationError, detectPlainTextConflicts, extractEvidenceItems, extractRequirements, locationForParagraph, mapEvidenceToRequirements, MappingDraft, paragraphize, parseEvidenceFile } from "./evidenceEngine";
import { storagePut } from "./storage";
import { COOKIE_NAME } from "@shared/const";
import { clearSessionCookie, createSession, destroySessionToken, hashPassword, sanitizeUser, setSessionCookie, verifyPassword } from "./_core/auth";
import { parse as parseCookieHeader } from "cookie";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const disclaimer = "This tool analyses supplied professional evidence and provides decision support only. It does not determine NHS AfC banding, employment eligibility, legal rights, job-evaluation outcomes, or professional competence.";
const objectiveSchema = z.enum(["A", "B", "C"]);
const guestAnalysisSchema = z.object({
  currentRole: z.string().min(2).max(255).optional(),
  profession: z.string().min(2).max(255).optional(),
  targetRole: z.string().min(2).max(255).optional(),
  ownClaims: z.string().max(12000).optional(),
  evidenceText: z.string().min(40).max(50000),
  targetText: z.string().min(40).max(50000),
});

function asId(result: unknown) {
  const row = Array.isArray(result) ? result[0] : result;
  return Number((row as { insertId?: number | bigint })?.insertId);
}

function sanitizeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "document";
}

function buildSummary(objective: "A" | "B" | "C", assessments: { assessment: string; strength: string; gap: string; nextStep: string | null }[]) {
  const direct = assessments.filter(item => item.assessment === "directly_evidenced" || item.assessment === "demonstrated").length;
  const relevant = assessments.filter(item => item.assessment === "indirectly_relevantly_evidenced" || item.assessment === "partial").length;
  const inferred = assessments.filter(item => item.assessment === "inferred").length;
  const notFound = assessments.filter(item => item.assessment === "not_found").length;
  const contradicted = assessments.filter(item => item.assessment === "contradicted" || item.assessment === "unsupported").length;
  if (objective === "A") return `Objective A — promotion and target role mapping. The evidence map records ${direct} directly evidenced criteria, ${relevant} indirectly or relevantly evidenced criteria, ${inferred} inference-only findings, ${notFound} criteria not found in the supplied library, and ${contradicted} contradicted criteria. This is evidence coverage, not a readiness score or employment decision.`;
  if (objective === "B") return `Objective B — annual appraisal summary. The supplied documents contain ${direct} directly evidenced areas. Development attention should focus on the ${relevant + inferred + notFound + contradicted} criteria that are relevant only, inferred, absent, or contradicted in the current library. Proposed objectives are evidence-building actions, not claims about current performance.`;
  return `Objective C — job evaluation preparation. The analysis identifies documented areas for discussion only. It does not determine an NHS AfC band, job-evaluation outcome, contractual entitlement, or legal position. Any divergence should be considered through the appropriate formal process.`;
}

function buildObjectiveSummary(objective: "A" | "B" | "C", report: any, mappings: { assessment: string; strength: string; gap: string; nextStep: string | null }[]) {
  if (objective === "A") return buildSummary("A", mappings);
  if (objective === "B") return `Objective B — annual appraisal summary. The report records ${report.documentedAchievements.length} documented achievement areas, ${report.documentedImpact.length} documented impact findings, ${report.evidenceLimitations.length} evidence limitations, ${report.developmentThemes.length} development themes, and ${report.evidenceGroundedObjectives.length} future evidence-building objectives. This is an appraisal evidence summary, not a target-role assessment.`;
  const aligned = report.comparisons.filter((item: any) => item.alignment === "aligned").length;
  const broader = report.comparisons.filter((item: any) => item.alignment === "potentially_broader_responsibility").length;
  const narrower = report.comparisons.filter((item: any) => item.alignment === "potentially_narrower_responsibility").length;
  const insufficient = report.comparisons.filter((item: any) => item.alignment === "insufficient_evidence").length;
  const unclear = report.comparisons.filter((item: any) => item.alignment === "unclear_ambiguous").length;
  return `Objective C — job evaluation preparation. The report compares ${report.comparisons.length} current-role responsibilities with documented actual activities: ${aligned} aligned, ${broader} potentially broader, ${narrower} potentially narrower, ${insufficient} with insufficient evidence, and ${unclear} unclear or ambiguous. It is for discussion only and does not determine NHS AfC banding, rebanding, entitlement, pay, or legal position.`;
}

async function persistDocument(args: {
  userId: number;
  profileId: number | null;
  title: string;
  fileName: string;
  mimeType: string;
  documentType: "evidence" | "target" | "current_role";
  sourceKind: string;
  extractedText: string;
  storageKey?: string | null;
  fileUrl?: string | null;
  extractionStatus?: "ready" | "needs_review" | "failed";
  isDemo?: "yes" | "no";
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The evidence library is temporarily unavailable." });
  const result = await db.insert(evidenceDocuments).values({
    userId: args.userId, profileId: args.profileId, title: args.title, fileName: args.fileName, mimeType: args.mimeType, documentType: args.documentType, sourceKind: args.sourceKind, storageKey: args.storageKey ?? null, fileUrl: args.fileUrl ?? null, extractedText: args.extractedText, extractionStatus: args.extractionStatus ?? "ready", isDemo: args.isDemo ?? "no",
  });
  return asId(result);
}

type GuestAnalysisResult = {
  isGuest: true;
  label: string;
  disclaimer: string;
  summary: string;
  profile: { id: string; currentRole: string; profession: string; targetRole: string; ownClaims: string | null };
  documents: { id: string; title: string; fileName: string; sourceKind: string; documentType: string; extractedText: string; extractionStatus: string; isDemo: string }[];
  targetDocument: { id: string; title: string; fileName: string; sourceKind: string; documentType: string; extractedText: string; extractionStatus: string; isDemo: string };
  requirements: { id: number; category: string; criterion: string; sourceLocation: string }[];
  evidence: { id: number; documentId: string; statement: string; excerpt: string; sourceLocation: string; category: string; evidenceType: string; confidence: string }[];
  assessments: MappingDraft[];
  contradictions: { id: number; type: string; severity: "review" | "unsupported"; claim: string; explanation: string; evidenceIds: number[] }[];
};

type GuestAnalysisJob =
  | { status: "processing" }
  | { status: "complete"; result: GuestAnalysisResult }
  | { status: "failed"; error: string };

// Guest analyses are explicitly ephemeral (never persisted to the database),
// so an in-memory job store matches their lifetime — this assumes a single
// long-lived server process; a multi-instance deployment would need a shared
// store (Redis, or a DB table) instead.
const guestJobs = new Map<string, GuestAnalysisJob>();
const GUEST_JOB_TTL_MS = 15 * 60 * 1000;

function scheduleGuestJobCleanup(jobId: string) {
  setTimeout(() => guestJobs.delete(jobId), GUEST_JOB_TTL_MS).unref();
}

// Runs the multi-call LLM pipeline for a guest analysis in the background so
// the startAnalyse mutation can return immediately — see the runAnalysisJob
// comment below for why this matters (avoiding a single long blocking
// request that can be killed by a platform/proxy timeout).
async function runGuestAnalysisJob(jobId: string, input: z.infer<typeof guestAnalysisSchema>) {
  try {
    const evidenceParagraphs = paragraphize(input.evidenceText);
    const targetParagraphs = paragraphize(input.targetText);
    const [items, requirements] = await Promise.all([extractEvidenceItems(input.evidenceText), extractRequirements(input.targetText)]);
    if (!items.length) throw new Error("No extractable evidence was found in the supplied evidence text.");
    if (!requirements.length) throw new Error("No individual criteria were found in the target specification.");
    const evidence = items.map((item, index) => ({
      id: index + 1,
      documentId: "guest-evidence",
      statement: item.statement,
      excerpt: item.excerpt,
      sourceLocation: locationForParagraph(item.paragraphIndex, evidenceParagraphs),
      category: item.category,
      evidenceType: item.evidenceType,
      confidence: item.confidence,
    }));
    const criteria = requirements.map((item, index) => ({
      id: index + 1,
      category: item.category,
      criterion: item.criterion,
      sourceLocation: locationForParagraph(item.paragraphIndex, targetParagraphs),
    }));
    const mappings = await mapEvidenceToRequirements(
      criteria.map(item => ({ requirementId: item.id, criterion: item.criterion, category: item.category })),
      evidence.map(item => ({ id: item.id, statement: item.statement, excerpt: item.excerpt, source: "Pasted professional evidence", location: item.sourceLocation, category: item.category, evidenceType: item.evidenceType })),
    );
    const sourceDocument = { id: 1, title: "Pasted professional evidence", extractedText: input.evidenceText };
    const conflicts: { type: string; severity: "review" | "unsupported"; claim: string; explanation: string; evidenceIds: number[] }[] = detectPlainTextConflicts([sourceDocument]);
    const projectLeadClaim = input.ownClaims && /\b(?:led|lead)\b[^.]{0,100}\b(?:project|audit|improvement|QI)\b/i.test(input.ownClaims);
    const participantEvidence = evidence.filter(item => /participant in the project team|does not identify .* project lead|not identified as project lead/i.test(item.excerpt));
    if (projectLeadClaim && participantEvidence.length) {
      conflicts.push({ type: "Claim unsupported by source", severity: "unsupported", claim: "The submitted claim describes project leadership.", explanation: "The submitted source text identifies participation and does not establish project leadership. The claim is not treated as demonstrated without direct leadership evidence.", evidenceIds: participantEvidence.map(item => item.id) });
    }
    const result: GuestAnalysisResult = {
      isGuest: true,
      label: "Guest analysis — this session is not saved.",
      disclaimer,
      summary: buildSummary("A", mappings),
      profile: { id: "guest-profile", currentRole: input.currentRole ?? "Guest professional", profession: input.profession ?? "Professional", targetRole: input.targetRole ?? "Target role", ownClaims: input.ownClaims ?? null },
      documents: [
        { id: "guest-evidence", title: "Pasted professional evidence", fileName: "not-saved.txt", sourceKind: "Guest input", documentType: "evidence", extractedText: input.evidenceText, extractionStatus: "ready", isDemo: "no" },
        { id: "guest-target", title: "Pasted target specification", fileName: "not-saved-target.txt", sourceKind: "Guest input", documentType: "target", extractedText: input.targetText, extractionStatus: "ready", isDemo: "no" },
      ],
      targetDocument: { id: "guest-target", title: "Pasted target specification", fileName: "not-saved-target.txt", sourceKind: "Guest input", documentType: "target", extractedText: input.targetText, extractionStatus: "ready", isDemo: "no" },
      requirements: criteria,
      evidence,
      assessments: mappings,
      contradictions: conflicts.map((item, index) => ({ id: index + 1, ...item })),
    };
    guestJobs.set(jobId, { status: "complete", result });
  } catch (error) {
    console.error("[Guest analysis] background job failed", { jobId, error });
    guestJobs.set(jobId, { status: "failed", error: error instanceof Error ? error.message : "Guest analysis failed unexpectedly." });
  }
}

// The analysis pipeline makes several sequential LLM calls (extract, map,
// appraise) which can take longer than a typical platform/proxy timeout
// (Manus hit this as a 524 gateway timeout on longer submissions). Rather
// than blocking the runAnalysis mutation's HTTP response on the full
// pipeline, the mutation inserts a "processing" row and returns immediately;
// this function does the actual work in the background and the frontend
// polls analysisStatus until the row's status flips to complete/failed.
async function runAnalysisJob(
  analysisId: number,
  objective: "A" | "B" | "C",
  workspace: Awaited<ReturnType<typeof getWorkspace>>,
  requirements: Awaited<ReturnType<typeof getWorkspace>>["requirements"]
) {
  const db = await getDb();
  if (!db) return;
  try {
    const evidenceWithSources = workspace.evidence.map(item => ({ ...item, source: workspace.documents.find(document => document.id === item.documentId)?.title ?? "Source document" }));
    const lensEvidence = evidenceWithSources.map(item => ({ id: item.id, statement: item.statement, excerpt: item.excerpt, source: item.source, location: item.sourceLocation, category: item.category, evidenceType: item.evidenceType }));
    let mappings: MappingDraft[] = [];
    let objectiveReport: any;
    if (objective === "A") {
      mappings = await mapEvidenceToRequirements(requirements.map(item => ({ requirementId: item.id, criterion: item.criterion, category: item.category })), lensEvidence);
      objectiveReport = { objective: "A", mappings };
      await db.insert(criterionAssessments).values(mappings.map(item => ({ analysisId, requirementId: item.requirementId, assessment: item.assessment, strength: item.strength, evidenceIds: item.evidenceIds, interpretation: item.interpretation, gap: item.gap, nextStep: item.nextStep })));
    } else if (objective === "B") {
      try {
        objectiveReport = await analyseAnnualAppraisal(lensEvidence);
      } catch (error) {
        const reason = error instanceof AppraisalGenerationError ? error.reason : "api_failure";
        const message = `Objective B could not generate a validated, source-linked appraisal report (${reason.replace(/_/g, " ")}). No empty report has been saved. Please try again; if the problem persists, contact support with this message.`;
        console.error("[Objective B] generation failed", { analysisId, reason });
        await db.update(evidenceAnalyses).set({ status: "failed", generatedSummary: message, objectiveReport: null }).where(eq(evidenceAnalyses.id, analysisId));
        return;
      }
    } else {
      objectiveReport = await analyseJobEvaluation(workspace.currentRoleResponsibilities.map(item => ({ responsibilityId: item.id, responsibility: item.criterion, category: item.category, source: workspace.currentRoleDocument?.title ?? "Current role description", location: item.sourceLocation })), lensEvidence);
    }
    const conflicts: { type: string; severity: "review" | "unsupported"; claim: string; explanation: string; evidenceIds: number[] }[] = detectPlainTextConflicts(workspace.documents.filter(document => document.documentType === "evidence"));
    const projectLeadClaim = workspace.profile?.ownClaims && /\b(?:led|lead)\b[^.]{0,100}\b(?:project|audit|improvement|QI)\b/i.test(workspace.profile.ownClaims);
    const participantDocs = workspace.documents.filter(document => /participant in the project team|does not identify .* project lead|not identified as project lead/i.test(document.extractedText));
    if (projectLeadClaim && participantDocs.length) conflicts.push({ type: "Claim unsupported by source", severity: "unsupported", claim: "The profile describes project leadership.", explanation: "The supplied project documentation identifies participation and does not establish project leadership. The claim should not be treated as demonstrated until direct leadership evidence is supplied.", evidenceIds: workspace.evidence.filter(item => participantDocs.some(document => document.id === item.documentId)).map(item => item.id) });
    if (conflicts.length) await db.insert(evidenceContradictions).values(conflicts.map(item => ({ analysisId, ...item })));
    const summary = buildObjectiveSummary(objective, objectiveReport, mappings);
    await db.update(evidenceAnalyses).set({ status: "complete", generatedSummary: summary, objectiveReport }).where(eq(evidenceAnalyses.id, analysisId));
  } catch (error) {
    console.error("[Analysis] background job failed", { analysisId, objective, error });
    await db
      .update(evidenceAnalyses)
      .set({ status: "failed", generatedSummary: "Automated analysis failed unexpectedly. Please try again." })
      .where(eq(evidenceAnalyses.id, analysisId))
      .catch(updateError => console.error("[Analysis] failed to record failure status", { analysisId, updateError }));
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => (opts.ctx.user ? sanitizeUser(opts.ctx.user) : null)),
    signup: publicProcedure.input(z.object({
      email: z.string().trim().toLowerCase().email().max(320),
      password: z.string().min(8).max(200),
      name: z.string().trim().min(1).max(120).optional(),
    })).mutation(async ({ ctx, input }) => {
      const existing = await getUserByEmail(input.email);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
      const passwordHash = await hashPassword(input.password);
      const user = await createUser({ email: input.email, passwordHash, name: input.name ?? null });
      const { token, expiresAt } = await createSession(user.id);
      setSessionCookie(ctx.req, ctx.res, token, expiresAt);
      return sanitizeUser(user);
    }),
    login: publicProcedure.input(z.object({
      email: z.string().trim().toLowerCase().email().max(320),
      password: z.string().min(1).max(200),
    })).mutation(async ({ ctx, input }) => {
      const invalidCredentials = new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect email or password." });
      const user = await getUserByEmail(input.email);
      if (!user) throw invalidCredentials;
      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) throw invalidCredentials;
      await touchUserLastSignedIn(user.id);
      const { token, expiresAt } = await createSession(user.id);
      setSessionCookie(ctx.req, ctx.res, token, expiresAt);
      return sanitizeUser(user);
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      const cookies = parseCookieHeader(ctx.req.headers.cookie ?? "");
      await destroySessionToken(cookies[COOKIE_NAME]);
      clearSessionCookie(ctx.req, ctx.res);
      return { success: true } as const;
    }),
  }),
  demo: router({
    workspace: publicProcedure.query(() => ({
      isDemo: true,
      label: DEMO_LABEL,
      disclaimer,
      profile: { id: "demo-profile", ...demoProfile },
      documents: [...demoDocuments.map((document, index) => ({ id: ["demo-cv", "demo-appraisal", "demo-audit", "demo-feedback", "demo-teaching", "demo-student"][index], ...document, extractionStatus: "ready", isDemo: "yes" })), { id: "demo-current-role", ...demoCurrentRole, extractionStatus: "ready", isDemo: "yes" }],
      targetDocument: { id: "demo-target", ...demoTarget, extractionStatus: "ready", isDemo: "yes" },
      currentRoleDocument: { id: "demo-current-role", ...demoCurrentRole, extractionStatus: "ready", isDemo: "yes" },
      requirements: demoRequirements,
      currentRoleResponsibilities: demoCurrentRoleResponsibilities,
      evidence: demoEvidence,
      assessments: demoAssessments,
      objectiveReports: demoObjectiveReports,
      contradictions: demoContradictions,
    })),
  }),
  guest: router({
    startAnalyse: publicProcedure.input(guestAnalysisSchema).mutation(async ({ input }) => {
      const jobId = randomUUID();
      guestJobs.set(jobId, { status: "processing" });
      scheduleGuestJobCleanup(jobId);
      void runGuestAnalysisJob(jobId, input);
      return { jobId };
    }),
    analyseStatus: publicProcedure.input(z.object({ jobId: z.string().min(1) })).query(({ input }) => {
      const job = guestJobs.get(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "This guest analysis session has expired or was not found. Please submit again." });
      return job;
    }),
  }),
  evidence: router({
    workspace: protectedProcedure.query(({ ctx }) => getWorkspace(ctx.user.id)),
    saveProfile: protectedProcedure.input(z.object({
      currentRole: z.string().min(2).max(255), profession: z.string().min(2).max(255), specialty: z.string().max(255).optional(), experience: z.string().max(255).optional(), currentLevel: z.string().max(100).optional(), targetRole: z.string().max(255).optional(), careerObjective: z.string().max(4000).optional(), ownClaims: z.string().max(12000).optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The evidence library is temporarily unavailable." });
      await db.insert(evidenceProfiles).values({ userId: ctx.user.id, ...input, specialty: input.specialty ?? null, experience: input.experience ?? null, currentLevel: input.currentLevel ?? null, targetRole: input.targetRole ?? null, careerObjective: input.careerObjective ?? null, ownClaims: input.ownClaims ?? null, isDemo: "no" }).onDuplicateKeyUpdate({ set: { ...input, specialty: input.specialty ?? null, experience: input.experience ?? null, currentLevel: input.currentLevel ?? null, targetRole: input.targetRole ?? null, careerObjective: input.careerObjective ?? null, ownClaims: input.ownClaims ?? null, isDemo: "no" } });
      return getWorkspace(ctx.user.id);
    }),
    pasteTarget: protectedProcedure.input(z.object({
      title: z.string().min(1).max(255), sourceKind: z.string().min(1).max(80), text: z.string().min(40).max(70_000),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The evidence library is temporarily unavailable." });
      const profile = (await getWorkspace(ctx.user.id)).profile;
      const documentId = await persistDocument({ userId: ctx.user.id, profileId: profile?.id ?? null, title: input.title, fileName: "pasted-target-specification.txt", mimeType: "text/plain", documentType: "target", sourceKind: input.sourceKind, extractedText: input.text.trim() });
      const paragraphs = paragraphize(input.text);
      const requirements = await extractRequirements(input.text);
      if (requirements.length) await db.insert(targetRequirements).values(requirements.map(item => ({ userId: ctx.user.id, targetDocumentId: documentId, category: item.category, criterion: item.criterion, sourceLocation: locationForParagraph(item.paragraphIndex, paragraphs), ordinal: item.ordinal })));
      return { documentId, criteriaCount: requirements.length, message: "Pasted target specification stored and prepared for analysis." };
    }),
    pasteEvidence: protectedProcedure.input(z.object({
      title: z.string().min(1).max(255), sourceKind: z.string().min(1).max(80), text: z.string().min(40).max(70_000),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The evidence library is temporarily unavailable." });
      const profile = (await getWorkspace(ctx.user.id)).profile;
      const documentId = await persistDocument({ userId: ctx.user.id, profileId: profile?.id ?? null, title: input.title, fileName: "pasted-evidence.txt", mimeType: "text/plain", documentType: "evidence", sourceKind: input.sourceKind, extractedText: input.text.trim() });
      const paragraphs = paragraphize(input.text);
      const items = await extractEvidenceItems(input.text);
      if (items.length) await db.insert(extractedEvidence).values(items.map(item => ({ userId: ctx.user.id, documentId, statement: item.statement, excerpt: item.excerpt, sourceLocation: locationForParagraph(item.paragraphIndex, paragraphs), category: item.category, evidenceType: item.evidenceType, outcome: item.outcome, confidence: item.confidence })));
      return { documentId, itemCount: items.length, message: "Pasted evidence stored and prepared for analysis." };
    }),
    upload: protectedProcedure.input(z.object({
      title: z.string().min(1).max(255), fileName: z.string().min(1).max(255), mimeType: z.string().min(1).max(150), documentType: z.enum(["evidence", "target", "current_role"]), sourceKind: z.string().min(1).max(80), dataBase64: z.string().min(1).max(15_000_000), sourceText: z.string().max(70_000).optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The evidence library is temporarily unavailable." });
      const bytes = Buffer.from(input.dataBase64, "base64");
      if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Files must be 10 MB or smaller for this MVP." });
      const profile = (await getWorkspace(ctx.user.id)).profile;
      const stored = await storagePut(`evidence/${ctx.user.id}/${Date.now()}_${sanitizeName(input.fileName)}`, bytes, input.mimeType);
      const parsed = input.sourceText?.trim() ? { text: input.sourceText.trim(), status: "ready" as const } : await parseEvidenceFile(input.fileName, input.mimeType, bytes);
      const documentId = await persistDocument({ userId: ctx.user.id, profileId: profile?.id ?? null, title: input.title, fileName: input.fileName, mimeType: input.mimeType, documentType: input.documentType, sourceKind: input.sourceKind, extractedText: parsed.text, storageKey: stored.key, fileUrl: stored.url, extractionStatus: parsed.status });
      if (parsed.text) {
        if (input.documentType === "evidence") {
          const paragraphs = paragraphize(parsed.text);
          const items = await extractEvidenceItems(parsed.text);
          if (items.length) await db.insert(extractedEvidence).values(items.map(item => ({ userId: ctx.user.id, documentId, statement: item.statement, excerpt: item.excerpt, sourceLocation: locationForParagraph(item.paragraphIndex, paragraphs), category: item.category, evidenceType: item.evidenceType, outcome: item.outcome, confidence: item.confidence })));
        } else {
          const paragraphs = paragraphize(parsed.text);
          const requirements = await extractRequirements(parsed.text);
          if (requirements.length) await db.insert(targetRequirements).values(requirements.map(item => ({ userId: ctx.user.id, targetDocumentId: documentId, category: item.category, criterion: item.criterion, sourceLocation: locationForParagraph(item.paragraphIndex, paragraphs), ordinal: item.ordinal })));
        }
      }
      return { documentId, extractionStatus: parsed.status, message: parsed.message ?? "Stored and prepared for evidence analysis." };
    }),
    runAnalysis: protectedProcedure.input(z.object({ objective: objectiveSchema })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The evidence library is temporarily unavailable." });
      const workspace = await getWorkspace(ctx.user.id);
      const target = await getTargetDocument(ctx.user.id);
      if (input.objective === "A" && (!target || !workspace.requirements.length)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Add a target specification with extractable criteria before running Objective A." });
      if (input.objective === "C" && (!workspace.currentRoleDocument || !workspace.currentRoleResponsibilities.length)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Add a current role description with extractable responsibilities before running Objective C." });
      if (!workspace.evidence.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Add evidence documents with extractable text before analysing." });
      const requirements = target ? workspace.requirements.filter(item => item.targetDocumentId === target.id) : [];
      const titles = { A: `Objective A promotion mapping — ${target?.title ?? "target specification"}`, B: "Objective B annual appraisal evidence summary", C: `Objective C job evaluation preparation — ${workspace.currentRoleDocument?.title ?? "current role description"}` };
      const result = await db.insert(evidenceAnalyses).values({ userId: ctx.user.id, profileId: workspace.profile?.id ?? null, targetDocumentId: target?.id ?? null, objective: input.objective, title: titles[input.objective], status: "processing" });
      const analysisId = asId(result);
      // Runs the LLM pipeline in the background and returns immediately — see
      // the runAnalysisJob comment for why this endpoint doesn't await it.
      void runAnalysisJob(analysisId, input.objective, workspace, requirements);
      return { analysisId, status: "processing" as const };
    }),
    analysisStatus: protectedProcedure.input(z.object({ analysisId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The evidence library is temporarily unavailable." });
      const [analysis] = await db.select().from(evidenceAnalyses).where(and(eq(evidenceAnalyses.userId, ctx.user.id), eq(evidenceAnalyses.id, input.analysisId))).limit(1);
      if (!analysis) throw new TRPCError({ code: "NOT_FOUND", message: "Analysis not found." });
      return { analysisId: analysis.id, objective: analysis.objective, status: analysis.status, summary: analysis.generatedSummary, objectiveReport: analysis.objectiveReport };
    }),
    loadDemo: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The evidence library is temporarily unavailable." });
      const existing = await getWorkspace(ctx.user.id);
      if (existing.documents.length) return { imported: false, message: "Your library already contains documents; the preview remains available without replacing it." };
      await db.insert(evidenceProfiles).values({ userId: ctx.user.id, ...demoProfile, isDemo: "yes" }).onDuplicateKeyUpdate({ set: { ...demoProfile, isDemo: "yes" } });
      const profile = (await getWorkspace(ctx.user.id)).profile;
      const demoDocumentKeys = ["demo-cv", "demo-appraisal", "demo-audit", "demo-feedback", "demo-teaching", "demo-student"];
      for (let index = 0; index < demoDocuments.length; index += 1) {
        const document = demoDocuments[index]!;
        const documentId = await persistDocument({ userId: ctx.user.id, profileId: profile?.id ?? null, title: document.title, fileName: document.fileName, mimeType: "text/plain", documentType: "evidence", sourceKind: document.sourceKind, extractedText: document.extractedText, isDemo: "yes" });
        const demoItems = demoEvidence.filter(item => item.documentId === demoDocumentKeys[index]);
        if (demoItems.length) await db.insert(extractedEvidence).values(demoItems.map(item => ({ userId: ctx.user.id, documentId, statement: item.statement, excerpt: item.excerpt, sourceLocation: item.sourceLocation, category: item.category, evidenceType: item.evidenceType, confidence: item.confidence as "high" | "medium" | "low" })));
      }
      const targetId = await persistDocument({ userId: ctx.user.id, profileId: profile?.id ?? null, title: demoTarget.title, fileName: demoTarget.fileName, mimeType: "text/plain", documentType: "target", sourceKind: demoTarget.sourceKind, extractedText: demoTarget.extractedText, isDemo: "yes" });
      await db.insert(targetRequirements).values(demoRequirements.map((item, index) => ({ userId: ctx.user.id, targetDocumentId: targetId, category: item.category, criterion: item.criterion, sourceLocation: item.sourceLocation, ordinal: index + 1 })));
      const currentRoleId = await persistDocument({ userId: ctx.user.id, profileId: profile?.id ?? null, title: demoCurrentRole.title, fileName: demoCurrentRole.fileName, mimeType: "text/plain", documentType: "current_role", sourceKind: demoCurrentRole.sourceKind, extractedText: demoCurrentRole.extractedText, isDemo: "yes" });
      await db.insert(targetRequirements).values(demoCurrentRoleResponsibilities.map((item, index) => ({ userId: ctx.user.id, targetDocumentId: currentRoleId, category: item.category, criterion: item.criterion, sourceLocation: item.sourceLocation, ordinal: index + 1 })));
      return { imported: true, message: "Fictional demonstration data is now stored in your evidence library." };
    }),
    document: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The evidence library is temporarily unavailable." });
      const [document] = await db.select().from(evidenceDocuments).where(and(eq(evidenceDocuments.userId, ctx.user.id), eq(evidenceDocuments.id, input.id))).limit(1);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document not found." });
      return document;
    }),
  }),
});

export type AppRouter = typeof appRouter;
