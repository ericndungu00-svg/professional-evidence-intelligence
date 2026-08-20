import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  criterionAssessments,
  evidenceAnalyses,
  evidenceContradictions,
  evidenceDocuments,
  evidenceProfiles,
  extractedEvidence,
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

export async function getWorkspace(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const [profile] = await db.select().from(evidenceProfiles).where(eq(evidenceProfiles.userId, userId)).limit(1);
  const documents = await db.select().from(evidenceDocuments).where(eq(evidenceDocuments.userId, userId)).orderBy(desc(evidenceDocuments.createdAt));
  const requirements = await db.select().from(targetRequirements).where(eq(targetRequirements.userId, userId)).orderBy(targetRequirements.ordinal);
  const evidence = await db.select().from(extractedEvidence).where(eq(extractedEvidence.userId, userId)).orderBy(desc(extractedEvidence.createdAt));
  const analyses = await db.select().from(evidenceAnalyses).where(eq(evidenceAnalyses.userId, userId)).orderBy(desc(evidenceAnalyses.createdAt));
  const latestAnalysis = analyses[0];
  const assessments = latestAnalysis ? await db.select().from(criterionAssessments).where(eq(criterionAssessments.analysisId, latestAnalysis.id)) : [];
  const contradictions = latestAnalysis ? await db.select().from(evidenceContradictions).where(eq(evidenceContradictions.analysisId, latestAnalysis.id)) : [];
  const objectiveReports = analyses.reduce<Record<string, unknown>>((reports, analysis) => {
    if (!(analysis.objective in reports) && analysis.objectiveReport) reports[analysis.objective] = analysis.objectiveReport;
    return reports;
  }, {});
  const currentRoleDocument = documents.find(document => document.documentType === "current_role") ?? null;
  const currentRoleResponsibilities = currentRoleDocument ? requirements.filter(item => item.targetDocumentId === currentRoleDocument.id) : [];
  return { profile: profile ?? null, documents, requirements, currentRoleDocument, currentRoleResponsibilities, evidence, analyses, latestAnalysis: latestAnalysis ?? null, assessments, contradictions, objectiveReports };
}

export async function getTargetDocument(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const result = await db.select().from(evidenceDocuments).where(and(eq(evidenceDocuments.userId, userId), eq(evidenceDocuments.documentType, "target"))).orderBy(desc(evidenceDocuments.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function getDocumentById(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const result = await db.select().from(evidenceDocuments).where(and(eq(evidenceDocuments.userId, userId), eq(evidenceDocuments.id, id))).limit(1);
  return result[0] ?? null;
}
