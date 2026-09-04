import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

// Extracted out of Home.tsx (where it used to be a private, unexported
// function) so it can be reused by the shared-result page without
// duplicating this rendering logic -- both consume the same
// `active`-shaped object Home.tsx already normalizes demo/guest/
// authenticated data into.

export const assessmentStyle: Record<string, string> = {
  directly_evidenced: "bg-emerald-50 text-emerald-800 border-emerald-200",
  indirectly_relevantly_evidenced: "bg-sky-50 text-sky-800 border-sky-200",
  inferred: "bg-violet-50 text-violet-800 border-violet-200",
  contradicted: "bg-rose-50 text-rose-800 border-rose-200",
  demonstrated: "bg-emerald-50 text-emerald-800 border-emerald-200",
  partial: "bg-amber-50 text-amber-800 border-amber-200",
  not_found: "bg-stone-100 text-stone-600 border-stone-200",
  unsupported: "bg-rose-50 text-rose-800 border-rose-200",
};

export function sourceFor(active: any, evidenceId: number) {
  const evidence = active?.evidence?.find((item: any) => item.id === evidenceId);
  const document = active?.documents?.find((item: any) => String(item.id) === String(evidence?.documentId));
  return { evidence, document };
}

export function formatStatus(value: string) { return value.replace(/_/g, " "); }

export function canonicalAssessment(value: string) { return ({ demonstrated: "directly_evidenced", partial: "indirectly_relevantly_evidenced", unsupported: "contradicted" } as Record<string, string>)[value] ?? value; }

function ComponentChecks({ active, components, selectedEvidenceId, setSelectedEvidenceId }: any) {
  if (!components?.length) return null;
  return <div className="mt-3 space-y-2 border-t border-dashed pt-3"><p className="font-mono text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">In detail</p>{components.map((component: any, index: number) => <div key={`${component.component}-${index}`} className="rounded-md bg-muted/35 p-2.5"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={assessmentStyle[canonicalAssessment(component.assessment)]}>{formatStatus(canonicalAssessment(component.assessment))}</Badge><span className="text-xs font-semibold">{component.component}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{component.interpretation}</p>{component.gap && <p className="mt-1 text-xs leading-5 text-amber-800"><strong>Limitation:</strong> {component.gap}</p>}{component.evidenceIds?.length ? <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">{component.evidenceIds.map((id: number) => { const source = sourceFor(active, id); return source.evidence ? <button key={id} onClick={() => setSelectedEvidenceId(id)} className={`py-1.5 text-xs font-semibold text-primary underline underline-offset-4 ${selectedEvidenceId === id ? "opacity-60" : ""}`}>View source: {source.document?.title ?? "evidence"}</button> : null; })}</div> : <p className="mt-2 text-xs text-muted-foreground">We haven't linked a specific quote to this yet.</p>}</div>)}</div>;
}

export function EvidenceMap({ active, assessmentByRequirement, selectedEvidenceId, setSelectedEvidenceId, objective }: any) {
  const requirements = active?.requirements ?? [];
  const statuses = ["directly_evidenced", "indirectly_relevantly_evidenced", "inferred", "not_found", "contradicted"];
  const counts = requirements.reduce((acc: any, requirement: any) => { const status = canonicalAssessment(assessmentByRequirement.get(requirement.id)?.assessment ?? "not_found"); acc[status] = (acc[status] ?? 0) + 1; return acc; }, {});
  return <section key={active?.latestAnalysis?.id ?? "empty"} className="mt-6 rise"><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Details</p><h2 className="mt-1 font-serif text-2xl font-semibold">Your strengths and gaps</h2><p className="mt-1 max-w-3xl text-sm text-muted-foreground">We check each requirement one by one. "Directly evidenced" means your documents clearly show it. "Indirectly/relevantly evidenced" means something related shows up, but it doesn't fully prove it. "Inferred" means we're reading between the lines — that's our interpretation, not solid evidence. "Not found" just means we didn't see it in what you gave us — not that you don't have it.</p></div><div className="flex flex-wrap gap-2">{statuses.map(status => <Badge key={status} variant="outline" className={assessmentStyle[status]}>{counts[status] ?? 0} {formatStatus(status)}</Badge>)}</div></div><div className="overflow-hidden rounded-xl border bg-card shadow-sm print:overflow-visible print:border-none print:shadow-none"><div className="overflow-x-auto print:overflow-visible"><table className="report-table min-w-[1100px] w-full text-left text-sm print:min-w-0 print:text-xs"><thead className="bg-muted/65 text-[11px] uppercase tracking-[.12em] text-muted-foreground"><tr><th className="w-[20%] px-4 py-3 font-semibold">What's needed</th><th className="w-[13%] px-4 py-3 font-semibold">Result</th><th className="w-[22%] px-4 py-3 font-semibold">What we found</th><th className="w-[29%] px-4 py-3 font-semibold">Details</th><th className="w-[16%] px-4 py-3 font-semibold">What's missing</th></tr></thead><tbody>{requirements.map((requirement: any) => { const assessment = assessmentByRequirement.get(requirement.id) ?? { assessment: "not_found", strength: "not_demonstrated", evidenceIds: [], interpretation: "No analysis has been run for this criterion yet.", gap: "Analyse the library after adding evidence and a target.", components: [] }; const status = canonicalAssessment(assessment.assessment); const firstSource = assessment.evidenceIds?.[0] ? sourceFor(active, assessment.evidenceIds[0]) : null; return <tr key={requirement.id}><td className="px-4 py-4 align-top"><p className="font-semibold leading-5">{requirement.criterion}</p><p className="mt-1 text-xs text-muted-foreground">{requirement.category}</p></td><td className="px-4 py-4 align-top"><Badge variant="outline" className={`${assessmentStyle[status]} capitalize`}>{formatStatus(status)}</Badge><p className="mt-2 text-xs capitalize text-muted-foreground">{formatStatus(assessment.strength)}</p></td><td className="px-4 py-4 align-top">{firstSource?.evidence ? <button onClick={() => setSelectedEvidenceId(firstSource.evidence.id)} className={`group text-left ${selectedEvidenceId === firstSource.evidence.id ? "text-primary" : ""}`}><p className="line-clamp-3 leading-5 underline decoration-primary/30 underline-offset-4 group-hover:decoration-primary">“{firstSource.evidence.statement}”</p><span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">View source <ArrowRight className="size-3" /></span></button> : <p className="text-muted-foreground">Nothing to show here yet.</p>}</td><td className="px-4 py-4 align-top"><p className="leading-5 text-muted-foreground">{assessment.interpretation}</p><ComponentChecks active={active} components={assessment.components} selectedEvidenceId={selectedEvidenceId} setSelectedEvidenceId={setSelectedEvidenceId} /></td><td className="px-4 py-4 align-top text-xs leading-5 text-muted-foreground">{assessment.gap}</td></tr>; })}</tbody></table></div></div>{objective === "A" && <div className="mt-4 rounded-lg border border-primary/15 bg-primary/[.035] px-4 py-3 text-sm text-primary"><strong>How to read this:</strong> it only shows what your documents directly say, what's related but not quite proof, and where the gaps or guesses are. It doesn't decide whether someone should be appointed or shortlisted for the role.</div>}</section>;
}
