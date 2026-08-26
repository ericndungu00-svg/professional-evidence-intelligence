import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  commercialEvents,
  contactMessages,
  criterionAssessments,
  emailVerificationTokens,
  evidenceAnalyses,
  evidenceContradictions,
  evidenceDocuments,
  evidenceProfiles,
  extractedEvidence,
  passwordResetTokens,
  sessions,
  targetRequirements,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function createUser(values: { email: string; passwordHash: string; name: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const role = ENV.ownerEmail && values.email === ENV.ownerEmail ? "admin" : "user";
  const result = await db.insert(users).values({ email: values.email, passwordHash: values.passwordHash, name: values.name, role });
  const id = Number((Array.isArray(result) ? result[0] : result)?.insertId);
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function touchUserLastSignedIn(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

export async function createSession(values: { id: string; userId: number; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(sessions).values(values);
}

export async function getSession(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  return result[0];
}

export async function deleteSession(id: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(sessions).where(eq(sessions.id, id));
}

// A password reset should also end any existing session -- if the account
// was ever compromised, resetting the password shouldn't leave an
// attacker's session still valid.
export async function deleteAllSessionsForUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function createPasswordResetToken(values: { id: string; userId: number; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(passwordResetTokens).values(values);
}

export async function getPasswordResetToken(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.id, id)).limit(1);
  return result[0];
}

export async function markPasswordResetTokenUsed(id: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, id));
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function createEmailVerificationToken(values: { id: string; userId: number; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(emailVerificationTokens).values(values);
}

export async function getEmailVerificationToken(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(emailVerificationTokens).where(eq(emailVerificationTokens.id, id)).limit(1);
  return result[0];
}

export async function markEmailVerificationTokenUsed(id: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(emailVerificationTokens).set({ usedAt: new Date() }).where(eq(emailVerificationTokens.id, id));
}

export async function setUserEmailVerified(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ emailVerified: "yes" }).where(eq(users.id, userId));
}

export async function getWorkspace(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const [profile] = await db.select().from(evidenceProfiles).where(eq(evidenceProfiles.userId, userId)).limit(1);
  const documents = await db.select().from(evidenceDocuments).where(and(eq(evidenceDocuments.userId, userId), isNull(evidenceDocuments.deletedAt))).orderBy(desc(evidenceDocuments.createdAt));
  // Deleted documents are excluded above, then their requirements/evidence
  // are excluded here too -- filtered in JS against the live document set
  // rather than deleted at the row level, so a past analysis that already
  // cited them (evidenceAnalyses/criterionAssessments/evidenceContradictions,
  // none of which are touched by a delete) keeps working exactly as before.
  const liveDocumentIds = new Set(documents.map(document => document.id));
  const currentRoleDocument = documents.find(document => document.documentType === "current_role") ?? null;
  // documents is already ordered most-recent-first, so this is the same
  // "current" target document getTargetDocument() picks for the actual
  // Objective A analysis run -- see the requirements comment below for why
  // that match matters.
  const targetDocument = documents.find(document => document.documentType === "target") ?? null;
  const allRequirements = await db.select().from(targetRequirements).where(eq(targetRequirements.userId, userId)).orderBy(targetRequirements.ordinal);
  // targetRequirements holds both target-job criteria and current-role
  // responsibilities, distinguished only by which document's id is used as
  // targetDocumentId -- "requirements" means job/promotion criteria to every
  // consumer (Objective A's evidence map and its "N things we'll check
  // against" count, the results summary bar), so current-role rows are
  // excluded here rather than at each call site. Confirmed live: without
  // this, current-role responsibilities showed up as extra "Not Found" rows
  // in Objective A's gap analysis, inflating apparent gaps in a job
  // application with criteria that were never part of the job spec.
  //
  // A user can end up with more than one live target-type document (e.g.
  // after loading the demo example and later adding their own, or pasting
  // an updated job spec without deleting the old one) -- runAnalysis only
  // ever assesses the single most recent one (getTargetDocument), so
  // requirements is scoped to that same document here too. Confirmed live:
  // without this, Objective A's results counted every requirement from
  // every target document ever added, not just the one actually analysed,
  // showing dozens of spurious "Not Found" rows for a job spec that was
  // never the one being checked against.
  const requirements = targetDocument ? allRequirements.filter(item => liveDocumentIds.has(item.targetDocumentId) && item.targetDocumentId === targetDocument.id) : [];
  const allEvidence = await db.select().from(extractedEvidence).where(eq(extractedEvidence.userId, userId)).orderBy(desc(extractedEvidence.createdAt));
  const evidence = allEvidence.filter(item => liveDocumentIds.has(item.documentId));
  const analyses = await db.select().from(evidenceAnalyses).where(eq(evidenceAnalyses.userId, userId)).orderBy(desc(evidenceAnalyses.createdAt));
  const latestAnalysis = analyses[0];
  const assessments = latestAnalysis ? await db.select().from(criterionAssessments).where(eq(criterionAssessments.analysisId, latestAnalysis.id)) : [];
  const contradictions = latestAnalysis ? await db.select().from(evidenceContradictions).where(eq(evidenceContradictions.analysisId, latestAnalysis.id)) : [];
  // objectiveReport is declared as a json() column, but on at least one
  // deployed database it was actually created as longtext (schema drift
  // between the drizzle-kit migration history and the live column type) --
  // mysql2 only auto-parses columns MySQL itself reports as JSON, so on a
  // drifted column the driver hands back the raw JSON text instead of a
  // parsed object. Confirmed live: Objective A masked this (it also reads
  // from the separate criterionAssessments table as a fallback), but
  // Objective B/C have no such fallback, so their results screens silently
  // rendered as empty/not-yet-run even though generation had succeeded.
  // Parse defensively here so a real object reaches the client either way.
  const objectiveReports = analyses.reduce<Record<string, unknown>>((reports, analysis) => {
    if (analysis.objective in reports || !analysis.objectiveReport) return reports;
    const report = analysis.objectiveReport;
    if (typeof report === "string") {
      try {
        reports[analysis.objective] = JSON.parse(report);
      } catch {
        // Leave this objective's report absent rather than surfacing unparsable text.
      }
    } else {
      reports[analysis.objective] = report;
    }
    return reports;
  }, {});
  const currentRoleResponsibilities = currentRoleDocument ? allRequirements.filter(item => item.targetDocumentId === currentRoleDocument.id) : [];
  return { profile: profile ?? null, documents, requirements, targetDocument, currentRoleDocument, currentRoleResponsibilities, evidence, analyses, latestAnalysis: latestAnalysis ?? null, assessments, contradictions, objectiveReports };
}

export async function getTargetDocument(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const result = await db.select().from(evidenceDocuments).where(and(eq(evidenceDocuments.userId, userId), eq(evidenceDocuments.documentType, "target"), isNull(evidenceDocuments.deletedAt))).orderBy(desc(evidenceDocuments.createdAt)).limit(1);
  return result[0] ?? null;
}

// Soft delete only -- see the deletedAt comment on evidenceDocuments in
// drizzle/schema.ts. Returns null if the document doesn't exist, isn't
// owned by this user, or was already deleted (idempotent either way).
// Returns the document's storageKey (if it had one) so the caller can
// remove the underlying file from R2 -- a soft-deleted document can never
// be downloaded again anyway (see getDocumentByStorageKey's deletedAt
// check), so the file becomes pure dead weight in storage from this point.
export async function softDeleteDocument(userId: number, documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const [existing] = await db.select({ id: evidenceDocuments.id, storageKey: evidenceDocuments.storageKey }).from(evidenceDocuments).where(and(eq(evidenceDocuments.id, documentId), eq(evidenceDocuments.userId, userId), isNull(evidenceDocuments.deletedAt))).limit(1);
  if (!existing) return null;
  await db.update(evidenceDocuments).set({ deletedAt: new Date() }).where(and(eq(evidenceDocuments.id, documentId), eq(evidenceDocuments.userId, userId)));
  return { storageKey: existing.storageKey };
}

// Every storage key this user has ever had a document stored under
// (including already soft-deleted documents), so account deletion can
// clean up R2 even for documents deleted before per-document file cleanup
// existed. Deleting an already-deleted or nonexistent R2 key is a no-op,
// so no need to filter by deletedAt here.
export async function getDocumentStorageKeysForUser(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ storageKey: evidenceDocuments.storageKey }).from(evidenceDocuments).where(eq(evidenceDocuments.userId, userId));
  return rows.map(row => row.storageKey).filter((key): key is string => Boolean(key));
}

