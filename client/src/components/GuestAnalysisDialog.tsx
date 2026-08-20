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
          <DialogTitle className="font-serif text-2xl">Analyse evidence without an account</DialogTitle>
          <DialogDescription>
            Paste a professional evidence record and target specification to generate a temporary Evidence Map and Objective A output. Nothing entered here is added to a saved library.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 py-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Current role (optional)"><Input value={draft.currentRole} onChange={event => setDraft({ ...draft, currentRole: event.target.value })} /></Field>
            <Field label="Profession (optional)"><Input value={draft.profession} onChange={event => setDraft({ ...draft, profession: event.target.value })} /></Field>
            <Field label="Target role (optional)"><Input value={draft.targetRole} onChange={event => setDraft({ ...draft, targetRole: event.target.value })} /></Field>
          </div>
          <Field label="Professional evidence">
            <Textarea required rows={8} minLength={40} placeholder="Paste evidence from a CV, appraisal, feedback, audit, QI report, CPD record, or similar source. Include the original wording you want assessed." value={draft.evidenceText} onChange={event => setDraft({ ...draft, evidenceText: event.target.value })} />
          </Field>
          <Field label="Target specification">
            <Textarea required rows={8} minLength={40} placeholder="Paste the role specification, criteria, promotion framework, or other target requirements." value={draft.targetText} onChange={event => setDraft({ ...draft, targetText: event.target.value })} />
          </Field>
          <Field label="Claim to check (optional)">
            <Textarea rows={3} placeholder="For example: I led a service-improvement project. This will be checked against the pasted evidence." value={draft.ownClaims} onChange={event => setDraft({ ...draft, ownClaims: event.target.value })} />
          </Field>
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-xs leading-5 text-muted-foreground">Guest analysis is temporary. <strong>Sign in only if you want persistence:</strong> a private evidence library, uploaded files, saved profile, or analysis history.</p>
            <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />}Generate temporary Evidence Map</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
