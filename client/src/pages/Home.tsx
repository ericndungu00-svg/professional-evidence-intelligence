import { useAuth } from "@/_core/hooks/useAuth";
import { GuestAnalysisDialog } from "@/components/GuestAnalysisDialog";
import { AnalysisFailureAlert } from "@/components/AnalysisFailureAlert";
import { ObjectiveReports } from "@/components/ObjectiveReports";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AuthDialog } from "@/components/AuthDialog";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowRight, BookOpenText, CheckCircle2, ChevronRight, CircleAlert, FileText, FolderOpen, Landmark, Loader2, LockKeyhole, Menu, Plus, Scale, SearchCheck, ShieldCheck, Sparkles, Target, Trash2, Upload, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type Objective = "A" | "B" | "C";

const objectives: Record<Objective, { title: string; label: string; description: string; icon: typeof Target }> = {
  A: { title: "Applying for a job", label: "Objective A", description: "See how well your evidence matches a job you're going for.", icon: Target },
  B: { title: "Preparing for my appraisal", label: "Objective B", description: "Pull together what you've achieved and where you've grown, ready to talk through.", icon: BookOpenText },
  C: { title: "Wondering if my role matches my pay", label: "Objective C", description: "Compare what you actually do day-to-day against your official role — for your own reference only, never a banding/grading decision.", icon: Scale },
};

