import { SearchCheck } from "lucide-react";
import { Link, useLocation } from "wouter";

export function LegalLayout({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b bg-card px-5 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button type="button" onClick={() => setLocation("/")} className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><SearchCheck className="size-5" /></span>
            <span className="min-w-0 text-left"><span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Evidence review</span><span className="block font-serif text-lg font-semibold leading-5">See what your CV actually proves</span></span>
          </button>
          <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <a href="mailto:privacy@provemycv.com" className="hover:text-foreground">Contact</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Legal</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
        <div className="prose-legal mt-8 grid gap-6 text-sm leading-6 text-foreground/90">{children}</div>
      </main>
      <div className="border-t bg-primary px-4 py-3 text-center text-[11px] leading-5 text-primary-foreground">This tool provides decision support from supplied evidence only. It does not determine employment eligibility, banding/grading decisions, legal rights, job-evaluation outcomes, or professional competence for any profession.</div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      <div className="mt-2 grid gap-3 text-muted-foreground">{children}</div>
    </section>
  );
}
