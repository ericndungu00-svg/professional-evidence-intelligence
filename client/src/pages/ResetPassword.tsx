import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2, Loader2, SearchCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";

export default function ResetPassword() {
  const { resetPassword, resetPasswordPending } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Those passwords don't match.");
      return;
    }
    try {
      await resetPassword({ token, newPassword: password });
      setDone(true);
      toast.success("Password updated. You're signed in.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset your password.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-12 text-foreground">
      <button type="button" onClick={() => setLocation("/")} className="mb-8 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><SearchCheck className="size-5" /></span><span className="min-w-0 text-left"><span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Evidence review</span><span className="block font-serif text-lg font-semibold leading-5">See what your CV actually proves</span></span></button>

      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        {!token ? (
          <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-800" />
            <div>
              <p className="font-semibold">This link is missing its reset token.</p>
              <p className="mt-1">Use the link from the password reset email, or request a new one from the sign-in dialog.</p>
            </div>
          </div>
        ) : done ? (
          <div className="grid gap-4">
            <div className="flex items-start gap-3 rounded-lg border border-primary/15 bg-secondary/55 px-4 py-3 text-sm text-secondary-foreground">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
              <p>Your password has been updated, and you're signed in on this device.</p>
            </div>
            <Button onClick={() => setLocation("/")}>Go to your evidence library</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4">
            <div>
              <h1 className="font-serif text-2xl font-semibold">Choose a new password</h1>
              <p className="mt-1 text-sm text-muted-foreground">This will sign you in and end any other active session on this account.</p>
            </div>
            <div className="grid gap-1.5">
              <Label>New password</Label>
              <Input type="password" required minLength={8} value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" />
              <p className="text-xs text-muted-foreground">At least 8 characters.</p>
            </div>
            <div className="grid gap-1.5">
              <Label>Confirm new password</Label>
              <Input type="password" required minLength={8} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" />
            </div>
            <Button type="submit" disabled={resetPasswordPending} className="mt-1">
              {resetPasswordPending && <Loader2 className="animate-spin" />}
              Set new password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
