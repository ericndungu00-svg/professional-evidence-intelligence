import { useAuth } from "@/_core/hooks/useAuth";
import { GuestAnalysisDialog } from "@/components/GuestAnalysisDialog";
import { AnalysisFailureAlert } from "@/components/AnalysisFailureAlert";
import { ObjectiveReports } from "@/components/ObjectiveReports";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AuthDialog } from "@/components/AuthDialog";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowRight, BookOpenText, CheckCircle2, ChevronRight, CircleAlert, FileText, FolderOpen, Landmark, Loader2, LockKeyhole, Plus, Scale, SearchCheck, ShieldCheck, Sparkles, Target, Upload, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Objective = "A" | "B" | "C";

const objectives: Record<Objective, { title: string; label: string; description: string; icon: typeof Target }> = {
  A: { title: "Promotion and target role", label: "Objective A", description: "Map supplied evidence against a role or person specification.", icon: Target },
  B: { title: "Annual appraisal", label: "Objective B", description: "Organise documented achievements, impact, development and evidence-grounded objectives.", icon: BookOpenText },
  C: { title: "Job evaluation preparation", label: "Objective C", description: "Identify documented divergence areas for discussion only — never a banding decision.", icon: Scale },
};

const assessmentStyle: Record<string, string> = {
  directly_evidenced: "bg-emerald-50 text-emerald-800 border-emerald-200",
  indirectly_relevantly_evidenced: "bg-sky-50 text-sky-800 border-sky-200",
  inferred: "bg-violet-50 text-violet-800 border-violet-200",
  contradicted: "bg-rose-50 text-rose-800 border-rose-200",
  demonstrated: "bg-emerald-50 text-emerald-800 border-emerald-200",
  partial: "bg-amber-50 text-amber-800 border-amber-200",
  not_found: "bg-stone-100 text-stone-600 border-stone-200",
  unsupported: "bg-rose-50 text-rose-800 border-rose-200",
};

function sourceFor(active: any, evidenceId: number) {
  const evidence = active?.evidence?.find((item: any) => item.id === evidenceId);
  const document = active?.documents?.find((item: any) => String(item.id) === String(evidence?.documentId));
  return { evidence, document };
}