// Permanently erases a user and everything derived from their account: every
// document, extracted evidence item, target requirement, and past analysis
// (plus its assessments/contradictions), deleted in FK dependency order --
// schema.ts defines no ON DELETE CASCADE, so this has to be explicit rather
// than relying on the database to cascade it. The caller is responsible for
// deleting the underlying R2 files first (via getDocumentStorageKeysForUser)
// -- this only touches the database.
export async function deleteUserAccount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const analyses = await db.select({ id: evidenceAnalyses.id }).from(evidenceAnalyses).where(eq(evidenceAnalyses.userId, userId));
  const analysisIds = analyses.map(analysis => analysis.id);
  if (analysisIds.length) {
    await db.delete(criterionAssessments).where(inArray(criterionAssessments.analysisId, analysisIds));
    await db.delete(evidenceContradictions).where(inArray(evidenceContradictions.analysisId, analysisIds));
  }
  await db.delete(evidenceAnalyses).where(eq(evidenceAnalyses.userId, userId));
  await db.delete(targetRequirements).where(eq(targetRequirements.userId, userId));
  await db.delete(extractedEvidence).where(eq(extractedEvidence.userId, userId));
  await db.delete(evidenceDocuments).where(eq(evidenceDocuments.userId, userId));
  await db.delete(evidenceProfiles).where(eq(evidenceProfiles.userId, userId));
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
  await db.delete(sessions).where(eq(sessions.userId, userId));
  await db.delete(commercialEvents).where(eq(commercialEvents.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}

export async function getDocumentById(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const result = await db.select().from(evidenceDocuments).where(and(eq(evidenceDocuments.userId, userId), eq(evidenceDocuments.id, id))).limit(1);
  return result[0] ?? null;
}

// Used by the /storage/* download proxy to prove the requesting session
// owns the file before a signed URL is minted for it -- a storage key alone
// (evidence/{userId}/{timestamp}_{filename}) is not a secret, so ownership
// must be re-checked against the database, not inferred from the key shape.
export async function getDocumentByStorageKey(userId: number, storageKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const result = await db.select({ id: evidenceDocuments.id }).from(evidenceDocuments).where(and(eq(evidenceDocuments.userId, userId), eq(evidenceDocuments.storageKey, storageKey), isNull(evidenceDocuments.deletedAt))).limit(1);
  return result[0] ?? null;
}

export async function countAnalysesForUser(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ id: evidenceAnalyses.id }).from(evidenceAnalyses).where(eq(evidenceAnalyses.userId, userId));
  return rows.length;
}

