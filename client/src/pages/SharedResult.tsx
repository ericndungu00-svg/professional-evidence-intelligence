import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EvidenceMap, SourcePanel, sourceFor } from "@/components/EvidenceMap";
import { ObjectiveReports } from "@/components/ObjectiveReports";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2, SearchCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";

// A public, permanent page for a guest result someone chose to make
// shareable (see the "Make this shareable" control in Home.tsx and
// guest.makeShareable in routers.ts). No auth, no session -- this renders
// off whatever shared.getBySlug returns, the same GuestAnalysisResult shape
// Home.tsx's own guest flow produces, through the same EvidenceMap /
// ObjectiveReports / SourcePanel components Home.tsx uses for a live guest
// result. Objective A only, since that's all a guest result has ever
// contained.
export default function SharedResult() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<number | null>(null);
  const query = trpc.shared.getBySlug.useQuery({ slug: slug ?? "" }, { enabled: !!slug, retry: false });

  const active: any = query.data?.resultData;
  const assessmentByRequirement = useMemo(
    () => new Map<number, any>((active?.assessments ?? []).map((assessment: any): [number, any] => [assessment.requirementId, assessment])),
    [active]
  );
  const selectedSource = selectedEvidenceId ? sourceFor(active, selectedEvidenceId) : null;

  if (query.isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  if (query.isError || !active) {
    return <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg rounded-xl border bg-card p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto size-12 text-destructive" />
        <h1 className="mt-4 font-serif text-2xl font-semibold">This shared result wasn't found</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">The link may be mistyped, or this result may no longer be available.</p>
        <Button className="mt-6" asChild><Link href="/">Go to ProveMyCV</Link></Button>
      </div>
    </div>;
  }

  return <div className="flex min-h-screen flex-col bg-background text-foreground">
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-3 px-5 py-3 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3 text-left"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><SearchCheck className="size-5" /></span><span className="min-w-0"><span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Evidence review</span><span className="hidden truncate font-serif text-lg font-semibold leading-5 sm:block">See what your CV actually proves</span></span></Link>
        <Button asChild><Link href="/">Check your own evidence</Link></Button>
      </div>
    </header>

    <main className="mx-auto w-full max-w-[1540px] flex-1 px-5 pb-10 pt-6 lg:px-8">
      <section className="rounded-xl border bg-card px-6 py-8 shadow-sm lg:px-10">
        <div className="mb-3 flex flex-wrap items-center gap-2"><span className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">Shared result</span><Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">Public — not tied to an account</Badge></div>
        <h1 className="font-serif text-4xl font-semibold tracking-tight lg:text-5xl">{active?.profile?.currentRole ?? "A shared evidence review"}</h1>
        {active?.profile && <p className="mt-2 max-w-3xl text-base text-muted-foreground">{active.profile.profession}{active.profile.targetRole ? ` · Aiming for: ${active.profile.targetRole}` : ""}</p>}
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">{active?.disclaimer}</p>
      </section>

      <EvidenceMap active={active} assessmentByRequirement={assessmentByRequirement} selectedEvidenceId={selectedEvidenceId} setSelectedEvidenceId={setSelectedEvidenceId} objective="A" />
      <ObjectiveReports active={active} objective="A" assessmentByRequirement={assessmentByRequirement} selectedEvidenceId={selectedEvidenceId} setSelectedEvidenceId={setSelectedEvidenceId} onAddCurrentRole={() => {}} />

      <div className="mt-8 rounded-xl border border-primary/20 bg-primary/[.04] p-6 text-center"><p className="font-serif text-xl font-semibold">Want to check your own evidence?</p><p className="mt-1 text-sm text-muted-foreground">Try it free, right now — no account needed.</p><Button className="mt-4" asChild><Link href="/">Get started</Link></Button></div>
    </main>

    {selectedSource?.evidence && <SourcePanel evidence={selectedSource.evidence} document={selectedSource.document} onClose={() => setSelectedEvidenceId(null)} />}
  </div>;
}
