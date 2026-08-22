import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, BookOpenText, CheckCircle2, CircleAlert, FolderOpen, Landmark, Target, Upload } from "lucide-react";

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

// A small proportion bar + count badges, shown near the top of every
// objective's results screen so there's a payoff before the reader scrolls
// into individual items. Reuses the same functional colours already used
// for each status elsewhere in the app (assessmentStyle in Home.tsx,
// alignmentStyle below) -- this is a new component, not a new palette.
function StatusSummary({ segments }: { segments: { key: string; label: string; count: number; barClass: string; badgeClass: string }[] }) {
  const total = segments.reduce((sum, item) => sum + item.count, 0);
  return <div className="mt-4">
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">{total > 0 && segments.filter(item => item.count > 0).map(item => <div key={item.key} className={`h-full ${item.barClass}`} style={{ width: `${(item.count / total) * 100}%` }} title={`${item.count} ${item.label}`} />)}</div>
    <div className="mt-3 flex flex-wrap gap-2">{segments.map(item => <Badge key={item.key} variant="outline" className={item.badgeClass}>{item.count} {item.label}</Badge>)}</div>
  </div>;
}

function SourceLinks({ active, evidenceIds, selectedEvidenceId, setSelectedEvidenceId }: { active: any; evidenceIds: number[]; selectedEvidenceId: number | null; setSelectedEvidenceId: (id: number) => void }) {
  const sources = (Array.isArray(evidenceIds) ? evidenceIds : []).map(id => sourceFor(active, id)).filter(item => item.evidence);
  if (!sources.length) return <p className="mt-3 text-xs text-muted-foreground">We haven't linked a specific quote to this yet.</p>;
  return <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">{sources.map(({ evidence, document }: any) => <button key={evidence.id} onClick={() => setSelectedEvidenceId(evidence.id)} className={`inline-flex items-center gap-1 py-1.5 text-xs font-semibold text-primary underline underline-offset-4 ${selectedEvidenceId === evidence.id ? "opacity-60" : ""}`}>View source: {document?.title ?? "evidence"}<ArrowRight className="size-3" /></button>)}</div>;
}

function ReportHeader({ label, title, description, summary, notice }: { label: string; title: string; description: string; summary?: React.ReactNode; notice?: React.ReactNode }) {
  return <div className="rounded-xl border bg-card p-6 shadow-sm"><p className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-primary">{label}</p><h2 className="mt-1 font-serif text-2xl font-semibold">{title}</h2><p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">{description}</p>{summary}{notice}</div>;
}