function formatStatus(value: string) { return value.replace(/_/g, " "); }
function canonicalAssessment(value: string) { return ({ demonstrated: "directly_evidenced", partial: "indirectly_relevantly_evidenced", unsupported: "contradicted" } as Record<string, string>)[value] ?? value; }

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const demoQuery = trpc.demo.workspace.useQuery();
  const workspaceQuery = trpc.evidence.workspace.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const [objective, setObjective] = useState<Objective>("A");
  const [activeSection, setActiveSection] = useState("evidence-map");
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [guestWorkspace, setGuestWorkspace] = useState<any>(null);
  const [entryDismissed, setEntryDismissed] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const [guestJobId, setGuestJobId] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState({ currentRole: "", profession: "", specialty: "", experience: "", currentLevel: "", targetRole: "", careerObjective: "", ownClaims: "" });
  const [uploadDraft, setUploadDraft] = useState({ title: "", documentType: "evidence" as "evidence" | "target" | "current_role", sourceKind: "CV", sourceText: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const active: any = isAuthenticated
    ? (workspaceQuery.data?.profile ? workspaceQuery.data : demoQuery.data)
    : (guestWorkspace ?? demoQuery.data);
  const isGuest = !!guestWorkspace?.isGuest;
  const isDemo = !isGuest && (!isAuthenticated || active?.profile?.isDemo === "yes" || active?.isDemo);
  const isFirstLoad = !entryDismissed && !isGuest && (!isAuthenticated || !(workspaceQuery.data?.documents?.length));
  const target = useMemo(() => active?.targetDocument ?? active?.documents?.find((document: any) => document.documentType === "target"), [active]);
  const assessmentByRequirement = useMemo(() => new Map<number, any>((active?.objectiveReports?.A?.mappings ?? active?.assessments ?? []).map((assessment: any): [number, any] => [assessment.requirementId, assessment])), [active]);
  const selectedSource = selectedEvidenceId ? sourceFor(active, selectedEvidenceId) : null;

  const saveProfile = trpc.evidence.saveProfile.useMutation({
    onSuccess: () => { utils.evidence.workspace.invalidate(); setProfileOpen(false); toast.success("Evidence profile saved."); },
    onError: error => toast.error(error.message),
  });
  const upload = trpc.evidence.upload.useMutation({
    onSuccess: data => { utils.evidence.workspace.invalidate(); setUploadOpen(false); setUploadFile(null); setUploadDraft({ title: "", documentType: "evidence", sourceKind: "CV", sourceText: "" }); toast.success(data.message); },
    onError: error => toast.error(error.message),
  });
  const pasteTarget = trpc.evidence.pasteTarget.useMutation({
    onSuccess: data => { utils.evidence.workspace.invalidate(); setUploadOpen(false); setUploadDraft({ title: "", documentType: "evidence", sourceKind: "CV", sourceText: "" }); toast.success(data.message); },
    onError: error => toast.error(error.message),
  });
  const pasteEvidence = trpc.evidence.pasteEvidence.useMutation({
    onSuccess: data => { utils.evidence.workspace.invalidate(); setUploadOpen(false); setUploadDraft({ title: "", documentType: "evidence", sourceKind: "CV", sourceText: "" }); toast.success(data.message); },
    onError: error => toast.error(error.message),
  });
  const loadDemo = trpc.evidence.loadDemo.useMutation({
    onSuccess: data => { utils.evidence.workspace.invalidate(); toast.success(data.message); },
    onError: error => toast.error(error.message),
  });
  // The analysis endpoints kick off a background job and return immediately
  // (rather than blocking the request on the full LLM pipeline, which can
  // exceed platform/proxy timeouts on longer submissions) — these mutations
  // just start the job; the queries below poll for completion.
  const runAnalysis = trpc.evidence.runAnalysis.useMutation({
    onSuccess: data => { setAnalysisError(null); setAnalysisId(data.analysisId); },
    onError: error => { setAnalysisError(error.message); toast.error(error.message); },
  });
  const analysisStatusQuery = trpc.evidence.analysisStatus.useQuery(
    { analysisId: analysisId ?? 0 },
    { enabled: analysisId !== null, refetchInterval: query => (query.state.data?.status === "processing" ? 1500 : false) }
  );
  useEffect(() => {
    const data = analysisStatusQuery.data;
    if (!data || data.status === "processing") return;
    if (data.status === "complete") {
      utils.evidence.workspace.invalidate();
      setActiveSection(data.objectiveReport?.objective === "A" ? "evidence-map" : "objective-summary");
      toast.success(data.summary ?? "Analysis complete.");
    } else {
      const message = data.summary ?? "Analysis failed.";
      setAnalysisError(message);
      toast.error(message);
    }
    setAnalysisId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisStatusQuery.data]);

  const guestAnalysis = trpc.guest.startAnalyse.useMutation({
    onSuccess: data => setGuestJobId(data.jobId),
    onError: error => toast.error(error.message),
  });
  const guestAnalysisStatusQuery = trpc.guest.analyseStatus.useQuery(
    { jobId: guestJobId ?? "" },
    { enabled: guestJobId !== null, refetchInterval: query => (query.state.data?.status === "processing" ? 1500 : false) }
  );
  useEffect(() => {
    const job = guestAnalysisStatusQuery.data;
    if (!job || job.status === "processing") return;
    if (job.status === "complete") {
      setGuestWorkspace(job.result);
      setObjective("A");
      setActiveSection("evidence-map");
      setGuestOpen(false);
      toast.success("Guest Evidence Map generated. It will not be saved to a library.");
    } else {
      toast.error(job.error ?? "Guest analysis failed.");
    }
    setGuestJobId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestAnalysisStatusQuery.data]);
  const isAnalysing = runAnalysis.isPending || analysisId !== null;
  const isGuestAnalysing = guestAnalysis.isPending || guestJobId !== null;

  // Once signed in, the authenticated evidence library is the source of
  // truth; leftover guest-mode state (from a guest analysis run earlier in
  // the same tab) must not keep shadowing it, or the UI shows stale guest
  // results and the "Guest session" badge even while logged in.
  useEffect(() => {
    if (isAuthenticated && guestWorkspace) { setGuestWorkspace(null); setGuestJobId(null); }
  }, [isAuthenticated, guestWorkspace]);

  const ensureAuth = () => { if (!isAuthenticated) { toast.message("Sign in to save evidence to your private library."); setAuthOpen(true); return false; } return true; };

  async function handleProfile(event: FormEvent) {
    event.preventDefault();
    if (!ensureAuth()) return;
    saveProfile.mutate(profileDraft);
  }

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    if (!ensureAuth()) return;
    if (uploadDraft.documentType === "target" && uploadDraft.sourceText.trim() && !uploadFile) {
      pasteTarget.mutate({ title: uploadDraft.title || "Pasted target specification", sourceKind: uploadDraft.sourceKind, text: uploadDraft.sourceText });
      return;
    }
    if (uploadDraft.documentType === "evidence" && uploadDraft.sourceText.trim() && !uploadFile) {
      pasteEvidence.mutate({ title: uploadDraft.title || "Pasted evidence", sourceKind: uploadDraft.sourceKind, text: uploadDraft.sourceText });
      return;
    }
    if (!uploadFile) { toast.error("Choose a TXT, PDF, or DOCX document, or paste evidence or a target specification."); return; }
    const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("Could not read file.")); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(uploadFile); });
    const dataBase64 = dataUrl.split(",")[1] ?? "";
    upload.mutate({ title: uploadDraft.title || uploadFile.name.replace(/\.[^.]+$/, ""), documentType: uploadDraft.documentType, sourceKind: uploadDraft.sourceKind, sourceText: uploadDraft.sourceText || undefined, fileName: uploadFile.name, mimeType: uploadFile.type || "application/octet-stream", dataBase64 });
  }

  function chooseObjective(next: Objective) { setObjective(next); setActiveSection(next === "A" ? "evidence-map" : "objective-summary"); }

  if (authLoading || demoQuery.isLoading) return <div className="min-h-screen grid place-items-center"><Loader2 className="size-7 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <a href="#top" className="flex min-w-0 items-center gap-3"><span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><SearchCheck className="size-5" /></span><span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Evidence intelligence</span><span className="block truncate font-serif text-lg font-semibold leading-5">Professional evidence review</span></span></a>
          <div className="hidden items-center gap-5 text-xs text-muted-foreground md:flex"><span>Source-first assessment</span><span className="h-3 w-px bg-border" /><span>No invented evidence</span></div>
          <div className="flex items-center gap-2">{isDemo && <Badge variant="outline" className="hidden border-amber-300 bg-amber-50 text-amber-800 sm:flex">Fictional demonstration</Badge>}{isGuest && <Badge variant="outline" className="hidden border-primary/30 bg-primary/5 text-primary sm:flex">Guest session — unsaved</Badge>}{isAuthenticated ? <><span className="hidden text-sm font-medium lg:inline">{user?.name}</span><Button variant="outline" size="sm" onClick={logout}>Sign out</Button></> : <Button size="sm" onClick={() => setAuthOpen(true)}>Sign in to save a library</Button>}</div>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-[1540px] px-5 pb-28 pt-6 lg:px-8">
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-primary/15 bg-secondary/55 px-4 py-3 text-sm text-secondary-foreground"><ShieldCheck className="mt-0.5 size-5 shrink-0" /><p><strong>Decision support, not a determination.</strong> This tool analyses supplied professional evidence only. It does not determine NHS AfC banding, employment eligibility, legal rights, job-evaluation outcomes, or professional competence.</p></div>

        {isFirstLoad ? <FirstLoadEntry onStart={() => setGuestOpen(true)} onExploreDemo={() => setEntryDismissed(true)} /> : <><section className="paper-grid relative overflow-hidden rounded-xl border bg-card px-6 py-8 shadow-[0_12px_36px_-26px_rgba(14,32,50,.35)] lg:px-10">
          <div className="relative max-w-4xl"><div className="mb-3 flex items-center gap-2"><span className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">Evidence profile</span>{isDemo && <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">Fictional demonstration data</Badge>}{isGuest && <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">Guest analysis — not saved</Badge>}</div><h1 className="font-serif text-3xl font-semibold tracking-tight lg:text-4xl">{active?.profile?.currentRole ?? "Build your evidence profile"}</h1><p className="mt-2 max-w-3xl text-base text-muted-foreground">{active?.profile ? `${active.profile.profession}${active.profile.specialty ? ` · ${active.profile.specialty}` : ""}${active.profile.experience ? ` · ${active.profile.experience}` : ""}` : "Run a one-session Evidence Map without an account, or sign in to create a private, persistent evidence library."}</p><div className="mt-5 flex flex-wrap gap-2">{active?.profile?.targetRole && <Badge variant="secondary" className="font-medium">Target: {active.profile.targetRole}</Badge>}{active?.profile?.currentLevel && <Badge variant="outline">Current level: {active.profile.currentLevel}</Badge>}{isDemo && <Badge variant="outline">Sarah Mwangi</Badge>}</div></div>
          <div className="relative mt-7 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4"><Step number="01" label="Profile" active={!!active?.profile} /><Step number="02" label="Evidence" active={(active?.documents?.filter((document: any) => document.documentType === "evidence")?.length ?? 0) > 0} /><Step number="03" label="Target" active={!!target} /><Step number="04" label="Review" active={(active?.assessments?.length ?? 0) > 0} /></div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="xl:sticky xl:top-24 xl:h-fit"><nav className="rounded-xl border bg-card p-2 shadow-sm"><NavButton active={activeSection === "evidence-map"} icon={SearchCheck} label="Evidence map" onClick={() => setActiveSection("evidence-map")} /><NavButton active={activeSection === "library"} icon={FolderOpen} label="Evidence library" onClick={() => setActiveSection("library")} /><NavButton active={activeSection === "objective-summary"} icon={BookOpenText} label="Objective output" onClick={() => setActiveSection("objective-summary")} /><NavButton active={activeSection === "safety"} icon={ShieldCheck} label="Method & safeguards" onClick={() => setActiveSection("safety")} /></nav><div className="mt-4 rounded-xl border border-dashed bg-card p-4"><p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Current objective</p><p className="mt-1 font-serif text-lg font-semibold">{objectives[objective].label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{objectives[objective].title}</p></div></aside>

          <div className="min-w-0">
            <section className="rise rounded-xl border bg-card p-5 shadow-sm lg:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Choose an analysis lens</p><h2 className="mt-1 font-serif text-2xl font-semibold">What would you like the supplied evidence to answer?</h2><p className="mt-1 text-xs text-muted-foreground">Evidence Map and Objective A work in a one-session guest mode. Sign in only to save a library or analysis history.</p></div><Button onClick={() => { setAnalysisError(null); if (isAuthenticated) runAnalysis.mutate({ objective }); else setGuestOpen(true); }} disabled={isAuthenticated && isAnalysing} className="shrink-0">{(isAuthenticated && isAnalysing) ? <Loader2 className="animate-spin" /> : <Sparkles />}{isAuthenticated ? "Analyse my library" : "Analyse without signing in"}</Button></div><div className="mt-5 grid gap-3 lg:grid-cols-3">{(Object.keys(objectives) as Objective[]).map(key => { const item = objectives[key]; const Icon = item.icon; return <button key={key} onClick={() => chooseObjective(key)} className={`rounded-lg border p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm ${objective === key ? "border-primary bg-primary/[.035] ring-1 ring-primary/20" : "bg-card hover:border-primary/40"}`}><div className="flex items-center justify-between"><span className="grid size-8 place-items-center rounded-md bg-secondary text-secondary-foreground"><Icon className="size-4" /></span><span className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">{item.label}</span></div><p className="mt-4 font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p></button>; })}</div></section>

            {analysisError && <AnalysisFailureAlert message={analysisError} />}

            {activeSection === "evidence-map" && <EvidenceMap active={active} assessmentByRequirement={assessmentByRequirement} selectedEvidenceId={selectedEvidenceId} setSelectedEvidenceId={setSelectedEvidenceId} objective={objective} />}
            {activeSection === "library" && <EvidenceLibrary active={active} isAuthenticated={isAuthenticated} isDemo={isDemo} uploadOpen={uploadOpen} setUploadOpen={setUploadOpen} profileOpen={profileOpen} setProfileOpen={setProfileOpen} profileDraft={profileDraft} setProfileDraft={setProfileDraft} onProfileSubmit={handleProfile} uploadDraft={uploadDraft} setUploadDraft={setUploadDraft} uploadFile={uploadFile} setUploadFile={setUploadFile} onUploadSubmit={handleUpload} uploadPending={upload.isPending || pasteTarget.isPending || pasteEvidence.isPending} onLoadDemo={() => { if (ensureAuth()) loadDemo.mutate(); }} demoLoading={loadDemo.isPending} />}
            {activeSection === "objective-summary" && <ObjectiveReports active={active} objective={objective} assessmentByRequirement={assessmentByRequirement} selectedEvidenceId={selectedEvidenceId} setSelectedEvidenceId={setSelectedEvidenceId} />}
            {activeSection === "safety" && <Safeguards />}
          </div>
        </div></>}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/20 bg-primary px-4 py-2 text-center text-[11px] leading-4 text-primary-foreground shadow-lg">This tool provides decision support from supplied evidence only. It does not determine NHS AfC banding, employment eligibility, legal rights, job-evaluation outcomes, or professional competence.</div>
      {selectedSource?.evidence && <SourcePanel evidence={selectedSource.evidence} document={selectedSource.document} onClose={() => setSelectedEvidenceId(null)} />}
      <GuestAnalysisDialog open={guestOpen} onOpenChange={setGuestOpen} onSubmit={data => guestAnalysis.mutate(data)} pending={isGuestAnalysing} />
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}

