import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AuthDialog({ open, onOpenChange }: Props) {
  const { login, loginPending, signup, signupPending, requestPasswordReset, requestPasswordResetPending } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "reset-request">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [resetRequestSent, setResetRequestSent] = useState(false);

  const pending = mode === "login" ? loginPending : mode === "signup" ? signupPending : requestPasswordResetPending;

  function switchMode(next: "login" | "signup" | "reset-request") {
    setMode(next);
    setResetRequestSent(false);
    setPassword("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      if (mode === "login") {
        await login({ email, password });
        toast.success("Signed in.");
      } else if (mode === "signup") {
        await signup({ email, password, name: name || undefined });
        toast.success("Account created.");
      } else {
        await requestPasswordReset({ email });
        setResetRequestSent(true);
        return;
      }
      setPassword("");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={nextOpen => { onOpenChange(nextOpen); if (!nextOpen) switchMode("login"); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{mode === "login" ? "Sign in" : mode === "signup" ? "Create an account" : "Reset your password"}</DialogTitle>
          <DialogDescription>
            {mode === "login" ? "Sign in to access your private evidence library." : mode === "signup" ? "Create an account to save a private evidence library, uploaded files, and analysis history." : "Enter the email address on your account and we'll send you a link to choose a new password."}
          </DialogDescription>
        </DialogHeader>

        {mode === "reset-request" && resetRequestSent ? (
          <div className="grid gap-4 py-2">
            <div className="flex items-start gap-3 rounded-lg border border-primary/15 bg-secondary/55 px-4 py-3 text-sm text-secondary-foreground">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
              <p>If an account exists for <strong>{email}</strong>, we've sent a link to reset your password. It expires in 30 minutes.</p>
            </div>
            <Button type="button" variant="outline" onClick={() => switchMode("login")}>Back to sign in</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4 py-2">
            {mode === "signup" && (
              <div className="grid gap-1.5">
                <Label>Name (optional)</Label>
                <Input value={name} onChange={event => setName(event.target.value)} autoComplete="name" />
              </div>
            )}
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" />
            </div>
            {mode !== "reset-request" && (
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label>Password</Label>
                  {mode === "login" && (
                    <button type="button" className="text-xs text-muted-foreground underline underline-offset-4" onClick={() => switchMode("reset-request")}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input type="password" required minLength={mode === "signup" ? 8 : undefined} value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />
                {mode === "signup" && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}
              </div>
            )}
            <Button type="submit" disabled={pending} className="mt-1">
              {pending && <Loader2 className="animate-spin" />}
              {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </Button>
            {mode === "reset-request" ? (
              <button type="button" className="text-xs text-muted-foreground underline underline-offset-4" onClick={() => switchMode("login")}>
                Back to sign in
              </button>
            ) : (
              <button
                type="button"
                className="text-xs text-muted-foreground underline underline-offset-4"
                onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              >
                {mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}
              </button>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