// A soft, distinct tint per objective card icon, built only from colours
// already defined as tokens in index.css (secondary/accent/primary) --
// no new colours added to the palette.
const objectiveIconTint: Record<Objective, { bg: string; fg: string }> = {
  A: { bg: "bg-secondary", fg: "text-secondary-foreground" },
  B: { bg: "bg-accent", fg: "text-accent-foreground" },
  C: { bg: "bg-primary/10", fg: "text-primary" },
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
function pluralize(count: number, noun: string) { return `${count} ${noun}${count === 1 ? "" : "s"}`; }

// The one moment worth interrupting someone for: their results are ready.
// Sonner's richColors (set globally on <Toaster>) gives every success toast
// a soft tinted background with a coloured border -- fine for routine
// confirmations ("Saved.", a document upload), but easy to miss for the
// one that actually matters. Inline `style` here deliberately overrides
// richColors' default for just this call, without touching the Toaster's
// global config or any other toast.success() in the app.
function notifyResultsReady(message: string) {
  toast.success(message, {
    duration: 6000,
    style: { background: "#059669", color: "#ffffff", border: "1px solid #047857", fontWeight: 600 },
  });
}

// Mirrors the server's own upload validation (same PDF/DOCX check, same 10 MB
// limit) so a rejected file never leaves the browser -- no wasted upload
// round-trip, and this path is fully testable without storage configured.
function validateUploadFile(file: File): string | null {
  const lower = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || lower.endsWith(".pdf");
  const isDocx = file.type.includes("wordprocessingml") || lower.endsWith(".docx");
  if (!isPdf && !isDocx) return "We can only accept PDF or DOCX files right now. Choose one of those, or paste the text in below instead.";
  if (file.size > 10 * 1024 * 1024) return "That file is too large — files must be 10 MB or smaller.";
  return null;
}
function canonicalAssessment(value: string) { return ({ demonstrated: "directly_evidenced", partial: "indirectly_relevantly_evidenced", unsupported: "contradicted" } as Record<string, string>)[value] ?? value; }

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout, deleteAccount, deleteAccountPending } = useAuth();
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
  const [proInterestOpen, setProInterestOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [guestWorkspace, setGuestWorkspace] = useState<any>(null);
  const [entryDismissed, setEntryDismissed] = useState(false);
  // Starts dismissed: the dashboard should greet a genuine returning user
  // (one whose library already had documents when the page loaded), not
  // reactively interrupt someone mid-task the moment they add their very
  // first document -- see the effect below, which decides this exactly
  // once per page load rather than on every document-count change.
  const [dashboardDismissed, setDashboardDismissed] = useState(true);
  const dashboardCheckedRef = useRef(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const [guestJobId, setGuestJobId] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState({ currentRole: "", profession: "", specialty: "", experience: "", currentLevel: "", targetRole: "", careerObjective: "", ownClaims: "" });
  const [uploadDraft, setUploadDraft] = useState({ title: "", documentType: "evidence" as "evidence" | "target" | "current_role", sourceKind: "CV", sourceText: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const active: any = isAuthenticated ? workspaceQuery.data : (guestWorkspace ?? demoQuery.data);
  const isGuest = !!guestWorkspace?.isGuest;
  const isDemo = !isGuest && (!isAuthenticated || active?.profile?.isDemo === "yes" || active?.isDemo);
  // The guest-only hero (FirstLoadEntry -- "Start now", "See the example")
  // must never render for an authenticated user, at all -- not even a
  // fresh signup with zero documents yet. Its "Start now" button opens
  // GuestAnalysisDialog, which runs the anonymous guest.startAnalyse
  // pipeline into local-only guestWorkspace state; the moment that state
  // is set, the effect below (which clears guestWorkspace whenever
  // isAuthenticated is true, so a stale guest session never shadows a real
  // login) immediately nulls it back out on the very next render, since
  // the user is already authenticated. The analysis genuinely ran, but the
  // result never has a chance to render -- confirmed live as the reported
  // "results don't show" bug, reachable only via this hero's "Start now",
  // never via the top-nav "Start new" (goHome), which was never routed
  // through guestOpen for an authenticated user in the first place. Fixed
  // by removing isAuthenticated from this condition entirely, rather than
  // patching the guest-dialog path -- an authenticated user has no
  // business seeing guest-only UI regardless of their document count.
  const isFirstLoad = !entryDismissed && !isGuest && !isAuthenticated;
  // A returning signed-in user (an existing library, not their first visit)
  // lands on a dashboard first rather than straight into an objective --
  // guest mode is untouched, and a brand-new signed-in user with no
  // documents yet still gets isFirstLoad's entry screen instead.
  const showDashboard = isAuthenticated && !isGuest && !dashboardDismissed && !isFirstLoad && (workspaceQuery.data?.documents?.length ?? 0) > 0;
  // The full disclaimer only earns its length where a result could be
  // over-read as a guarantee -- Objective A's evidence map and Objective
  // B/C's results screen. Every other screen (landing, dashboard,
  // documents, safety) gets the short form; the full text stays reachable
  // on "How this works".
  const isResultsScreen = !isFirstLoad && !showDashboard && (activeSection === "evidence-map" || activeSection === "objective-summary");
  // Once someone is past onboarding (has their own saved documents), the
  // 4-step "About you" stepper reads as stale rather than helpful -- "1
  // About you" shown as not-yet-started when they've actually got a whole
  // library and results behind them. Swapped for a short welcome message
  // with their real counts instead. Guest/demo and a genuinely first-time
  // signed-in user (isFirstLoad true, no documents yet) are untouched --
  // this only fires once entryDismissed/isFirstLoad has already resolved
  // false, i.e. exactly where the stepper would otherwise render.
  const isReturningWithHistory = isAuthenticated && !isGuest && (workspaceQuery.data?.documents?.length ?? 0) > 0;
  const returningWelcomeMessage = useMemo(() => {
    const documentCount = active?.documents?.length ?? 0;
    const resultCount = Object.keys(active?.objectiveReports ?? {}).length;
    return resultCount > 0
      ? `Welcome back. You've got ${pluralize(documentCount, "document")} ready and ${pluralize(resultCount, "result")} waiting.`
      : `Welcome back. You've got ${pluralize(documentCount, "document")} ready. Run a check whenever you're ready.`;
  }, [active]);
  const target = useMemo(() => active?.targetDocument ?? active?.documents?.find((document: any) => document.documentType === "target"), [active]);
  const assessmentByRequirement = useMemo(() => new Map<number, any>((active?.objectiveReports?.A?.mappings ?? active?.assessments ?? []).map((assessment: any): [number, any] => [assessment.requirementId, assessment])), [active]);
  const selectedSource = selectedEvidenceId ? sourceFor(active, selectedEvidenceId) : null;

  const saveProfile = trpc.evidence.saveProfile.useMutation({
    onSuccess: () => { utils.evidence.workspace.invalidate(); setProfileOpen(false); toast.success("Saved."); },
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
  const pasteCurrentRole = trpc.evidence.pasteCurrentRole.useMutation({
    onSuccess: data => { utils.evidence.workspace.invalidate(); setUploadOpen(false); setUploadDraft({ title: "", documentType: "evidence", sourceKind: "CV", sourceText: "" }); toast.success(data.message); },
    onError: error => toast.error(error.message),
  });
  const loadDemo = trpc.evidence.loadDemo.useMutation({
    onSuccess: data => { utils.evidence.workspace.invalidate(); toast.success(data.message); },
    onError: error => toast.error(error.message),
  });
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);
  const deleteDocument = trpc.evidence.deleteDocument.useMutation({
    onSuccess: data => { utils.evidence.workspace.invalidate(); toast.success(data.message); },
    onError: error => toast.error(error.message),
    onSettled: () => setDeletingDocumentId(null),
  });
  // A full reload (rather than the lighter setData/invalidate logout does)
  // is deliberate here: the account and everything in it -- workspace,
  // documents, past analyses -- no longer exists server-side the moment
  // this succeeds, and a reload is the simplest way to guarantee no
  // component is left holding a reference to now-deleted data.
  async function handleDeleteAccount(password: string) {
    try {
      await deleteAccount({ password });
      window.location.href = "/";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete your account.");
    }
  }
  // Demand-measurement only -- see ProInterestDialog. No payment is
  // initiated anywhere in this flow.
  const recordProInterest = trpc.commercial.recordProInterest.useMutation({
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
      notifyResultsReady(data.summary ?? "Analysis complete.");
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
      notifyResultsReady("Here's what we found — this won't be saved anywhere.");
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

  // Show the dashboard exactly once per page load, and only if this was
  // already a returning user with an existing library at that point --
  // deciding this reactively on every document-count change would pop the
  // dashboard up mid-task the moment someone added their very first
  // document. Explicit "Home" clicks (goHome) are a separate, always-on
  // path and aren't gated by this ref.
  useEffect(() => {
    if (dashboardCheckedRef.current || !isAuthenticated || isGuest || !workspaceQuery.data) return;
    dashboardCheckedRef.current = true;
    if ((workspaceQuery.data.documents?.length ?? 0) > 0) setDashboardDismissed(false);
  }, [isAuthenticated, isGuest, workspaceQuery.data]);

  // isFirstLoad now skips the guest hero unconditionally for an
  // authenticated user (see its own comment above), which for a fresh
  // signup with zero documents lands them on the normal workspace layout
  // with whatever activeSection already happens to be -- "evidence-map" by
  // default, an empty results table, not the add-a-document flow. Once
  // per page load, route that specific case (authenticated, zero
  // documents) to "library" instead, matching exactly what the top-nav
  // "Start new" (goHome) already does for the same account state.
  // Returning users with an existing library are unaffected: showDashboard
  // (above) already handles them via ReturningUserDashboard.
  const entryAutoRoutedRef = useRef(false);
  useEffect(() => {
    if (entryAutoRoutedRef.current || !isAuthenticated || isGuest || !workspaceQuery.data) return;
    entryAutoRoutedRef.current = true;
    if ((workspaceQuery.data.documents?.length ?? 0) === 0) setActiveSection("library");
  }, [isAuthenticated, isGuest, workspaceQuery.data]);

  const ensureAuth = () => { if (!isAuthenticated) { toast.message("Sign in to save this to your library."); setAuthOpen(true); return false; } return true; };

  // Opens the Add-document dialog pre-set to a given document type, from
  // anywhere in the app -- not just the library screen it started on. Used
  // by the plain "Add a document" button in My documents, and by the
  // Objective C empty state's "Add your current role" action, so both go
  // through the exact same real flow rather than a separate one-off.
  function openUploadFor(documentType: "evidence" | "target" | "current_role") {
    if (!ensureAuth()) return;
    setUploadDraft({ title: "", documentType, sourceKind: documentType === "target" ? "Person specification" : documentType === "current_role" ? "Current role responsibilities" : "CV", sourceText: "" });
    setUploadOpen(true);
  }

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
    if (uploadDraft.documentType === "current_role" && uploadDraft.sourceText.trim() && !uploadFile) {
      pasteCurrentRole.mutate({ title: uploadDraft.title || "Pasted current role", sourceKind: uploadDraft.sourceKind, text: uploadDraft.sourceText });
      return;
    }
    if (!uploadFile) { toast.error("Choose a file, or paste some text in first."); return; }
    const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("Could not read file.")); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(uploadFile); });
    const dataBase64 = dataUrl.split(",")[1] ?? "";
    upload.mutate({ title: uploadDraft.title || uploadFile.name.replace(/\.[^.]+$/, ""), documentType: uploadDraft.documentType, sourceKind: uploadDraft.sourceKind, sourceText: uploadDraft.sourceText || undefined, fileName: uploadFile.name, mimeType: uploadFile.type || "application/octet-stream", dataBase64 });
  }

  function chooseObjective(next: Objective) { setObjective(next); setActiveSection(next === "A" ? "evidence-map" : "objective-summary"); }

  // Single shared path to "My documents" / "My results" / "How this works",
  // used by both the persistent global top bar/hamburger menu and the
  // in-workspace contextual sidebar below -- one implementation, not two
  // that could drift apart. Dismissing entry/dashboard is a no-op when
  // neither is showing (e.g. a click from inside the sidebar), so this is
  // safe to call unconditionally from either caller.
  function navigateTo(section: string) {
    setEntryDismissed(true);
    setDashboardDismissed(true);
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Always-available way back to the start. For a signed-in user this is
  // pure navigation -- their evidence library is never cleared by this
  // (nothing here is destructive; see runAnalysis/pasteEvidence/pasteTarget,
  // which only ever add documents, never remove or replace them). For a
  // guest, nothing was ever saved, so this can safely reset the whole
  // in-memory session back to the entry screen.
  function goHome() {
    setSelectedEvidenceId(null);
    setAnalysisError(null);
    setAnalysisId(null);
    setObjective("A");
    if (!isAuthenticated) {
      setGuestWorkspace(null);
      setGuestJobId(null);
      setEntryDismissed(false);
      setActiveSection("evidence-map");
      toast.message("Back to the start.");
    } else {
      setEntryDismissed(true);
      if ((workspaceQuery.data?.documents?.length ?? 0) > 0) {
        setDashboardDismissed(false);
        toast.message("Back to your dashboard.");
      } else {
        setActiveSection("library");
        toast.message("Add new evidence or a new job description here, then pick what you'd like help with.");
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // The raw logout() from useAuth only clears server-side session state --
  // it has no knowledge of this component's local UI state. entryDismissed
  // in particular stays true from the prior authenticated session (it's set
  // true the moment any signed-in user gets past the entry screen), so
  // isFirstLoad evaluates false immediately after signing out and the real
  // logged-out landing screen never renders. Instead the app falls through
  // to the normal shell with `active` resolving to the shared demo dataset
  // (guestWorkspace is null, isAuthenticated is now false), showing Sarah's
  // example content in place of the entry screen. Confirmed live: "New
  // analysis" doesn't have this problem because goHome's unauthenticated
  // branch already resets entryDismissed -- signing out needs the same
  // reset, applied before the async logout so there's no render in between
  // where isAuthenticated is already false but entryDismissed is still
  // stale-true.
  async function handleSignOut() {
    setSelectedEvidenceId(null);
    setAnalysisError(null);
    setAnalysisId(null);
    setObjective("A");
    setGuestWorkspace(null);
    setGuestJobId(null);
    setEntryDismissed(false);
    setActiveSection("evidence-map");
    setDashboardDismissed(true);
    await logout();
  }

  // isFirstLoad below treats a missing workspaceQuery.data as "no documents
  // yet" -- correct once the query has actually resolved, but on every
  // fresh page load workspaceQuery.data is briefly undefined while it's
  // still in flight. Without waiting for it here too, a returning,
  // authenticated user with a real library would flash the guest-oriented
  // entry screen (including "Start now", which opens the unsaved guest
  // flow) until their real data arrived and the view self-corrected.
  if (authLoading || demoQuery.isLoading || (isAuthenticated && workspaceQuery.isLoading)) return <div className="min-h-screen grid place-items-center"><Loader2 className="size-7 animate-spin text-primary" /></div>;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-3 px-5 py-3 lg:px-8">
          <button type="button" onClick={goHome} className="flex min-w-0 items-center gap-3 text-left"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><SearchCheck className="size-5" /></span><span className="min-w-0"><span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Evidence review</span><span className="hidden truncate font-serif text-lg font-semibold leading-5 sm:block md:hidden xl:block">See what your CV actually proves</span></span></button>

          {/* Persistent global nav, desktop (>=768px): identical on every screen. */}
          <nav aria-label="Global" className="hidden items-center gap-1 md:flex xl:gap-2">
            <HeaderNavLink label="Start new" onClick={goHome} />
            <HeaderNavLink label="Documents" active={activeSection === "library" && !isFirstLoad && !showDashboard} onClick={() => navigateTo("library")} />
            <HeaderNavLink label="Results" active={activeSection === "objective-summary" && !isFirstLoad && !showDashboard} onClick={() => navigateTo("objective-summary")} />
            <HeaderNavLink label="How this works" active={activeSection === "safety" && !isFirstLoad && !showDashboard} onClick={() => navigateTo("safety")} />
          </nav>

          <div className="flex items-center gap-2">
            {isDemo && <Badge variant="outline" className="hidden border-amber-300 bg-amber-50 text-amber-800 sm:flex md:hidden xl:flex">Example only</Badge>}
            {isGuest && <Badge variant="outline" className="hidden border-primary/30 bg-primary/5 text-primary sm:flex md:hidden xl:flex">Not saved yet</Badge>}
            {isAuthenticated ? <>
              <span className="hidden text-sm font-medium lg:inline">{user?.name}</span>
              {!isGuest && <Button variant="outline" size="sm" onClick={() => setProInterestOpen(true)} className="hidden border-primary/30 text-primary hover:bg-primary/5 md:inline-flex">Get Pro</Button>}
              <Button variant="outline" size="sm" onClick={handleSignOut} className="hidden md:inline-flex">Sign out</Button>
            </> : <Button size="sm" onClick={() => setAuthOpen(true)} className="hidden md:inline-flex"><span className="xl:hidden">Sign in</span><span className="hidden xl:inline">Sign in to save your results</span></Button>}

            {/* Mobile (<768px): hamburger opens the same five items -- the direct fix for "New analysis" being unreachable on mobile. */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu"><Menu className="size-5" /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex w-[300px] flex-col gap-0 p-0">
                <SheetHeader className="border-b">
                  <SheetTitle className="font-serif text-lg">Evidence review</SheetTitle>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {isDemo && <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">Example only</Badge>}
                    {isGuest && <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">Not saved yet</Badge>}
                  </div>
                </SheetHeader>
                <nav aria-label="Global" className="flex flex-1 flex-col gap-1 p-3">
                  <MobileNavLink label="Start new" icon={Sparkles} onClick={() => { goHome(); setMobileNavOpen(false); }} />
                  <MobileNavLink label="Documents" icon={FolderOpen} active={activeSection === "library" && !isFirstLoad && !showDashboard} onClick={() => { navigateTo("library"); setMobileNavOpen(false); }} />
                  <MobileNavLink label="Results" icon={BookOpenText} active={activeSection === "objective-summary" && !isFirstLoad && !showDashboard} onClick={() => { navigateTo("objective-summary"); setMobileNavOpen(false); }} />
                  <MobileNavLink label="How this works" icon={ShieldCheck} active={activeSection === "safety" && !isFirstLoad && !showDashboard} onClick={() => { navigateTo("safety"); setMobileNavOpen(false); }} />
                </nav>
                <SheetFooter className="border-t">
                  {isAuthenticated ? <>
                    {user?.name && <p className="px-1 text-sm font-medium text-muted-foreground">{user.name}</p>}
                    {!isGuest && <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/5" onClick={() => { setMobileNavOpen(false); setProInterestOpen(true); }}>Get Pro</Button>}
                    <Button variant="outline" onClick={() => { setMobileNavOpen(false); handleSignOut(); }}>Sign out</Button>
                  </> : <Button onClick={() => { setMobileNavOpen(false); setAuthOpen(true); }}>Sign in to save your results</Button>}
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main id="top" className="mx-auto w-full max-w-[1540px] flex-1 px-5 pb-10 pt-6 lg:px-8">
        <div className={`mb-6 flex gap-3 rounded-lg border border-primary/15 bg-secondary/55 px-4 py-3 text-sm text-secondary-foreground ${isResultsScreen ? "items-start" : "items-center"}`}><ShieldCheck className={`size-5 shrink-0 ${isResultsScreen ? "mt-0.5" : ""}`} />{isResultsScreen ? <p><strong>Decision support, not a determination.</strong> This tool analyses supplied professional evidence only. It does not determine employment eligibility, banding/grading decisions, legal rights, job-evaluation outcomes, or professional competence for any profession.</p> : <p><strong>Decision support, not a determination.</strong></p>}</div>

        {isFirstLoad ? <FirstLoadEntry onStart={() => {
          // isFirstLoad guarantees !isAuthenticated (see its own comment) --
          // this hero, and this handler, only ever render for a guest.
          setGuestOpen(true);
        }} onExploreDemo={() => {
          // Dismissing the entry screen is enough: `active` already falls
          // back to the shared demo dataset for an unauthenticated visitor,
          // and isFirstLoad guarantees that's exactly who's here.
          setEntryDismissed(true);
        }} /> : showDashboard ? <ReturningUserDashboard workspace={active} onChooseObjective={(next: Objective) => { setDashboardDismissed(true); chooseObjective(next); }} onViewLibrary={() => { setDashboardDismissed(true); setActiveSection("library"); }} /> : <><section className="relative overflow-hidden rounded-xl border bg-card px-6 py-8 shadow-[0_12px_36px_-26px_rgba(14,32,50,.35)] lg:px-10">
          {isReturningWithHistory ? <div className="relative max-w-3xl"><p className="font-mono text-[11px] font-bold uppercase tracking-[.18em] text-primary">Welcome back</p><h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight lg:text-4xl">{returningWelcomeMessage}</h1></div> : <>
          <div className="relative max-w-4xl"><div className="mb-3 flex items-center gap-2"><span className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">About you</span>{isDemo && <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">Example data</Badge>}{isGuest && <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">Not saved</Badge>}</div><h1 className="font-serif text-4xl font-semibold tracking-tight lg:text-5xl">{active?.profile?.currentRole ?? "Your details"}</h1>{active?.profile ? <p className="mt-2 max-w-3xl text-base text-muted-foreground">{`${active.profile.profession}${active.profile.specialty ? ` · ${active.profile.specialty}` : ""}${active.profile.experience ? ` · ${active.profile.experience}` : ""}`}</p> : !isAuthenticated ? <p className="mt-2 max-w-3xl text-base text-muted-foreground">Try it free, right now — no account needed. Sign in only if you want to save your results for later.</p> : null}<div className="mt-5 flex flex-wrap gap-2">{active?.profile?.targetRole && <Badge variant="secondary" className="font-medium">Aiming for: {active.profile.targetRole}</Badge>}{active?.profile?.currentLevel && <Badge variant="outline">Current level: {active.profile.currentLevel}</Badge>}{isDemo && <Badge variant="outline">Sarah Mwangi</Badge>}</div></div>
          <div className="relative mt-6 flex flex-wrap items-center gap-1.5">{[{ label: "About you", active: !!active?.profile }, { label: "Evidence", active: (active?.documents?.filter((document: any) => document.documentType === "evidence")?.length ?? 0) > 0 }, { label: "Job you want", active: !!target }, { label: "Results", active: (active?.assessments?.length ?? 0) > 0 }].map((step, index) => <span key={step.label} className="flex items-center gap-1.5">{index > 0 && <span className="h-px w-4 shrink-0 bg-border sm:w-8" />}<span className="flex items-center gap-1.5 text-xs"><span className={`grid size-4 shrink-0 place-items-center rounded-full text-[8px] font-bold ${step.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{step.active ? <CheckCircle2 className="size-2.5" /> : index + 1}</span><span className={step.active ? "font-medium text-foreground" : "text-muted-foreground"}>{step.label}</span></span></span>)}</div>
          </>}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="xl:sticky xl:top-24 xl:h-fit"><nav className="rounded-xl border bg-card p-2 shadow-sm"><NavButton active={activeSection === "evidence-map"} icon={SearchCheck} label="Your strengths and gaps" onClick={() => setActiveSection("evidence-map")} /><NavButton active={activeSection === "library"} icon={FolderOpen} label="Documents" onClick={() => navigateTo("library")} /><NavButton active={activeSection === "objective-summary"} icon={BookOpenText} label="Results" onClick={() => navigateTo("objective-summary")} /><NavButton active={activeSection === "safety"} icon={ShieldCheck} label="How this works" onClick={() => navigateTo("safety")} /></nav><div className="mt-4 rounded-xl border border-dashed bg-card p-4"><p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">What you're working on</p><p className="mt-1 font-serif text-lg font-semibold">{objectives[objective].title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{objectives[objective].label}</p></div></aside>

          <div className="min-w-0">
            <section className="rise rounded-xl border bg-card p-5 shadow-sm lg:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Pick one</p><h2 className="mt-1 font-serif text-3xl font-semibold">What do you want help with?</h2><p className="mt-1 text-xs text-muted-foreground">Try it free, right now — no account needed. Sign in only if you want to save your results for later.</p></div><Button onClick={() => { setAnalysisError(null); if (isAuthenticated) runAnalysis.mutate({ objective }); else setGuestOpen(true); }} disabled={isAuthenticated && isAnalysing} className="shrink-0">{(isAuthenticated && isAnalysing) ? <Loader2 className="animate-spin" /> : <Sparkles />}{isAuthenticated ? "Review my evidence" : <>Review my evidence<span className="hidden sm:inline"> — no sign-in needed</span></>}</Button></div><div className="mt-5 grid gap-3 lg:grid-cols-3">{(Object.keys(objectives) as Objective[]).map(key => { const item = objectives[key]; const Icon = item.icon; const tint = objectiveIconTint[key]; return <button key={key} onClick={() => chooseObjective(key)} className={`rounded-lg border p-4 text-left shadow-sm ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${objective === key ? "border-primary bg-primary/[.035] ring-primary/20" : "bg-card ring-primary/0 hover:border-primary/40"}`}><div className="flex items-center justify-between"><span className={`grid size-8 place-items-center rounded-full ${tint.bg} ${tint.fg}`}><Icon className="size-4" /></span><span className="font-mono text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">{item.label}</span></div><p className="mt-4 font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p></button>; })}</div></section>

            {analysisError && <AnalysisFailureAlert message={analysisError} />}

            {activeSection === "evidence-map" && <EvidenceMap active={active} assessmentByRequirement={assessmentByRequirement} selectedEvidenceId={selectedEvidenceId} setSelectedEvidenceId={setSelectedEvidenceId} objective={objective} />}
            {activeSection === "library" && <EvidenceLibrary active={active} isAuthenticated={isAuthenticated} isDemo={isDemo} profileOpen={profileOpen} setProfileOpen={setProfileOpen} profileDraft={profileDraft} setProfileDraft={setProfileDraft} onProfileSubmit={handleProfile} onOpenUpload={openUploadFor} onLoadDemo={() => { if (ensureAuth()) loadDemo.mutate(); }} demoLoading={loadDemo.isPending} onDeleteDocument={(documentId: number) => { setDeletingDocumentId(documentId); deleteDocument.mutate({ documentId }); }} deletingDocumentId={deletingDocumentId} onDeleteAccount={handleDeleteAccount} deleteAccountPending={deleteAccountPending} />}
            {activeSection === "objective-summary" && <ObjectiveReports active={active} objective={objective} assessmentByRequirement={assessmentByRequirement} selectedEvidenceId={selectedEvidenceId} setSelectedEvidenceId={setSelectedEvidenceId} onAddCurrentRole={() => openUploadFor("current_role")} />}
            {activeSection === "safety" && <Safeguards />}
          </div>
        </div></>}
      </main>

      <div className="mt-auto border-t border-primary/20 bg-primary px-4 py-3 text-center text-[11px] leading-5 text-primary-foreground"><p>This tool provides decision support from supplied evidence only. It does not determine employment eligibility, banding/grading decisions, legal rights, job-evaluation outcomes, or professional competence for any profession.</p><p className="mt-1 text-primary-foreground/70"><Link href="/privacy" className="underline-offset-2 hover:underline">Privacy</Link><span className="mx-2">·</span><Link href="/terms" className="underline-offset-2 hover:underline">Terms</Link></p></div>
      {selectedSource?.evidence && <SourcePanel evidence={selectedSource.evidence} document={selectedSource.document} onClose={() => setSelectedEvidenceId(null)} />}
      <GuestAnalysisDialog open={guestOpen} onOpenChange={setGuestOpen} onSubmit={data => guestAnalysis.mutate(data)} pending={isGuestAnalysing} />
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} draft={uploadDraft} setDraft={setUploadDraft} file={uploadFile} setFile={setUploadFile} onSubmit={handleUpload} pending={upload.isPending || pasteTarget.isPending || pasteEvidence.isPending || pasteCurrentRole.isPending} />
      <ProInterestDialog open={proInterestOpen} onOpenChange={setProInterestOpen} onInterested={() => recordProInterest.mutate({ objective, source: activeSection })} pending={recordProInterest.isPending} success={recordProInterest.isSuccess} />
    </div>
  );
}

function NavButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Target; label: string; onClick: () => void }) { return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-foreground/75 hover:bg-accent hover:text-accent-foreground"}`}><Icon className="size-4" />{label}<ChevronRight className={`ml-auto size-4 ${active ? "opacity-100" : "opacity-0"}`} /></button>; }

// The persistent global top bar's desktop link (>=768px).
function HeaderNavLink({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={`rounded-md px-2.5 py-2 text-sm font-bold transition-colors xl:px-3.5 ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/85 hover:bg-accent hover:text-accent-foreground"}`}>{label}</button>; }

// The persistent global nav's mobile hamburger-menu link (<768px). Larger
// tap target than HeaderNavLink -- this is the direct fix for "New
// analysis" being unreachable on mobile, so it needs to be unmistakably
// visible and easy to tap, not a scaled-down desktop link.
function MobileNavLink({ label, icon: Icon, active, onClick }: { label: string; icon: typeof Target; active?: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-base font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"}`}><Icon className="size-4.5" />{label}</button>; }

function FirstLoadEntry({ onStart, onExploreDemo }: { onStart: () => void; onExploreDemo: () => void }) {
  return <section className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,.75fr)]"><div className="relative overflow-hidden rounded-2xl bg-primary px-7 py-9 text-primary-foreground shadow-[0_18px_45px_-24px_rgba(14,32,50,.65)] lg:px-10 lg:py-12"><div className="absolute -right-20 -top-24 size-72 rounded-full border border-white/15" /><div className="absolute -bottom-24 right-24 size-52 rounded-full border border-white/10" /><div className="relative max-w-2xl"><p className="font-mono text-[11px] font-bold uppercase tracking-[.18em] text-white/70">Get started</p><h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.04] tracking-tight sm:text-5xl">See what your CV actually proves.</h1><p className="mt-3 font-serif text-lg font-semibold italic text-white/90 sm:text-xl">Your next role starts with what you can already prove.</p><p className="mt-4 max-w-xl text-base leading-7 text-white/80">Paste in your CV (or anything else — an appraisal, feedback, a certificate) and the job description you're aiming for. We'll show you exactly what matches, right here, no account needed.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"><Button size="lg" onClick={onStart} className="bg-white px-6 text-primary shadow-sm hover:bg-white/90"><Sparkles className="size-4" />Start now — it's free</Button><span className="text-sm text-white/70">Takes about 5 minutes</span></div><div className="mt-8 grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-3"><EntryStep number="01" label="Paste in your evidence" /><EntryStep number="02" label="Paste in the job description" /><EntryStep number="03" label="See exactly what matches" /></div></div></div><aside className="rounded-2xl border bg-card p-6 shadow-sm"><Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">Example only</Badge><h2 className="mt-4 font-serif text-2xl font-semibold">Prefer to look first?</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Take a look at Sarah's example — a made-up Grade 6 specialist advisor going for Grade 7. It shows you what your results would look like, using made-up data.</p><Button variant="outline" className="mt-6 w-full justify-between" onClick={onExploreDemo}>See the example <ArrowRight className="size-4" /></Button><p className="mt-4 text-xs leading-5 text-muted-foreground">You can start your own review any time — the example is just there if you want to see it first.</p></aside></section>;
}
function EntryStep({ number, label }: { number: string; label: string }) { return <div className="flex items-center gap-2 text-xs leading-4 text-white/80"><span className="grid size-6 shrink-0 place-items-center rounded-full border border-white/30 font-mono text-[11px] font-bold text-white">{number}</span>{label}</div>; }

function ReturningUserDashboard({ workspace, onChooseObjective, onViewLibrary }: { workspace: any; onChooseObjective: (objective: Objective) => void; onViewLibrary: () => void }) {
  const documentCount = workspace?.documents?.length ?? 0;
  const evidenceCount = (workspace?.documents ?? []).filter((document: any) => document.documentType === "evidence").length;
  const lastAnalysis = workspace?.latestAnalysis;
  const lastAnalysisDate = lastAnalysis?.createdAt ? new Date(lastAnalysis.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : null;
  return <section className="grid gap-5 rise">
    <div className="rounded-2xl border bg-card px-6 py-8 shadow-sm lg:px-10">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[.18em] text-primary">Welcome back</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight lg:text-4xl">{workspace?.profile?.currentRole ?? "Your evidence library"}</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
        {evidenceCount ? `${evidenceCount} evidence document${evidenceCount === 1 ? "" : "s"}` : "No evidence documents"} in your library
        {lastAnalysisDate ? `, last checked on ${lastAnalysisDate}${lastAnalysis?.objective ? ` (${objectives[lastAnalysis.objective as Objective].title})` : ""}.` : " — you haven't run a check yet."}
      </p>
      <Button variant="outline" className="mt-5" onClick={onViewLibrary}><FolderOpen className="size-4" />View my documents ({documentCount})</Button>
    </div>
    <div>
      <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground">Jump back in</p>
      <div className="grid gap-3 lg:grid-cols-3">{(Object.keys(objectives) as Objective[]).map(key => { const item = objectives[key]; const Icon = item.icon; const tint = objectiveIconTint[key]; return <button key={key} onClick={() => onChooseObjective(key)} className="rounded-lg border bg-card p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"><div className="flex items-center justify-between"><span className={`grid size-8 place-items-center rounded-full ${tint.bg} ${tint.fg}`}><Icon className="size-4" /></span><span className="font-mono text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">{item.label}</span></div><p className="mt-4 font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p></button>; })}</div>
    </div>
  </section>;
}

function ComponentChecks({ active, components, selectedEvidenceId, setSelectedEvidenceId }: any) {
  if (!components?.length) return null;
  return <div className="mt-3 space-y-2 border-t border-dashed pt-3"><p className="font-mono text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">In detail</p>{components.map((component: any, index: number) => <div key={`${component.component}-${index}`} className="rounded-md bg-muted/35 p-2.5"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={assessmentStyle[canonicalAssessment(component.assessment)]}>{formatStatus(canonicalAssessment(component.assessment))}</Badge><span className="text-xs font-semibold">{component.component}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{component.interpretation}</p>{component.gap && <p className="mt-1 text-xs leading-5 text-amber-800"><strong>Limitation:</strong> {component.gap}</p>}{component.evidenceIds?.length ? <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">{component.evidenceIds.map((id: number) => { const source = sourceFor(active, id); return source.evidence ? <button key={id} onClick={() => setSelectedEvidenceId(id)} className={`py-1.5 text-xs font-semibold text-primary underline underline-offset-4 ${selectedEvidenceId === id ? "opacity-60" : ""}`}>View source: {source.document?.title ?? "evidence"}</button> : null; })}</div> : <p className="mt-2 text-xs text-muted-foreground">We haven't linked a specific quote to this yet.</p>}</div>)}</div>;
}

function EvidenceMap({ active, assessmentByRequirement, selectedEvidenceId, setSelectedEvidenceId, objective }: any) {
  const requirements = active?.requirements ?? [];
  const statuses = ["directly_evidenced", "indirectly_relevantly_evidenced", "inferred", "not_found", "contradicted"];
  const counts = requirements.reduce((acc: any, requirement: any) => { const status = canonicalAssessment(assessmentByRequirement.get(requirement.id)?.assessment ?? "not_found"); acc[status] = (acc[status] ?? 0) + 1; return acc; }, {});
  return <section key={active?.latestAnalysis?.id ?? "empty"} className="mt-6 rise"><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Details</p><h2 className="mt-1 font-serif text-2xl font-semibold">Your strengths and gaps</h2><p className="mt-1 max-w-3xl text-sm text-muted-foreground">We check each requirement one by one. "Directly evidenced" means your documents clearly show it. "Indirectly/relevantly evidenced" means something related shows up, but it doesn't fully prove it. "Inferred" means we're reading between the lines — that's our interpretation, not solid evidence. "Not found" just means we didn't see it in what you gave us — not that you don't have it.</p></div><div className="flex flex-wrap gap-2">{statuses.map(status => <Badge key={status} variant="outline" className={assessmentStyle[status]}>{counts[status] ?? 0} {formatStatus(status)}</Badge>)}</div></div><div className="overflow-hidden rounded-xl border bg-card shadow-sm"><div className="overflow-x-auto"><table className="report-table min-w-[1100px] w-full text-left text-sm"><thead className="bg-muted/65 text-[11px] uppercase tracking-[.12em] text-muted-foreground"><tr><th className="w-[20%] px-4 py-3 font-semibold">What's needed</th><th className="w-[13%] px-4 py-3 font-semibold">Result</th><th className="w-[22%] px-4 py-3 font-semibold">What we found</th><th className="w-[29%] px-4 py-3 font-semibold">Details</th><th className="w-[16%] px-4 py-3 font-semibold">What's missing</th></tr></thead><tbody>{requirements.map((requirement: any) => { const assessment = assessmentByRequirement.get(requirement.id) ?? { assessment: "not_found", strength: "not_demonstrated", evidenceIds: [], interpretation: "No analysis has been run for this criterion yet.", gap: "Analyse the library after adding evidence and a target.", components: [] }; const status = canonicalAssessment(assessment.assessment); const firstSource = assessment.evidenceIds?.[0] ? sourceFor(active, assessment.evidenceIds[0]) : null; return <tr key={requirement.id}><td className="px-4 py-4 align-top"><p className="font-semibold leading-5">{requirement.criterion}</p><p className="mt-1 text-xs text-muted-foreground">{requirement.category}</p></td><td className="px-4 py-4 align-top"><Badge variant="outline" className={`${assessmentStyle[status]} capitalize`}>{formatStatus(status)}</Badge><p className="mt-2 text-xs capitalize text-muted-foreground">{formatStatus(assessment.strength)}</p></td><td className="px-4 py-4 align-top">{firstSource?.evidence ? <button onClick={() => setSelectedEvidenceId(firstSource.evidence.id)} className={`group text-left ${selectedEvidenceId === firstSource.evidence.id ? "text-primary" : ""}`}><p className="line-clamp-3 leading-5 underline decoration-primary/30 underline-offset-4 group-hover:decoration-primary">“{firstSource.evidence.statement}”</p><span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">View source <ArrowRight className="size-3" /></span></button> : <p className="text-muted-foreground">Nothing to show here yet.</p>}</td><td className="px-4 py-4 align-top"><p className="leading-5 text-muted-foreground">{assessment.interpretation}</p><ComponentChecks active={active} components={assessment.components} selectedEvidenceId={selectedEvidenceId} setSelectedEvidenceId={setSelectedEvidenceId} /></td><td className="px-4 py-4 align-top text-xs leading-5 text-muted-foreground">{assessment.gap}</td></tr>; })}</tbody></table></div></div>{objective === "A" && <div className="mt-4 rounded-lg border border-primary/15 bg-primary/[.035] px-4 py-3 text-sm text-primary"><strong>How to read this:</strong> it only shows what your documents directly say, what's related but not quite proof, and where the gaps or guesses are. It doesn't decide whether someone should be appointed or shortlisted for the role.</div>}</section>;
}

function DeleteDocumentButton({ title, pending, onConfirm }: { title: string; pending: boolean; onConfirm: () => void }) {
  return <AlertDialog>
    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-rose-700" aria-label={`Delete ${title}`} disabled={pending}>{pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}</Button></AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Remove "{title}"?</AlertDialogTitle>
        <AlertDialogDescription>This stops it being used in any future check. Past results that already used it are kept exactly as they were — nothing about them changes.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="bg-rose-700 text-white hover:bg-rose-800">Remove</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}

function EvidenceLibrary({ active, isAuthenticated, isDemo, profileOpen, setProfileOpen, profileDraft, setProfileDraft, onProfileSubmit, onOpenUpload, onLoadDemo, demoLoading, onDeleteDocument, deletingDocumentId, onDeleteAccount, deleteAccountPending }: any) {
  const evidenceDocs = (active?.documents ?? []).filter((document: any) => document.documentType === "evidence");
  const targetDocument = active?.targetDocument ?? active?.documents?.find((document: any) => document.documentType === "target");
  const currentRoleDocument = active?.currentRoleDocument ?? active?.documents?.find((document: any) => document.documentType === "current_role");
  return <section className="mt-6 rise"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Your documents</p><h2 className="mt-1 font-serif text-2xl font-semibold">Everything you've added</h2><p className="mt-1 text-sm text-muted-foreground">Everything you add stays here, safely stored in your own private space once you're signed in.</p></div><div className="flex gap-2"><ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} draft={profileDraft} setDraft={setProfileDraft} onSubmit={onProfileSubmit} isAuthenticated={isAuthenticated} onDeleteAccount={onDeleteAccount} deleteAccountPending={deleteAccountPending} /><Button onClick={() => onOpenUpload("evidence")}><Upload />Add a document</Button></div></div>{isDemo && <div className="mt-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"><div><strong>Sarah's records are made up.</strong> Have a look around freely; sign in to add your own copy of them to your private space if you want to keep exploring.</div>{isAuthenticated && <Button size="sm" variant="outline" className="border-amber-300 bg-background" onClick={onLoadDemo} disabled={demoLoading}>{demoLoading && <Loader2 className="animate-spin" />}Try the example</Button>}</div>}<div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{evidenceDocs.map((document: any) => <article key={document.id} className="rounded-xl border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="grid size-9 place-items-center rounded-md bg-secondary text-secondary-foreground"><FileText className="size-4" /></span><div className="flex items-center gap-1"><Badge variant="outline" className="text-[11px]">{document.sourceKind}</Badge>{isAuthenticated && <DeleteDocumentButton title={document.title} pending={deletingDocumentId === document.id} onConfirm={() => onDeleteDocument(document.id)} />}</div></div><h3 className="mt-5 font-semibold leading-5">{document.title}</h3><p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{document.fileName}</p><div className="mt-4 border-t pt-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3 text-emerald-700" />{document.extractionStatus === "ready" ? "Ready to use" : "Needs a quick check"}</span></div></article>)}{!evidenceDocs.length && <div className="col-span-full rounded-xl border border-dashed bg-muted/20 p-8 text-center"><FolderOpen className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 font-medium">You haven't added anything yet.</p><p className="mt-1 text-sm text-muted-foreground">Upload a file, paste something in, or try Sarah's example first.</p></div>}</div><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-xl border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><Target className="mt-0.5 size-5 text-primary" /><div><p className="font-semibold">The job you're aiming for</p><p className="mt-1 text-sm text-muted-foreground">{targetDocument?.title ?? "You haven't added a job description yet."}</p><p className="mt-2 text-xs text-muted-foreground">{active?.requirements?.length ?? 0} things we'll check your evidence against.</p></div></div>{isAuthenticated && targetDocument && <DeleteDocumentButton title={targetDocument.title} pending={deletingDocumentId === targetDocument.id} onConfirm={() => onDeleteDocument(targetDocument.id)} />}</div></div><div className="rounded-xl border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><Scale className="mt-0.5 size-5 text-primary" /><div><p className="font-semibold">Your current role</p><p className="mt-1 text-sm text-muted-foreground">{currentRoleDocument?.title ?? "You haven't added your current role yet."}</p><p className="mt-2 text-xs text-muted-foreground">{currentRoleDocument ? `${active?.currentRoleResponsibilities?.length ?? 0} responsibilities on file.` : "Only needed for “Wondering if my role matches my pay.”"}</p></div></div>{isAuthenticated && (currentRoleDocument ? <DeleteDocumentButton title={currentRoleDocument.title} pending={deletingDocumentId === currentRoleDocument.id} onConfirm={() => onDeleteDocument(currentRoleDocument.id)} /> : <Button size="sm" variant="outline" onClick={() => onOpenUpload("current_role")}>Add it</Button>)}</div></div></div></section>;
}


function Safeguards() { return <section className="mt-6 rise"><div className="rounded-xl border bg-card p-6 shadow-sm"><p className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-primary">Our approach</p><h2 className="mt-1 font-serif text-2xl font-semibold">What this tool does — and doesn't do</h2><div className="mt-6 grid gap-5 lg:grid-cols-2"><Guardrail title="We show our working" body="Every result links back to the exact bit of text it came from. If we can't find where something came from, we say so — we don't make it up." /><Guardrail title="We don't inflate what you did" body="Being part of something isn't the same as leading it. Giving informal advice isn't the same as being a formal leader. We only credit you with a project's results if your evidence actually supports that." /><Guardrail title="“Not found” isn't a judgement" body="“Not found” just means we couldn't see it in what you gave us. It's not saying you don't have the experience — only that it isn't written down yet." /><Guardrail title="Decision support only" body="The product does not determine employment eligibility, banding/grading decisions, professional competence, legal rights, job evaluation outcomes, or any HR decision, for any profession." /></div></div></section>; }
function Guardrail({ title, body }: { title: string; body: string }) { return <div className="rounded-lg border bg-muted/25 p-4"><LockKeyhole className="size-4 text-primary" /><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p></div>; }

function SourcePanel({ evidence, document, onClose }: any) { return <aside className="fixed bottom-12 right-4 z-50 w-[min(440px,calc(100vw-2rem))] rounded-xl border bg-card p-5 shadow-2xl rise"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[11px] font-bold uppercase tracking-[.14em] text-primary">Where this came from</p><h2 className="mt-1 font-serif text-xl font-semibold">{document?.title ?? "Source document"}</h2></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close source inspector"><X className="size-4" /></Button></div><div className="mt-4 rounded-lg border bg-muted/40 p-4"><p className="text-sm leading-6">“{evidence.excerpt}”</p></div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><p className="font-mono uppercase tracking-wide text-muted-foreground">Location</p><p className="mt-1 font-medium">{evidence.sourceLocation}</p></div><div><p className="font-mono uppercase tracking-wide text-muted-foreground">Evidence type</p><p className="mt-1 font-medium">{evidence.evidenceType}</p></div></div><p className="mt-4 border-t pt-3 text-xs leading-5 text-muted-foreground">This is based on the text above — shown so you can check our reading of it yourself.</p></aside>; }

function ProfileDialog({ open, onOpenChange, draft, setDraft, onSubmit, isAuthenticated, onDeleteAccount, deleteAccountPending }: any) {
  const [deletePassword, setDeletePassword] = useState("");
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogTrigger asChild><Button variant="outline"><Plus />About you</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle className="font-serif text-2xl">Your details</DialogTitle><DialogDescription>This just helps keep things organised — we won't use it to assume things you haven't actually shown evidence for.</DialogDescription></DialogHeader><form onSubmit={onSubmit} className="grid gap-4 py-2 sm:grid-cols-2"><Field label="Current role"><Input required value={draft.currentRole} onChange={event => setDraft({ ...draft, currentRole: event.target.value })} /></Field><Field label="Profession"><Input required value={draft.profession} onChange={event => setDraft({ ...draft, profession: event.target.value })} /></Field><Field label="Specialty"><Input value={draft.specialty} onChange={event => setDraft({ ...draft, specialty: event.target.value })} /></Field><Field label="Experience"><Input placeholder="e.g. 7 years post-qualification" value={draft.experience} onChange={event => setDraft({ ...draft, experience: event.target.value })} /></Field><Field label="Current level / band"><Input value={draft.currentLevel} onChange={event => setDraft({ ...draft, currentLevel: event.target.value })} /></Field><Field label="Job you're aiming for"><Input value={draft.targetRole} onChange={event => setDraft({ ...draft, targetRole: event.target.value })} /></Field><div className="sm:col-span-2"><Field label="What you're working towards"><Textarea value={draft.careerObjective} onChange={event => setDraft({ ...draft, careerObjective: event.target.value })} /></Field></div><div className="sm:col-span-2"><Field label="Anything specific you want checked?"><Textarea placeholder="Optional: tell us something you believe your evidence shows, and we'll check it against what you've given us." value={draft.ownClaims} onChange={event => setDraft({ ...draft, ownClaims: event.target.value })} /></Field></div><div className="sm:col-span-2 flex justify-end"><Button type="submit">Save</Button></div></form>{isAuthenticated && <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-4"><p className="font-semibold text-rose-900">Delete account</p><p className="mt-1 text-sm leading-5 text-rose-800">This permanently deletes your account, every document in your library, and every past result. This can't be undone.</p><AlertDialog onOpenChange={dialogOpen => { if (!dialogOpen) setDeletePassword(""); }}><AlertDialogTrigger asChild><Button variant="outline" className="mt-3 border-rose-300 bg-background text-rose-800 hover:bg-rose-100">Delete my account</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete your account?</AlertDialogTitle><AlertDialogDescription>This permanently deletes your account, every document in your library, and every past result. This can't be undone. Enter your password to confirm.</AlertDialogDescription></AlertDialogHeader><Input type="password" placeholder="Your password" value={deletePassword} onChange={event => setDeletePassword(event.target.value)} autoComplete="current-password" /><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={!deletePassword || deleteAccountPending} onClick={() => onDeleteAccount(deletePassword)} className="bg-rose-700 text-white hover:bg-rose-800">{deleteAccountPending && <Loader2 className="animate-spin" />}Delete my account</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>}</DialogContent></Dialog>;
}
function UploadDialog({ open, onOpenChange, draft, setDraft, file, setFile, onSubmit, pending }: any) { return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle className="font-serif text-2xl">Add a document</DialogTitle><DialogDescription>Upload a file (PDF or DOCX, up to 10 MB) or just paste the text in directly.</DialogDescription></DialogHeader><form onSubmit={onSubmit} className="grid gap-4 py-2"><Field label="Give it a name"><Input placeholder="e.g. Current role description" value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="What kind of document is this?"><Select value={draft.documentType} onValueChange={(value: "evidence" | "target" | "current_role") => setDraft({ ...draft, documentType: value, sourceKind: value === "target" ? "Person specification" : value === "current_role" ? "Current role responsibilities" : draft.sourceKind })}><SelectTrigger className="w-full min-w-0"><SelectValue className="truncate" /></SelectTrigger><SelectContent><SelectItem value="evidence">Evidence — like a CV, appraisal, or feedback</SelectItem><SelectItem value="target">Job description — for "Applying for a job"</SelectItem><SelectItem value="current_role">Your current role — for "Wondering if my role matches my pay"</SelectItem></SelectContent></Select></Field><Field label="Type"><Input value={draft.sourceKind} onChange={event => setDraft({ ...draft, sourceKind: event.target.value })} /></Field></div><Field label="File (optional)"><Input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={event => { const selected = event.target.files?.[0] ?? null; if (selected) { const error = validateUploadFile(selected); if (error) { toast.error(error); event.target.value = ""; setFile(null); return; } } setFile(selected); }} />{file && <p className="mt-1 text-xs text-muted-foreground">Selected: {file.name}</p>}</Field><Field label={draft.documentType === "target" ? "Or paste the job description in here (optional if you picked a file)" : draft.documentType === "current_role" ? "Or paste your current role in here (optional if you picked a file)" : "Or paste your evidence in here (optional if you picked a file)"}><Textarea rows={4} className="max-h-64 overflow-y-auto" placeholder={draft.documentType === "target" ? "Paste the person specification or role criteria here." : draft.documentType === "current_role" ? "Paste the current job description or formal role responsibilities here." : "Paste a CV, appraisal, feedback, or other evidence record here. If a file is also selected, this text is used for analysis and the original file is retained separately."} value={draft.sourceText} onChange={event => setDraft({ ...draft, sourceText: event.target.value })} /></Field><div className="flex justify-end"><Button disabled={pending} type="submit">{pending && <Loader2 className="animate-spin" />}{draft.sourceText.trim() && !file ? "Add it" : "Add and process"}</Button></div></form></DialogContent></Dialog>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid min-w-0 gap-1.5"><Label>{label}</Label>{children}</div>; }

// Demand-measurement only. Clicking "Yes, let me know" records a server-side
// interest signal (see routers.ts commercial.recordProInterest) -- it does
// not start a checkout, take payment details, or create a subscription of
// any kind.
function ProInterestDialog({ open, onOpenChange, onInterested, pending, success }: { open: boolean; onOpenChange: (open: boolean) => void; onInterested: () => void; pending: boolean; success: boolean }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="font-serif text-2xl">CV Optimiser Pro</DialogTitle>
      <DialogDescription>Unlimited CV optimisations for <strong className="text-foreground">£9.99/month</strong>.</DialogDescription>
    </DialogHeader>
    {success ? (
      <div className="flex items-start gap-3 rounded-lg border border-primary/15 bg-secondary/55 px-4 py-3 text-sm text-secondary-foreground">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
        <p>Thanks — we've got you down. We'll be in touch when Pro access opens.</p>
      </div>
    ) : (
      <div className="grid gap-4">
        <p className="text-sm leading-6 text-muted-foreground">We're opening Pro access to our first users. Let us know if you'd like early access.</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Not now</Button>
          <Button onClick={onInterested} disabled={pending}>{pending && <Loader2 className="animate-spin" />}Yes, let me know</Button>
        </div>
      </div>
    )}
  </DialogContent></Dialog>;
}