// Records a commercial-interest signal (e.g. "pro_interest") for a user.
// Idempotent by design: the unique index on (userId, eventType) means a
// second call for the same user and event type is a harmless no-op rather
// than a duplicate row or a thrown error -- the caller doesn't need to
// check for an existing record first, and a race between two near-
// simultaneous clicks can't create two rows either.
export async function recordCommercialEvent(args: { userId: number; eventType: string; analysesCompletedAtTimeOfInterest: number; objective?: string | null; source?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  try {
    await db.insert(commercialEvents).values({
      userId: args.userId,
      eventType: args.eventType,
      analysesCompletedAtTimeOfInterest: args.analysesCompletedAtTimeOfInterest,
      objective: args.objective ?? null,
      source: args.source ?? null,
    });
  } catch (error) {
    const isDuplicate = (error as { code?: string; errno?: number })?.code === "ER_DUP_ENTRY" || (error as { code?: string; errno?: number })?.errno === 1062;
    if (!isDuplicate) throw error;
  }
}

// Admin-only read: every commercial-interest event, newest first, joined
// with the minimal user fields needed to identify who expressed interest.
export async function listCommercialEvents(eventType: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: commercialEvents.id,
      userId: commercialEvents.userId,
      email: users.email,
      name: users.name,
      analysesCompletedAtTimeOfInterest: commercialEvents.analysesCompletedAtTimeOfInterest,
      objective: commercialEvents.objective,
      source: commercialEvents.source,
      createdAt: commercialEvents.createdAt,
    })
    .from(commercialEvents)
    .innerJoin(users, eq(users.id, commercialEvents.userId))
    .where(eq(commercialEvents.eventType, eventType))
    .orderBy(desc(commercialEvents.createdAt));
}

// Stores a Contact-page submission. Called before the notification email
// is attempted, so a message is never lost even if that send fails --
// this is the durable record of what was submitted.
export async function createContactMessage(args: { name: string | null; email: string; message: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(contactMessages).values({ name: args.name, email: args.email, message: args.message });
}

// Admin-only read: every contact-form submission, newest first.
export async function listContactMessages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
}