function LensCard({ icon: Icon, title, color, items, active, selectedEvidenceId, setSelectedEvidenceId }: any) {
  return <article className="rounded-xl border bg-card p-5 shadow-sm"><div className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded-md bg-muted ${color}`}><Icon className="size-5" /></span><h3 className="font-serif text-xl font-semibold">{title}</h3></div><div className="mt-5 space-y-5">{items?.length ? items.map((item: any, index: number) => <div key={`${item.title}-${index}`} className="border-l-2 border-border pl-4"><p className="font-semibold text-sm">{item.title}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{item.statement}</p>{item.qualification && <p className="mt-2 text-xs leading-5 text-amber-800"><strong>Worth noting:</strong> {item.qualification}</p>}{item.action && <p className="mt-2 rounded bg-secondary/70 px-2.5 py-2 text-xs leading-5 text-secondary-foreground"><strong>What would help:</strong> {item.action}</p>}<SourceLinks active={active} evidenceIds={item.evidenceIds ?? []} selectedEvidenceId={selectedEvidenceId} setSelectedEvidenceId={setSelectedEvidenceId} /></div>) : <p className="text-sm text-muted-foreground">Nothing to show here yet.</p>}</div></article>;
}

function Qualifications({ active, selectedEvidenceId, setSelectedEvidenceId }: Omit<Props, "objective" | "assessmentByRequirement" | "onAddCurrentRole">) {
  if (!active?.contradictions?.length) return null;
  return <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50/60 p-5"><div className="flex gap-3"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-800" /><div><h3 className="font-semibold text-rose-950">Worth double-checking</h3><div className="mt-3 space-y-3">{active.contradictions.map((item: any) => <div key={item.id ?? item.claim} className="rounded-lg border border-rose-200 bg-background/70 p-3"><p className="text-sm font-medium text-rose-950">{item.claim}</p><p className="mt-1 text-sm leading-5 text-rose-900">{item.explanation}</p><SourceLinks active={active} evidenceIds={item.evidenceIds ?? []} selectedEvidenceId={selectedEvidenceId} setSelectedEvidenceId={setSelectedEvidenceId} /></div>)}</div></div></div></div>;
}

const promotionStatusMeta: Record<string, { label: string; barClass: string; badgeClass: string }> = {
  directly_evidenced: { label: "Directly evidenced", barClass: "bg-emerald-500", badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  indirectly_relevantly_evidenced: { label: "Indirectly/relevantly evidenced", barClass: "bg-sky-500", badgeClass: "bg-sky-50 text-sky-800 border-sky-200" },
  inferred: { label: "Inferred", barClass: "bg-violet-500", badgeClass: "bg-violet-50 text-violet-800 border-violet-200" },
  not_found: { label: "Not found", barClass: "bg-stone-300", badgeClass: "bg-stone-100 text-stone-600 border-stone-200" },
  contradicted: { label: "Contradicted", barClass: "bg-rose-500", badgeClass: "bg-rose-50 text-rose-800 border-rose-200" },
};

function PromotionReport(props: Props) {
  const mappings = props.active?.objectiveReports?.A?.mappings ?? props.active?.assessments ?? [];
  const requirements = props.active?.requirements ?? [];
  const requirementFor = (id: number) => requirements.find((item: any) => item.id === id);
  const strongest = mappings.filter((item: any) => item.assessment === "directly_evidenced" || item.assessment === "demonstrated").slice(0, 4).map((item: any) => ({ title: requirementFor(item.requirementId)?.criterion ?? "Requirement", statement: item.interpretation, qualification: item.gap, action: item.nextStep, evidenceIds: item.evidenceIds }));
  const gaps = mappings.filter((item: any) => item.assessment !== "directly_evidenced" && item.assessment !== "demonstrated").slice(0, 5).map((item: any) => ({ title: requirementFor(item.requirementId)?.criterion ?? "Requirement", statement: item.interpretation, qualification: item.gap, action: item.nextStep, evidenceIds: item.evidenceIds }));
  const statusSummary = requirements.length ? <StatusSummary segments={Object.keys(promotionStatusMeta).map(key => ({ key, ...promotionStatusMeta[key], count: requirements.filter((requirement: any) => canonicalAssessment(props.assessmentByRequirement.get(requirement.id)?.assessment ?? "not_found") === key).length }))} /> : undefined;
  return <section key={props.active?.latestAnalysis?.id ?? "empty"} className="mt-6 rise"><ReportHeader label="Objective A" title="How you match up" description="How strongly does your evidence back up each requirement of the job you picked? The full breakdown, requirement by requirement, is still there in Your strengths and gaps." summary={statusSummary} /><div className="mt-5 grid gap-5 lg:grid-cols-2"><LensCard icon={CheckCircle2} title="Where you're strongest" color="text-emerald-700" items={strongest} {...props} /><LensCard icon={CircleAlert} title="Gaps, and what would help" color="text-amber-700" items={gaps} {...props} /></div><Qualifications {...props} /></section>;
}

const appraisalSectionMeta = [
  { key: "documentedAchievements", label: "achievements", barClass: "bg-emerald-500", badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { key: "documentedImpact", label: "impact findings", barClass: "bg-cyan-500", badgeClass: "bg-cyan-50 text-cyan-800 border-cyan-200" },
  { key: "evidenceLimitations", label: "limitations", barClass: "bg-amber-500", badgeClass: "bg-amber-50 text-amber-800 border-amber-200" },
  { key: "developmentThemes", label: "growth areas", barClass: "bg-violet-500", badgeClass: "bg-violet-50 text-violet-800 border-violet-200" },
  { key: "evidenceGroundedObjectives", label: "objectives", barClass: "bg-primary", badgeClass: "bg-primary/5 text-primary border-primary/20" },
  { key: "suggestedEvidenceToRetain", label: "to retain", barClass: "bg-slate-500", badgeClass: "bg-slate-50 text-slate-800 border-slate-200" },
];

function AppraisalReport(props: Props) {
  const report = props.active?.objectiveReports?.B;
  const sections = [
    { icon: CheckCircle2, title: "What you've achieved", color: "text-emerald-700", items: report?.documentedAchievements },
    { icon: Target, title: "The difference it made", color: "text-cyan-700", items: report?.documentedImpact ?? report?.measurableImpact },
    { icon: CircleAlert, title: "Where the evidence is thin", color: "text-amber-700", items: report?.evidenceLimitations ?? report?.qualifications },
    { icon: BookOpenText, title: "Where you've grown", color: "text-violet-700", items: report?.developmentThemes },
    { icon: Target, title: "Goals worth setting next", color: "text-primary", items: report?.evidenceGroundedObjectives },
    { icon: BookOpenText, title: "Evidence worth keeping hold of", color: "text-slate-700", items: report?.suggestedEvidenceToRetain },
  ];
  const statusSummary = report ? <StatusSummary segments={appraisalSectionMeta.map(meta => ({ ...meta, count: (report[meta.key] ?? []).length }))} /> : undefined;
  return <section key={props.active?.latestAnalysis?.id ?? "empty"} className="mt-6 rise"><ReportHeader label="Objective B" title="Ready for your appraisal" description="This keeps what you've contributed, the difference it made, and where the evidence is still thin as separate, honest categories. Being part of something and personally driving its outcome aren't the same thing, and we won't blur that line. This doesn't score you against any particular job." summary={statusSummary} /><div className="mt-5 grid gap-5 lg:grid-cols-2">{sections.map(section => <LensCard key={section.title} {...section} {...props} />)}</div><Qualifications {...props} /></section>;
}

function JobEvaluationReport(props: Props) {
  const report = props.active?.objectiveReports?.C;
  const responsibilities = props.active?.currentRoleResponsibilities ?? [];
  const responsibilityFor = (id: number) => responsibilities.find((item: any) => item.id === id);
  const alignmentStyle: Record<string, string> = { aligned: "bg-emerald-50 text-emerald-800 border-emerald-200", potentially_broader_responsibility: "bg-violet-50 text-violet-800 border-violet-200", potentially_narrower_responsibility: "bg-sky-50 text-sky-800 border-sky-200", insufficient_evidence: "bg-stone-100 text-stone-700 border-stone-200", unclear_ambiguous: "bg-amber-50 text-amber-800 border-amber-200" };
  const alignmentBar: Record<string, string> = { aligned: "bg-emerald-500", potentially_broader_responsibility: "bg-violet-500", potentially_narrower_responsibility: "bg-sky-500", insufficient_evidence: "bg-stone-300", unclear_ambiguous: "bg-amber-500" };
  const alignmentLabel: Record<string, string> = { aligned: "Matches up", potentially_broader_responsibility: "You may be doing more", potentially_narrower_responsibility: "You may be doing less", insufficient_evidence: "Not enough evidence yet", unclear_ambiguous: "Unclear" };
  const counts = (report?.comparisons ?? []).reduce((all: Record<string, number>, item: any) => ({ ...all, [item.alignment]: (all[item.alignment] ?? 0) + 1 }), {});
  const hasCurrentRole = !!props.active?.currentRoleDocument;
  const statusSummary = report?.comparisons?.length ? <StatusSummary segments={Object.keys(alignmentLabel).map(key => ({ key, label: alignmentLabel[key], barClass: alignmentBar[key], badgeClass: alignmentStyle[key], count: counts[key] ?? 0 }))} /> : undefined;
  return <section key={props.active?.latestAnalysis?.id ?? "empty"} className="mt-6 rise"><ReportHeader label="Objective C" title="Your role vs. what you actually do" description={`This compares the official responsibilities in ${props.active?.currentRoleDocument?.title ?? "the role description you added"} against what your evidence shows you actually doing day to day. It's not comparing you against the job you're applying for.`} summary={statusSummary} notice={<div className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><Landmark className="mt-0.5 size-5 shrink-0" />This is neutral preparation for discussion only. It does not determine a banding/grading decision, entitlement, pay, a job-evaluation outcome, or legal position, under any employer's grading system.</div>} /><div className="mt-4 overflow-hidden rounded-xl border bg-card shadow-sm">{report?.comparisons?.length ? <><div className="hidden overflow-x-auto sm:block"><table className="report-table min-w-[1120px] w-full text-left text-sm"><thead className="bg-muted/65 text-[11px] uppercase tracking-[.12em] text-muted-foreground"><tr><th className="sticky left-0 z-10 w-[19%] border-r bg-muted/65 px-4 py-3">Your official responsibility</th><th className="w-[22%] px-4 py-3">What you actually do</th><th className="w-[14%] px-4 py-3">Comparison</th><th className="w-[19%] px-4 py-3">Evidence and caveats</th><th className="w-[26%] px-4 py-3">Worth discussing / still needed</th></tr></thead><tbody>{report.comparisons.map((item: any) => <tr key={item.responsibilityId}><td className="sticky left-0 z-10 border-r bg-card px-4 py-4 align-top"><p className="font-semibold">{responsibilityFor(item.responsibilityId)?.criterion ?? "Official responsibility"}</p><p className="mt-1 text-xs text-muted-foreground">{responsibilityFor(item.responsibilityId)?.category}</p></td><td className="px-4 py-4 align-top leading-5 text-muted-foreground">{item.documentedActualActivity}</td><td className="px-4 py-4 align-top"><Badge variant="outline" className={alignmentStyle[item.alignment] ?? alignmentStyle.insufficient_evidence}>{alignmentLabel[item.alignment] ?? "Not enough evidence yet"}</Badge></td><td className="px-4 py-4 align-top"><p className="text-xs leading-5 text-amber-800">{item.qualification}</p><SourceLinks active={props.active} evidenceIds={item.evidenceIds ?? []} selectedEvidenceId={props.selectedEvidenceId} setSelectedEvidenceId={props.setSelectedEvidenceId} /></td><td className="px-4 py-4 align-top"><p className="text-sm leading-5 text-muted-foreground">{item.discussionPoint}</p><p className="mt-2 rounded bg-secondary/70 px-2.5 py-2 text-xs leading-5 text-secondary-foreground"><strong>Still needed:</strong> {item.strengtheningEvidence}</p></td></tr>)}</tbody></table></div><div className="divide-y sm:hidden">{report.comparisons.map((item: any) => <div key={item.responsibilityId} className="p-4"><p className="font-semibold">{responsibilityFor(item.responsibilityId)?.criterion ?? "Official responsibility"}</p><p className="mt-1 text-xs text-muted-foreground">{responsibilityFor(item.responsibilityId)?.category}</p><p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">What you actually do</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{item.documentedActualActivity}</p><div className="mt-3"><Badge variant="outline" className={alignmentStyle[item.alignment] ?? alignmentStyle.insufficient_evidence}>{alignmentLabel[item.alignment] ?? "Not enough evidence yet"}</Badge></div><p className="mt-3 text-xs leading-5 text-amber-800">{item.qualification}</p><SourceLinks active={props.active} evidenceIds={item.evidenceIds ?? []} selectedEvidenceId={props.selectedEvidenceId} setSelectedEvidenceId={props.setSelectedEvidenceId} /><p className="mt-3 text-sm leading-5 text-muted-foreground">{item.discussionPoint}</p><p className="mt-2 rounded bg-secondary/70 px-2.5 py-2 text-xs leading-5 text-secondary-foreground"><strong>Still needed:</strong> {item.strengtheningEvidence}</p></div>)}</div></> : <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
    <span className="grid size-11 place-items-center rounded-full bg-secondary text-secondary-foreground"><FolderOpen className="size-5" /></span>
    {hasCurrentRole ? <><p className="font-medium">Your current role is ready — run this check to see the comparison.</p><p className="max-w-sm text-sm text-muted-foreground">Click "Check my evidence" above with this objective selected.</p></> : <><p className="font-medium">This one needs your current role first.</p><p className="max-w-sm text-sm text-muted-foreground">Add a copy of your current, official responsibilities — we'll compare it against what your evidence actually shows.</p><Button onClick={props.onAddCurrentRole} className="mt-1"><Upload className="size-4" />Add your current role</Button></>}
  </div>}</div><div className="mt-5"><LensCard icon={BookOpenText} title="Worth talking through" color="text-primary" items={report?.questionsForDiscussion} {...props} /></div><Qualifications {...props} /></section>;
}

export function ObjectiveReports(props: Props) {
  if (props.objective === "B") return <AppraisalReport {...props} />;
  if (props.objective === "C") return <JobEvaluationReport {...props} />;
  return <PromotionReport {...props} />;
}
