import {
  int,
  json,
  mediumtext,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: text("name"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// Server-side sessions: the cookie carries only a random opaque token: this
// table maps its hash to a user so a session can be revoked (logout, or
// deleting the row) without waiting for a stateless token to expire.
export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const evidenceProfiles = mysqlTable(
  "evidenceProfiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    currentRole: varchar("currentRole", { length: 255 }).notNull(),
    profession: varchar("profession", { length: 255 }).notNull(),
    specialty: varchar("specialty", { length: 255 }),
    experience: varchar("experience", { length: 255 }),
    currentLevel: varchar("currentLevel", { length: 100 }),
    targetRole: varchar("targetRole", { length: 255 }),
    careerObjective: text("careerObjective"),
    ownClaims: mediumtext("ownClaims"),
    isDemo: mysqlEnum("isDemo", ["yes", "no"]).default("no").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("evidence_profiles_user_unique").on(table.userId)],
);

export const evidenceDocuments = mysqlTable("evidenceDocuments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  profileId: int("profileId").references(() => evidenceProfiles.id),
  title: varchar("title", { length: 255 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 150 }).notNull(),
  documentType: mysqlEnum("documentType", ["evidence", "target", "current_role"]).notNull(),
  sourceKind: varchar("sourceKind", { length: 80 }).notNull(),
  storageKey: varchar("storageKey", { length: 1024 }),
  fileUrl: varchar("fileUrl", { length: 2048 }),
  extractedText: mediumtext("extractedText").notNull(),
  extractionStatus: mysqlEnum("extractionStatus", ["ready", "needs_review", "failed"]).default("ready").notNull(),
  isDemo: mysqlEnum("isDemo", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const targetRequirements = mysqlTable("targetRequirements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  targetDocumentId: int("targetDocumentId").notNull().references(() => evidenceDocuments.id),
  category: varchar("category", { length: 120 }).notNull(),
  criterion: text("criterion").notNull(),
  sourceLocation: varchar("sourceLocation", { length: 255 }).notNull(),
  ordinal: int("ordinal").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const extractedEvidence = mysqlTable("extractedEvidence", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  documentId: int("documentId").notNull().references(() => evidenceDocuments.id),
  statement: text("statement").notNull(),
  excerpt: mediumtext("excerpt").notNull(),
  sourceLocation: varchar("sourceLocation", { length: 255 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  evidenceType: varchar("evidenceType", { length: 100 }).notNull(),
  dateHint: varchar("dateHint", { length: 120 }),
  outcome: text("outcome"),
  confidence: mysqlEnum("confidence", ["high", "medium", "low"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const evidenceAnalyses = mysqlTable("evidenceAnalyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  profileId: int("profileId").references(() => evidenceProfiles.id),
  targetDocumentId: int("targetDocumentId").references(() => evidenceDocuments.id),
  objective: mysqlEnum("objective", ["A", "B", "C"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["complete", "processing", "failed"]).default("processing").notNull(),
  generatedSummary: mediumtext("generatedSummary"),
  objectiveReport: json("objectiveReport").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const criterionAssessments = mysqlTable("criterionAssessments", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull().references(() => evidenceAnalyses.id),
  requirementId: int("requirementId").notNull().references(() => targetRequirements.id),
  assessment: mysqlEnum("assessment", ["directly_evidenced", "indirectly_relevantly_evidenced", "inferred", "not_found", "contradicted", "demonstrated", "partial", "unsupported"]).notNull(),
  strength: mysqlEnum("strength", ["strong", "moderate", "weak", "not_demonstrated", "contradicted"]).notNull(),
  interpretation: mediumtext("interpretation").notNull(),
  gap: mediumtext("gap").notNull(),
  nextStep: mediumtext("nextStep"),
  evidenceIds: json("evidenceIds").$type<number[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const evidenceContradictions = mysqlTable("evidenceContradictions", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull().references(() => evidenceAnalyses.id),
  type: varchar("type", { length: 120 }).notNull(),
  severity: mysqlEnum("severity", ["review", "unsupported"]).notNull(),
  claim: mediumtext("claim").notNull(),
  explanation: mediumtext("explanation").notNull(),
  evidenceIds: json("evidenceIds").$type<number[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type EvidenceDocument = typeof evidenceDocuments.$inferSelect;
export type TargetRequirement = typeof targetRequirements.$inferSelect;
export type ExtractedEvidence = typeof extractedEvidence.$inferSelect;