function Step({ number, label, active }: { number: string; label: string; active: boolean }) { return <div className="flex items-center gap-3 bg-card px-4 py-3"><span className={`grid size-7 place-items-center rounded-full text-[10px] font-bold ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{active ? <CheckCircle2 className="size-4" /> : number}</span><span className="text-sm font-medium">{label}</span></div>; }
function NavButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Target; label: string; onClick: () => void }) { return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="size-4" />{label}<ChevronRight className={`ml-auto size-4 ${active ? "opacity-100" : "opacity-0"}`} /></button>; }

function FirstLoadEntry({ onStart, onExploreDemo }: { onStart: () => void; onExploreDemo: () => void }) {
  return <section className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,.75fr)]"><div className="relative overflow-hidden rounded-2xl bg-primary px-7 py-9 text-primary-foreground shadow-[0_18px_45px_-24px_rgba(14,32,50,.65)] lg:px-10 lg:py-12"><div className="absolute -right-20 -top-24 size-72 rounded-full border border-white/15" /><div className="absolute -bottom-24 right-24 size-52 rounded-full border border-white/10" /><div className="relative max-w-2xl"><p className="font-mono text-[11px] font-bold uppercase tracking-[.18em] text-white/70">Start with your own material</p><h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.04] tracking-tight sm:text-5xl">See what your evidence actually proves.</h1><p className="mt-4 max-w-xl text-base leading-7 text-white/80">Paste the evidence you want reviewed and the role criteria you are working towards. Receive a source-linked Evidence Map in this session, with no account required.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"><Button size="lg" onClick={onStart} className="bg-white px-6 text-primary shadow-sm hover:bg-white/90"><Sparkles className="size-4" />Start my own evidence review</Button><span className="text-sm text-white/70">Takes about 5 minutes</span></div><div className="mt-8 grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-3"><EntryStep number="01" label="Paste your evidence" /><EntryStep number="02" label="Paste the target criteria" /><EntryStep number="03" label="Inspect the source-linked map" /></div></div></div><aside className="rounded-2xl border bg-card p-6 shadow-sm"><Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">Fictional demonstration</Badge><h2 className="mt-4 font-serif text-2xl font-semibold">Prefer to look first?</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Explore Sarah Mwangi’s fictional Band 6-to-Band 7 example. It shows what an evidence map looks like, but it is not your data.</p><Button variant="outline" className="mt-6 w-full justify-between" onClick={onExploreDemo}>Explore Sarah’s example <ArrowRight className="size-4" /></Button><p className="mt-4 text-xs leading-5 text-muted-foreground">You can start your own review at any time; the fictional example is optional.</p></aside></section>;
}
function EntryStep({ number, label }: { number: string; label: string }) { return <div className="flex items-center gap-2 text-xs leading-4 text-white/80"><span className="grid size-6 shrink-0 place-items-center rounded-full border border-white/30 font-mono text-[10px] font-bold text-white">{number}</span>{label}</div>; }

function ComponentChecks({ active, components, selectedEvidenceId, setSelectedEvidenceId }: any) {
  if (!components?.length) return null;
  return <div className="mt-3 space-y-2 border-t border-dashed pt-3"><p className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Component check</p>{components.map((component: any, index: number) => <div key={`${component.component}-${index}`} className="rounded-md bg-muted/35 p-2.5"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={assessmentStyle[canonicalAssessment(component.assessment)]}>{formatStatus(canonicalAssessment(component.assessment))}</Badge><span className="text-xs font-semibold">{component.component}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{component.interpretation}</p>{component.gap && <p className="mt-1 text-xs leading-5 text-amber-800"><strong>Limitation:</strong> {component.gap}</p>}{component.evidenceIds?.length ? <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">{component.evidenceIds.map((id: number) => { const source = sourceFor(active, id); return source.evidence ? <button key={id} onClick={() => setSelectedEvidenceId(id)} className={`text-xs font-semibold text-primary underline underline-offset-4 ${selectedEvidenceId === id ? "opacity-60" : ""}`}>View source: {source.document?.title ?? "evidence"}</button> : null; })}</div> : <p className="mt-2 text-xs text-muted-foreground">No source passage selected for this component.</p>}</div>)}</div>;
}

function EvidenceMap({ active, assessmentByRequirement, selectedEvidenceId, setSelectedEvidenceId, objective }: any) {
  const requirements = active?.requirements ?? [];
  const statuses = ["directly_evidenced", "indirectly_relevantly_evidenced", "inferred", "not_found", "contradicted"];
  const counts = requirements.reduce((acc: any, requirement: any) => { const status = canonicalAssessment(assessmentByRequirement.get(requirement.id)?.assessment ?? "not_found"); acc[status] = (acc[status] ?? 0) + 1; return acc; }, {});
  return <section className="mt-6 rise"><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Traceable coverage</p><h2 className="mt-1 font-serif text-2xl font-semibold">Evidence map</h2><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Each requirement is checked component by component. “Directly evidenced” requires explicit source support; “indirectly/relevantly evidenced” means the source is related but does not prove the component; “inferred” is labelled as interpretation, not evidence. “Not found” means not found in the supplied library.</p></div><div className="flex flex-wrap gap-2">{statuses.map(status => <Badge key={status} variant="outline" className={assessmentStyle[status]}>{counts[status] ?? 0} {formatStatus(status)}</Badge>)}</div></div><div className="overflow-hidden rounded-xl border bg-card shadow-sm"><div className="overflow-x-auto"><table className="report-table min-w-[1100px] w-full text-left text-sm"><thead className="bg-muted/65 text-[10px] uppercase tracking-[.12em] text-muted-foreground"><tr><th className="w-[20%] px-4 py-3 font-semibold">Requirement</th><th className="w-[13%] px-4 py-3 font-semibold">Assessment</th><th className="w-[22%] px-4 py-3 font-semibold">Evidence found</th><th className="w-[29%] px-4 py-3 font-semibold">Interpretation and component checks</th><th className="w-[16%] px-4 py-3 font-semibold">Gap</th></tr></thead><tbody>{requirements.map((requirement: any) => { const assessment = assessmentByRequirement.get(requirement.id) ?? { assessment: "not_found", strength: "not_demonstrated", evidenceIds: [], interpretation: "No analysis has been run for this criterion yet.", gap: "Analyse the library after adding evidence and a target.", components: [] }; const status = canonicalAssessment(assessment.assessment); const firstSource = assessment.evidenceIds?.[0] ? sourceFor(active, assessment.evidenceIds[0]) : null; return <tr key={requirement.id}><td className="px-4 py-4 align-top"><p className="font-semibold leading-5">{requirement.criterion}</p><p className="mt-1 text-xs text-muted-foreground">{requirement.category}</p></td><td className="px-4 py-4 align-top"><Badge variant="outline" className={`${assessmentStyle[status]} capitalize`}>{formatStatus(status)}</Badge><p className="mt-2 text-xs capitalize text-muted-foreground">{formatStatus(assessment.strength)}</p></td><td className="px-4 py-4 align-top">{firstSource ? <button onClick={() => setSelectedEvidenceId(firstSource.evidence.id)} className={`group text-left ${selectedEvidenceId === firstSource.evidence.id ? "text-primary" : ""}`}><p className="line-clamp-3 leading-5 underline decoration-primary/30 underline-offset-4 group-hover:decoration-primary">“{firstSource.evidence.statement}”</p><span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">View source <ArrowRight className="size-3" /></span></button> : <p className="text-muted-foreground">No supporting passage selected.</p>}</td><td className="px-4 py-4 align-top"><p className="leading-5 text-muted-foreground">{assessment.interpretation}</p><ComponentChecks active={active} components={assessment.components} selectedEvidenceId={selectedEvidenceId} setSelectedEvidenceId={setSelectedEvidenceId} /></td><td className="px-4 py-4 align-top text-xs leading-5 text-muted-foreground">{assessment.gap}</td></tr>; })}</tbody></table></div></div>{objective === "A" && <div className="mt-4 rounded-lg border border-primary/15 bg-primary/[.035] px-4 py-3 text-sm text-primary"><strong>Reading this map:</strong> it describes only what the supplied documents directly show, what is merely relevant, and what remains an inference or a gap. It does not determine whether someone should be appointed or shortlisted.</div>}</section>;
}

function EvidenceLibrary({ active, isAuthenticated, isDemo, uploadOpen, setUploadOpen, profileOpen, setProfileOpen, profileDraft, setProfileDraft, onProfileSubmit, uploadDraft, setUploadDraft, uploadFile, setUploadFile, onUploadSubmit, uploadPending, onLoadDemo, demoLoading }: any) {
  const evidenceDocs = (active?.documents ?? []).filter((document: any) => document.documentType === "evidence");
  return <section className="mt-6 rise"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Persistent evidence library</p><h2 className="mt-1 font-serif text-2xl font-semibold">Original documents, structured evidence</h2><p className="mt-1 text-sm text-muted-foreground">Files remain tied to their extracted passages and are held in your private library when signed in.</p></div><div className="flex gap-2"><ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} draft={profileDraft} setDraft={setProfileDraft} onSubmit={onProfileSubmit} /><UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} draft={uploadDraft} setDraft={setUploadDraft} file={uploadFile} setFile={setUploadFile} onSubmit={onUploadSubmit} pending={uploadPending} /></div></div>{isDemo && <div className="mt-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"><div><strong>Sarah Mwangi’s records are fictional.</strong> Preview the workflow freely; sign in to import a separate demo copy into your own private workspace.</div>{isAuthenticated && <Button size="sm" variant="outline" className="border-amber-300 bg-background" onClick={onLoadDemo} disabled={demoLoading}>{demoLoading && <Loader2 className="animate-spin" />}Import demo to library</Button>}</div>}<div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{evidenceDocs.map((document: any) => <article key={document.id} className="rounded-xl border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="grid size-9 place-items-center rounded-md bg-secondary text-secondary-foreground"><FileText className="size-4" /></span><Badge variant="outline" className="text-[10px]">{document.sourceKind}</Badge></div><h3 className="mt-5 font-semibold leading-5">{document.title}</h3><p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{document.fileName}</p><div className="mt-4 border-t pt-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3 text-emerald-700" />{document.extractionStatus === "ready" ? "Text prepared for analysis" : "Text needs review"}</span></div></article>)}{!evidenceDocs.length && <div className="col-span-full rounded-xl border border-dashed bg-muted/20 p-8 text-center"><FolderOpen className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 font-medium">Your evidence library is empty.</p><p className="mt-1 text-sm text-muted-foreground">Upload a document or open the fictional demonstration records.</p></div>}</div><div className="mt-5 rounded-xl border bg-card p-5 shadow-sm"><div className="flex items-start gap-3"><Target className="mt-0.5 size-5 text-primary" /><div><p className="font-semibold">Target specification</p><p className="mt-1 text-sm text-muted-foreground">{active?.targetDocument?.title ?? active?.documents?.find((document: any) => document.documentType === "target")?.title ?? "No target specification saved yet."}</p><p className="mt-2 text-xs text-muted-foreground">{active?.requirements?.length ?? 0} distinct criteria are ready to be assessed.</p></div></div></div></section>;
}

function ObjectiveOutput({ active, objective, assessmentByRequirement, selectedEvidenceId, setSelectedEvidenceId }: { active: any; objective: Objective; assessmentByRequirement: any; selectedEvidenceId: number | null; setSelectedEvidenceId: (id: number) => void }) {
  const assessments = active?.assessments ?? [];
  const requirements = active?.requirements ?? [];
  const finding = (status: string) => assessments.filter((item: any) => item.assessment === status);
  const strongest = finding("demonstrated").slice(0, 3);
  const gaps = assessments.filter((item: any) => item.assessment === "partial" || item.assessment === "not_found" || item.assessment === "unsupported").slice(0, 4);
  const requirementFor = (id: any) => requirements.find((item: any) => item.id === id);
  return <section className="mt-6 rise"><div className="rounded-xl border bg-card p-6 shadow-sm"><p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-primary">{objectives[objective].label}</p><h2 className="mt-1 font-serif text-2xl font-semibold">{objectives[objective].title} output</h2>{objective === "A" && <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{active?.isGuest ? "This one-session Objective A output is generated from the text you pasted. It is not saved to an evidence library; sign in if you want to retain documents, findings, and analysis history." : "The strongest supplied evidence relates to autonomous clinical practice, complex patient management, colleague support and QI participation. The main limitations are not a lack of claimed potential, but the absence of documentary evidence of formal project ownership and presentation of QI findings."}</p>}{objective === "B" && <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">This evidence-grounded appraisal view separates documented achievement from development evidence that still needs building. It does not invent SMART objectives detached from the record.</p>}{objective === "C" && <div className="mt-3 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><Landmark className="mt-0.5 size-5 shrink-0" />This view highlights potential areas for discussion or formal evaluation only. It makes no conclusion about AfC banding, job evaluation, entitlement, or legal position.</div>}</div><div className="mt-5 grid gap-5 lg:grid-cols-2"><OutputCard icon={CheckCircle2} title={objective === "B" ? "Documented achievements" : "Strongest demonstrated areas"} color="text-emerald-700" items={strongest.map((item: any) => ({ title: requirementFor(item.requirementId)?.criterion ?? "Evidence finding", body: item.interpretation, evidenceIds: item.evidenceIds }))} active={active} selectedEvidenceId={selectedEvidenceId} setSelectedEvidenceId={setSelectedEvidenceId} /><OutputCard icon={CircleAlert} title={objective === "B" ? "Development evidence to build" : objective === "C" ? "Areas that may warrant discussion" : "Evidence gaps and qualifications"} color="text-amber-700" items={gaps.map((item: any) => ({ title: requirementFor(item.requirementId)?.criterion ?? "Evidence finding", body: item.gap, evidenceIds: item.evidenceIds, nextStep: item.nextStep }))} active={active} selectedEvidenceId={selectedEvidenceId} setSelectedEvidenceId={setSelectedEvidenceId} /></div>{active?.contradictions?.length > 0 && <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50/60 p-5"><div className="flex gap-3"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-800" /><div><h3 className="font-semibold text-rose-950">Claims and evidence requiring qualification</h3><div className="mt-3 space-y-3">{active.contradictions.map((item: any) => <div key={item.id ?? item.claim} className="rounded-lg border border-rose-200 bg-background/70 p-3"><p className="text-sm font-medium text-rose-950">{item.claim}</p><p className="mt-1 text-sm leading-5 text-rose-900">{item.explanation}</p>{item.evidenceIds?.[0] && <button onClick={() => setSelectedEvidenceId(item.evidenceIds[0])} className="mt-2 text-xs font-semibold text-rose-800 underline underline-offset-4">Inspect cited source</button>}</div>)}</div></div></div></div>}</section>;
}

function OutputCard({ icon: Icon, title, color, items, active, selectedEvidenceId, setSelectedEvidenceId }: any) { return <article className="rounded-xl border bg-card p-5 shadow-sm"><div className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded-md bg-muted ${color}`}><Icon className="size-5" /></span><h3 className="font-serif text-xl font-semibold">{title}</h3></div><div className="mt-5 space-y-4">{items.length ? items.map((item: any, index: number) => { const source = item.evidenceIds?.[0] ? sourceFor(active, item.evidenceIds[0]) : null; return <div key={`${item.title}-${index}`} className="border-l-2 border-border pl-4"><p className="font-semibold text-sm">{item.title}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{item.body}</p>{item.nextStep && <p className="mt-2 rounded bg-secondary/70 px-2.5 py-2 text-xs leading-5 text-secondary-foreground"><strong>Evidence-building next step:</strong> {item.nextStep}</p>}{source && <button onClick={() => setSelectedEvidenceId(source.evidence.id)} className={`mt-2 text-xs font-semibold text-primary underline underline-offset-4 ${selectedEvidenceId === source.evidence.id ? "opacity-60" : ""}`}>View evidence in {source.document?.title ?? "source document"}</button>}</div>; }) : <p className="text-sm text-muted-foreground">Run analysis after adding a target and evidence library.</p>}</div></article>; }

