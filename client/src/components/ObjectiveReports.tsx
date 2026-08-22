import { Button } from "@/components/ui/button";
import { EvidenceStatusPill, SourceReference, STATUS_META } from "@/components/evidence-ui";
import { AlertTriangle, ArrowDown, ArrowRight, BookOpenText, CheckCircle2, CircleAlert, Landmark, Target, Upload } from "lucide-react";

type Objective = "A" | "B" | "C";
type Props = { active: any; objective: Objective; assessmentByRequirement: Map<number, any>; selectedEvidenceId: number | null; setSelectedEvidenceId: (id: number) => void; onAddCurrentRole: () => void };

function sourceFor(active: any, evidenceId: number) {
  const evidence = active?.evidence?.find((item: any) => item.id === evidenceId);
  const document = active?.documents?.find((item: any) => String(item.id) === String(evidence?.documentId));
  return { evidence, document };
}

function canonicalAssessment(value: string) {
  return ({ demonstrated: "directly_evidenced", partial: "indirectly_relevantly_evidenced", unsupported: "contradicted" } as Record<string, string>)[value] ?? value;
}

// A small proportion bar + status pills, shown near the top of every
// objective's results screen so there's a scannable payoff before the
// reader gets to individual items.
function StatusSummary({ segments }: { segments: { key: string; label: string; count: number; barClass: string }[] }) {
  const total = segments.reduce((sum, item) => sum + item.count, 0);
  return <div className="mt-5">
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">{total > 0 && segments.filter(item => item.count > 0).map(item => <div key={item.key} className={`h-full ${item.barClass}`} style={{ width: `${(item.count / total) * 100}%` }} title={`${item.count} ${item.label}`} />)}</div>
    <div className="mt-3 flex flex-wrap gap-1.5">{segments.map(item => <EvidenceStatusPill key={item.key} status={item.key} label={`${item.count} ${item.label}`} />)}</div>
  </div>;
}

// The product's signature trust pattern -- every citation renders as a
// numbered source reference rather than an ordinary link.
function SourceLinks({ active, evidenceIds, selectedEvidenceId, setSelectedEvidenceId }: { active: any; evidenceIds: number[]; selectedEvidenceId: number | null; setSelectedEvidenceId: (id: number) => void }) {
  const sources = (Array.isArray(evidenceIds) ? evidenceIds : []).map(id => sourceFor(active, id)).filter(item => item.evidence);
  if (!sources.length) return <p className="mt-3 text-xs text-muted-foreground">We haven't linked a specific quote to this yet.</p>;
  return <div className="mt-3 flex flex-wrap gap-3">{sources.map(({ evidence, document }: any, index: number) => <SourceReference key={evidence.id} index={index + 1} title={document?.title ?? "evidence"} location={evidence.sourceLocation} onClick={() => setSelectedEvidenceId(evidence.id)} active={selectedEvidenceId === evidence.id} />)}</div>;
}

function ReportHeader({ accentText, label, title, description, summary, notice }: { accentText: string; label: string; title: string; description: string; summary?: React.ReactNode; notice?: React.ReactNode }) {
  return <div className="border-b border-border/70 pb-6"><p className={`font-mono text-[11px] font-bold uppercase tracking-[.16em] ${accentText}`}>{label}</p><h2 className="mt-1 font-serif text-2xl font-semibold text-ink">{title}</h2><p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">{description}</p>{summary}{notice}</div>;
}

