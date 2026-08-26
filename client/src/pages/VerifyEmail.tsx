import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Loader2, SearchCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";

export default function VerifyEmail() {
  const { verifyEmail } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";
  const [status, setStatus] = useState<"pending" | "done" | "error">("pending");
  const [errorMessage, setErrorMessage] = useState("");
  // Runs once per token, not once per mount -- StrictMode/fast-refresh can
  // otherwise fire this effect twice, and a second call against an
  // already-used token would show a confusing "invalid or expired" error
  // for a verification that actually just succeeded.
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    verifyEmail({ token })
      .then(() => setStatus("done"))
      .catch(error => {
        setErrorMessage(error instanceof Error ? error.message : "This verification link is invalid or has expired.");
        setStatus("error");
      });
  }, [token, verifyEmail]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-12 text-foreground">
      <button type="button" onClick={() => setLocation("/")} className="mb-8 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><SearchCheck className="size-5" /></span><span className="min-w-0 text-left"><span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Evidence review</span><span className="block font-serif text-lg font-semibold leading-5">See what your CV actually proves</span></span></button>

      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        {!token ? (
          <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-800" />
            <div>
              <p className="font-semibold">This link is missing its verification token.</p>
              <p className="mt-1">Use the link from your confirmation email, or request a new one from your account.</p>
            </div>
          </div>
        ) : status === "pending" ? (
          <div className="flex items-center gap-3 py-4 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" />Confirming your email…</div>
        ) : status === "done" ? (
          <div className="grid gap-4">
            <div className="flex items-start gap-3 rounded-lg border border-primary/15 bg-secondary/55 px-4 py-3 text-sm text-secondary-foreground">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
              <p>Your email is confirmed. Thanks for verifying.</p>
            </div>
            <Button onClick={() => setLocation("/")}>Go to your evidence library</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-800" />
              <p>{errorMessage}</p>
            </div>
            <Button variant="outline" onClick={() => setLocation("/")}>Back to your account</Button>
          </div>
        )}
      </div>
    </div>
  );
}