function Safeguards() { return <section className="mt-6 rise"><div className="rounded-xl border bg-card p-6 shadow-sm"><p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-primary">Trust & safety method</p><h2 className="mt-1 font-serif text-2xl font-semibold">What this instrument does — and does not do</h2><div className="mt-6 grid gap-5 lg:grid-cols-2"><Guardrail title="Evidence before interpretation" body="Every assessment links to an extracted passage held against its original source document. When a location is not established, the system says so instead of creating one." /><Guardrail title="No manufactured achievement" body="Participation is not treated as ownership, informal advice is not automatically formal leadership, and project outcomes are not attributed to an individual without direct support." /><Guardrail title="Careful absence language" body="“Not found” means no meaningful support was found in the supplied library. It does not say that someone lacks the experience or capability." /><Guardrail title="Decision support only" body="The product does not determine NHS AfC banding, employment eligibility, professional competence, legal rights, job evaluation outcomes, or any HR decision." /></div></div></section>; }
function Guardrail({ title, body }: { title: string; body: string }) { return <div className="rounded-lg border bg-muted/25 p-4"><LockKeyhole className="size-4 text-primary" /><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p></div>; }

function SourcePanel({ evidence, document, onClose }: any) { return <aside className="fixed bottom-12 right-4 z-50 w-[min(440px,calc(100vw-2rem))] rounded-xl border bg-card p-5 shadow-2xl rise"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-primary">Source trace</p><h2 className="mt-1 font-serif text-xl font-semibold">{document?.title ?? "Source document"}</h2></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close source inspector"><X className="size-4" /></Button></div><div className="mt-4 rounded-lg border bg-muted/40 p-4"><p className="text-sm leading-6">“{evidence.excerpt}”</p></div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><p className="font-mono uppercase tracking-wide text-muted-foreground">Location</p><p className="mt-1 font-medium">{evidence.sourceLocation}</p></div><div><p className="font-mono uppercase tracking-wide text-muted-foreground">Evidence type</p><p className="mt-1 font-medium">{evidence.evidenceType}</p></div></div><p className="mt-4 border-t pt-3 text-xs leading-5 text-muted-foreground">This conclusion is based on the passage above. The source is shown so you can judge the interpretation yourself.</p></aside>; }

function ProfileDialog({ open, onOpenChange, draft, setDraft, onSubmit }: any) { return <Dialog open={open} onOpenChange={onOpenChange}><DialogTrigger asChild><Button variant="outline"><Plus />Profile</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle className="font-serif text-2xl">Build your evidence profile</DialogTitle><DialogDescription>This helps organise the library; it is not used to infer undocumented achievements.</DialogDescription></DialogHeader><form onSubmit={onSubmit} className="grid gap-4 py-2 sm:grid-cols-2"><Field label="Current role"><Input required value={draft.currentRole} onChange={event => setDraft({ ...draft, currentRole: event.target.value })} /></Field><Field label="Profession"><Input required value={draft.profession} onChange={event => setDraft({ ...draft, profession: event.target.value })} /></Field><Field label="Specialty"><Input value={draft.specialty} onChange={event => setDraft({ ...draft, specialty: event.target.value })} /></Field><Field label="Experience"><Input placeholder="e.g. 7 years post-registration" value={draft.experience} onChange={event => setDraft({ ...draft, experience: event.target.value })} /></Field><Field label="Current level / band"><Input value={draft.currentLevel} onChange={event => setDraft({ ...draft, currentLevel: event.target.value })} /></Field><Field label="Target role"><Input value={draft.targetRole} onChange={event => setDraft({ ...draft, targetRole: event.target.value })} /></Field><div className="sm:col-span-2"><Field label="Career objective"><Textarea value={draft.careerObjective} onChange={event => setDraft({ ...draft, careerObjective: event.target.value })} /></Field></div><div className="sm:col-span-2"><Field label="Your own claim or question"><Textarea placeholder="Optional: State what you believe the evidence demonstrates. The system will assess the supplied documents against it." value={draft.ownClaims} onChange={event => setDraft({ ...draft, ownClaims: event.target.value })} /></Field></div><div className="sm:col-span-2 flex justify-end"><Button type="submit">Save profile</Button></div></form></DialogContent></Dialog>; }
function UploadDialog({ open, onOpenChange, draft, setDraft, file, setFile, onSubmit, pending }: any) { return <Dialog open={open} onOpenChange={onOpenChange}><DialogTrigger asChild><Button><Upload />Add document</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle className="font-serif text-2xl">Add source document</DialogTitle><DialogDescription>Upload a TXT, PDF, or DOCX file up to 10 MB, or paste evidence, a target specification, or a current role description directly.</DialogDescription></DialogHeader><form onSubmit={onSubmit} className="grid gap-4 py-2"><Field label="Document title"><Input placeholder="e.g. Current Band 6 role description" value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Document purpose"><Select value={draft.documentType} onValueChange={(value: "evidence" | "target" | "current_role") => setDraft({ ...draft, documentType: value, sourceKind: value === "target" ? "Person specification" : value === "current_role" ? "Current role responsibilities" : draft.sourceKind })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="evidence">Professional evidence</SelectItem><SelectItem value="target">Target specification — Objective A</SelectItem><SelectItem value="current_role">Current role description — Objective C</SelectItem></SelectContent></Select></Field><Field label="Source category"><Input value={draft.sourceKind} onChange={event => setDraft({ ...draft, sourceKind: event.target.value })} /></Field></div><Field label="Optional source file"><Input type="file" accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={event => setFile(event.target.files?.[0] ?? null)} />{file && <p className="mt-1 text-xs text-muted-foreground">Selected: {file.name}</p>}</Field><Field label={draft.documentType === "target" ? "Paste target specification (optional when a file is selected)" : draft.documentType === "current_role" ? "Paste current role responsibilities (optional when a file is selected)" : "Paste professional evidence (optional when a file is selected)"}><Textarea rows={4} className="max-h-64 overflow-y-auto" placeholder={draft.documentType === "target" ? "Paste the person specification or role criteria here." : draft.documentType === "current_role" ? "Paste the current job description or formal role responsibilities here." : "Paste a CV, appraisal, feedback, or other evidence record here. If a file is also selected, this text is used for analysis and the original file is retained separately."} value={draft.sourceText} onChange={event => setDraft({ ...draft, sourceText: event.target.value })} /></Field><div className="flex justify-end"><Button disabled={pending} type="submit">{pending && <Loader2 className="animate-spin" />}{draft.sourceText.trim() && !file ? "Store pasted text" : "Store and extract"}</Button></div></form></DialogContent></Dialog>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid gap-1.5"><Label>{label}</Label>{children}</div>; }
