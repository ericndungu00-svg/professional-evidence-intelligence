import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AuthDialog({ open, onOpenChange }: Props) {
  const { login, loginPending, signup, signupPending } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const pending = mode === "login" ? loginPending : signupPending;

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      if (mode === "login") {
        await login({ email, password });
        toast.success("Signed in.");
      } else {
        await signup({ email, password, name: name || undefined });
        toast.success("Account created.");
      }
      setPassword("");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{mode === "login" ? "Sign in" : "Create an account"}</DialogTitle>
          <DialogDescription>
            {mode === "login" ? "Sign in to access your private evidence library." : "Create an account to save a private evidence library, uploaded files, and analysis history."}
          </DialogDescription>
        </DialogHeader>
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
          <div className="grid gap-1.5">
            <Label>Password</Label>
            <Input type="password" required minLength={mode === "signup" ? 8 : undefined} value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />
            {mode === "signup" && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}
          </div>
          <Button type="submit" disabled={pending} className="mt-1">
            {pending && <Loader2 className="animate-spin" />}
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
          <button
            type="button"
            className="text-xs text-muted-foreground underline underline-offset-4"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
