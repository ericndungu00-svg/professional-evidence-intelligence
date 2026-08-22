import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";

export type GuestAnalysisInput = {
  currentRole?: string;
  profession?: string;
  targetRole?: string;
  ownClaims?: string;
  evidenceText: string;
  targetText: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: GuestAnalysisInput) => void;
  pending: boolean;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><Label>{label}</Label>{children}</div>;
}

export function GuestAnalysisDialog({ open, onOpenChange, onSubmit, pending }: Props) {
  const [draft, setDraft] = useState({ currentRole: "", profession: "", targetRole: "", ownClaims: "", evidenceText: "", targetText: "" });

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      currentRole: draft.currentRole || undefined,
      profession: draft.profession || undefined,
      targetRole: draft.targetRole || undefined,
      ownClaims: draft.ownClaims || undefined,
      evidenceText: draft.evidenceText,
      targetText: draft.targetText,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Try it free, right now</DialogTitle>
          <DialogDescription>
            Paste in your evidence and the job description you're going for, and we'll show you how they match up. Nothing you enter here is saved anywhere.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 py-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Current role (optional)"><Input value={draft.currentRole} onChange={event => setDraft({ ...draft, currentRole: event.target.value })} /></Field>
            <Field label="Profession (optional)"><Input value={draft.profession} onChange={event => setDraft({ ...draft, profession: event.target.value })} /></Field>
            <Field label="Job you're aiming for (optional)"><Input value={draft.targetRole} onChange={event => setDraft({ ...draft, targetRole: event.target.value })} /></Field>
          </div>
          <Field label="Your evidence">
            <Textarea required rows={8} minLength={40} placeholder="Paste in a CV, appraisal, feedback, audit, QI report, CPD record, or anything similar. Use the original wording — that's what we'll check." value={draft.evidenceText} onChange={event => setDraft({ ...draft, evidenceText: event.target.value })} />
          </Field>
          <Field label="The job description">
            <Textarea required rows={8} minLength={40} placeholder="Paste in the role specification, criteria, promotion framework, or whatever sets out what's needed." value={draft.targetText} onChange={event => setDraft({ ...draft, targetText: event.target.value })} />
          </Field>
          <Field label="Anything specific you want checked? (optional)">
            <Textarea rows={3} placeholder="For example: I led a service-improvement project. We'll check this against your pasted evidence." value={draft.ownClaims} onChange={event => setDraft({ ...draft, ownClaims: event.target.value })} />
          </Field>
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-xs leading-5 text-muted-foreground">This is temporary and won't be saved. <strong>Sign in only if you want to keep it</strong> — a private library, uploaded files, your profile, and your results.</p>
            <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />}See how I match up</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