function LensCard({ icon: Icon, title, color, items, active, selectedEvidenceId, setSelectedEvidenceId }: any) {
  return <article className="rounded-lg border border-border bg-card p-5"><div className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded-md bg-muted ${color}`}><Icon className="size-5" /></span><h3 className="font-serif text-xl font-semibold text-ink">{title}</h3></div><div className="mt-5 space-y-5">{items?.length ? items.map((item: any, index: number) => <div key={`${item.title}-${index}`} className="border-l-2 border-border pl-4"><p className="font-semibold text-sm text-ink">{item.title}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{item.statement}</p>{item.qualification && <p className="mt-2 text-xs leading-5 text-[#8a6423]"><strong>Worth noting:</strong> {item.qualification}</p>}{item.action && <p className="mt-2 rounded bg-secondary/70 px-2.5 py-2 text-xs leading-5 text-secondary-foreground"><strong>What would help:</strong> {item.action}</p>}<SourceLinks active={active} evidenceIds={item.evidenceIds ?? []} selectedEvidenceId={selectedEvidenceId} setSelectedEvidenceId={setSelectedEvidenceId} /></div>) : <p className="text-sm text-muted-foreground">Nothing to show here yet.</p>}</div></article>;
}

function Qualifications({ active, selectedEvidenceId, setSelectedEvidenceId }: Omit<Props, "objective" | "assessmentByRequirement" | "onAddCurrentRole">) {
  if (!active?.contradictions?.length) return null;
  return <div className="mt-6 border-l-2 border-error/50 pl-5"><div className="flex gap-2.5"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-error" /><h3 className="font-semibold text-ink">Worth double-checking</h3></div><div className="mt-3 space-y-4">{active.contradictions.map((item: any) => <div key={item.id ?? item.claim} className="rounded-md bg-error/[.05] p-4"><p className="text-sm font-medium text-ink">{item.claim}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{item.explanation}</p><SourceLinks active={active} evidenceIds={item.evidenceIds ?? []} selectedEvidenceId={selectedEvidenceId} setSelectedEvidenceId={setSelectedEvidenceId} /></div>)}</div></div>;
}

function PromotionReport(props: Props) {
  const mappings = props.active?.objectiveReports?.A?.mappings ?? props.active?.assessments ?? [];
  const requirements = props.active?.requirements ?? [];
  const requirementFor = (id: number) => requirements.find((item: any) => item.id === id);
  const strongest = mappings.filter((item: any) => item.assessment === "directly_evidenced" || item.assessment === "demonstrated").slice(0, 4).map((item: any) => ({ title: requirementFor(item.requirementId)?.criterion ?? "Requirement", statement: item.interpretation, qualification: item.gap, action: item.nextStep, evidenceIds: item.evidenceIds }));
  const gaps = mappings.filter((item: any) => item.assessment !== "directly_evidenced" && item.assessment !== "demonstrated").slice(0, 5).map((item: any) => ({ title: requirementFor(item.requirementId)?.criterion ?? "Requirement", statement: item.interpretation, qualification: item.gap, action: item.nextStep, evidenceIds: item.evidenceIds }));
  const statusKeys = ["directly_evidenced", "indirectly_relevantly_evidenced", "inferred", "not_found", "contradicted"];
  const statusBar: Record<string, string> = { directly_evidenced: "bg-emerald", indirectly_relevantly_evidenced: "bg-amber", inferred: "bg-[#8b7bb8]", not_found: "bg-[#c8c2b4]", contradicted: "bg-error" };
  const statusSummary = requirements.length ? <StatusSummary segments={statusKeys.map(key => ({ key, label: STATUS_META[key].label, barClass: statusBar[key], count: requirements.filter((requirement: any) => canonicalAssessment(props.assessmentByRequirement.get(requirement.id)?.assessment ?? "not_found") === key).length }))} /> : undefined;
  return <section className="mt-8 rise"><ReportHeader accentText="text-petrol" label="Objective A · Evidence &amp; matching" title="How you match up" description="How strongly does your evidence back up each requirement of the job you picked? The full breakdown, requirement by requirement, is still there in Your strengths and gaps." summary={statusSummary} /><div className="mt-6 grid gap-5 lg:grid-cols-2"><LensCard icon={CheckCircle2} title="Where you're strongest" color="text-petrol" items={strongest} {...props} /><LensCard icon={CircleAlert} title="Gaps, and what would help" color="text-[#8a6423]" items={gaps} {...props} /></div><Qualifications {...props} /></section>;
}

const appraisalSectionMeta = [
  { key: "documentedAchievements", label: "achievements", barClass: "bg-emerald", color: "text-petrol" },
  { key: "documentedImpact", label: "impact findings", barClass: "bg-[#6b8fae]", color: "text-[#3d5c73]" },
  { key: "evidenceLimitations", label: "limitations", barClass: "bg-amber", color: "text-[#8a6423]" },
  { key: "developmentThemes", label: "growth areas", barClass: "bg-[#8b7bb8]", color: "text-[#5b4d8a]" },
  { key: "evidenceGroundedObjectives", label: "objectives", barClass: "bg-ink", color: "text-ink" },
  { key: "suggestedEvidenceToRetain", label: "to retain", barClass: "bg-[#8b8477]", color: "text-muted-foreground" },
];

function AppraisalReport(props: Props) {
  const report = props.active?.objectiveReports?.B;
  const sections = [
    { icon: CheckCircle2, title: "What you've achieved", color: "text-petrol", items: report?.documentedAchievements },
    { icon: Target, title: "The difference it made", color: "text-[#3d5c73]", items: report?.documentedImpact ?? report?.measurableImpact },
    { icon: CircleAlert, title: "Where the evidence is thin", color: "text-[#8a6423]", items: report?.evidenceLimitations ?? report?.qualifications },
    { icon: BookOpenText, title: "Where you've grown", color: "text-[#5b4d8a]", items: report?.developmentThemes },
    { icon: Target, title: "Goals worth setting next", color: "text-ink", items: report?.evidenceGroundedObjectives },
    { icon: BookOpenText, title: "Evidence worth keeping hold of", color: "text-muted-foreground", items: report?.suggestedEvidenceToRetain },
  ];
  const statusSummary = report ? <StatusSummary segments={appraisalSectionMeta.map(meta => ({ key: meta.key, label: meta.label, barClass: meta.barClass, count: (report[meta.key] ?? []).length }))} /> : undefined;
  return <section className="mt-8 rise"><ReportHeader accentText="text-[#8a6423]" label="Objective B · Growth &amp; reflection" title="Ready for your appraisal" description="This keeps what you've contributed, the difference it made, and where the evidence is still thin as separate, honest categories. Being part of something and personally driving its outcome aren't the same thing, and we won't blur that line. This doesn't score you against any particular job." summary={statusSummary} /><div className="mt-6 grid gap-5 lg:grid-cols-2">{sections.map(section => <LensCard key={section.title} {...section} {...props} />)}</div><Qualifications {...props} /></section>;
}

// Objective C reflows what used to be a dense five-column table into
// scannable OFFICIAL RESPONSIBILITY / WHAT YOU ACTUALLY DO blocks -- same
// data, same comparison, no spreadsheet feel and no forced horizontal
// scroll on smaller screens.
function JobEvaluationRow({ item, responsibilityFor, active, selectedEvidenceId, setSelectedEvidenceId }: any) {
  const responsibility = responsibilityFor(item.responsibilityId);
  return <div className="grid gap-5 py-7 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
    <div>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">{responsibility?.category ?? "Official responsibility"}</p>
      <p className="mt-1.5 font-semibold leading-5 text-ink">{responsibility?.criterion ?? "Official responsibility"}</p>
      <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.14em] text-[#3d5c73]"><ArrowDown className="size-3" />What you actually do</div>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.documentedActualActivity}</p>
    </div>
    <div>
      <EvidenceStatusPill status={item.alignment} />
      {item.qualification && <p className="mt-3 text-xs leading-5 text-[#8a6423]">{item.qualification}</p>}
      <SourceLinks active={active} evidenceIds={item.evidenceIds ?? []} selectedEvidenceId={selectedEvidenceId} setSelectedEvidenceId={setSelectedEvidenceId} />
      <p className="mt-4 text-sm leading-5 text-muted-foreground">{item.discussionPoint}</p>
      {item.strengtheningEvidence && <p className="mt-2 rounded bg-secondary/70 px-2.5 py-2 text-xs leading-5 text-secondary-foreground"><strong>Still needed:</strong> {item.strengtheningEvidence}</p>}
    </div>
  </div>;
}

// The empty state explains why a current-role document unlocks this
// objective by showing the actual shape of the comparison it produces,
// rather than leaving the requirement unexplained.
function JobEvaluationEmptyState({ hasCurrentRole, onAddCurrentRole }: { hasCurrentRole: boolean; onAddCurrentRole: () => void }) {
  const steps = ["Current role", "Responsibilities", "Evidence", "Comparison"];
  return <div className="flex flex-col items-center gap-6 px-6 py-14 text-center">
    <div className="flex items-center gap-2">{steps.map((step, index) => <span key={step} className="flex items-center gap-2"><span className="rounded-full border border-border bg-muted px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{step}</span>{index < steps.length - 1 && <ArrowRight className="size-3 text-muted-foreground" />}</span>)}</div>
    {hasCurrentRole ? <><p className="font-medium text-ink">Your current role is ready — run this check to see the comparison.</p><p className="max-w-sm text-sm text-muted-foreground">Click "Check my evidence" above with this objective selected.</p></> : <><p className="font-medium text-ink">This one needs your current role first.</p><p className="max-w-sm text-sm text-muted-foreground">Add a copy of your current, official responsibilities — we'll compare it against what your evidence actually shows.</p><Button onClick={onAddCurrentRole} className="mt-1"><Upload className="size-4" />Add your current role</Button></>}
  </div>;
}

function JobEvaluationReport(props: Props) {
  const report = props.active?.objectiveReports?.C;
  const responsibilities = props.active?.currentRoleResponsibilities ?? [];
  const responsibilityFor = (id: number) => responsibilities.find((item: any) => item.id === id);
  const alignmentKeys = ["aligned", "potentially_broader_responsibility", "potentially_narrower_responsibility", "insufficient_evidence", "unclear_ambiguous"];
  const statusBar: Record<string, string> = { aligned: "bg-emerald", potentially_broader_responsibility: "bg-[#8b7bb8]", potentially_narrower_responsibility: "bg-[#6b8fae]", insufficient_evidence: "bg-[#c8c2b4]", unclear_ambiguous: "bg-amber" };
  const counts = (report?.comparisons ?? []).reduce((all: Record<string, number>, item: any) => ({ ...all, [item.alignment]: (all[item.alignment] ?? 0) + 1 }), {});
  const hasCurrentRole = !!props.active?.currentRoleDocument;
  const statusSummary = report?.comparisons?.length ? <StatusSummary segments={alignmentKeys.map(key => ({ key, label: STATUS_META[key].label, barClass: statusBar[key], count: counts[key] ?? 0 }))} /> : undefined;
  return <section className="mt-8 rise"><ReportHeader accentText="text-[#3d5c73]" label="Objective C · Comparison &amp; balance" title="Your role vs. what you actually do" description={`This compares the official responsibilities in ${props.active?.currentRoleDocument?.title ?? "the role description you added"} against what your evidence shows you actually doing day to day. It's not comparing you against the job you're applying for.`} summary={statusSummary} notice={<div className="mt-4 flex gap-3 rounded-md border border-amber/30 bg-amber/[.06] p-4 text-sm leading-6 text-[#6b4d1e]"><Landmark className="mt-0.5 size-4 shrink-0" />This is neutral preparation for discussion only. It does not determine a banding/grading decision, entitlement, pay, a job-evaluation outcome, or legal position, under any employer's grading system.</div>} />
    <div className="mt-2">{report?.comparisons?.length ? <div className="divide-y divide-border/70">{report.comparisons.map((item: any) => <JobEvaluationRow key={item.responsibilityId} item={item} responsibilityFor={responsibilityFor} active={props.active} selectedEvidenceId={props.selectedEvidenceId} setSelectedEvidenceId={props.setSelectedEvidenceId} />)}</div> : <JobEvaluationEmptyState hasCurrentRole={hasCurrentRole} onAddCurrentRole={props.onAddCurrentRole} />}</div>
    <div className="mt-6"><LensCard icon={BookOpenText} title="Worth talking through" color="text-[#3d5c73]" items={report?.questionsForDiscussion} {...props} /></div>
    <Qualifications {...props} />
  </section>;
}

export function ObjectiveReports(props: Props) {
  if (props.objective === "B") return <AppraisalReport {...props} />;
  if (props.objective === "C") return <JobEvaluationReport {...props} />;
  return <PromotionReport {...props} />;
}
