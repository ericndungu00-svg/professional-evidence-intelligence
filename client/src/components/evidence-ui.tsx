import { ChevronRight, FileText } from "lucide-react";

// A shared, restrained visual vocabulary for the two things this product
// says over and over: "here is how strong this is" and "here is exactly
// where it came from". Centralised so Home.tsx (evidence map) and
// ObjectiveReports.tsx (A/B/C reports) render both in one consistent way
// instead of each hand-rolling its own badge colours. This file is purely
// presentational -- it renders whatever status string / evidence object
// each caller already computed, it does not change what those values are.

export type StatusMeta = { label: string; dot: string; text: string };

export const STATUS_META: Record<string, StatusMeta> = {
  directly_evidenced: { label: "Directly evidenced", dot: "bg-emerald", text: "text-petrol" },
  indirectly_relevantly_evidenced: { label: "Indirectly / relevantly evidenced", dot: "bg-amber", text: "text-[#8a6423]" },
  inferred: { label: "Inferred", dot: "bg-[#8b7bb8]", text: "text-[#5b4d8a]" },
  not_found: { label: "Not found", dot: "bg-[#c8c2b4]", text: "text-muted-foreground" },
  contradicted: { label: "Contradicted", dot: "bg-error", text: "text-error" },
  aligned: { label: "Matches up", dot: "bg-emerald", text: "text-petrol" },
  potentially_broader_responsibility: { label: "May be broader", dot: "bg-[#8b7bb8]", text: "text-[#5b4d8a]" },
  potentially_narrower_responsibility: { label: "May be narrower", dot: "bg-[#6b8fae]", text: "text-[#3d5c73]" },
  insufficient_evidence: { label: "Not enough evidence yet", dot: "bg-[#c8c2b4]", text: "text-muted-foreground" },
  unclear_ambiguous: { label: "Unclear", dot: "bg-amber", text: "text-[#8a6423]" },
};

// Evidence status is meant to be scanned, not read as a wall of coloured
// chips -- a small dot carries the colour, the label stays close to ink.
export function EvidenceStatusPill({ status, label, className = "" }: { status: string; label?: string; className?: string }) {
  const meta = STATUS_META[status] ?? { label: label ?? status.replace(/_/g, " "), dot: "bg-muted-foreground", text: "text-muted-foreground" };
  return (
    <span className={`status-pill ${className}`}>
      <span className={`status-dot ${meta.dot}`} />
      <span className={meta.text}>{label ?? meta.label}</span>
    </span>
  );
}

// The product's signature trust pattern: CLAIM -> SOURCE -> VERIFICATION.
// Every citation in the app should look like this, not like an ordinary
// underlined hyperlink -- it's meant to feel like opening a numbered
// evidence reference, not a random modal.
export function SourceReference({ index, title, location, onClick, active }: { index: number; title: string; location?: string; onClick: () => void; active?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`source-ref group ${active ? "opacity-60" : ""}`}>
      <FileText className="size-3.5 shrink-0 text-petrol" />
      <span className="min-w-0">
        <span className="block leading-none"><span className="source-index">SOURCE {String(index).padStart(2, "0")}</span></span>
        <span className="mt-1 block truncate text-xs font-semibold text-foreground">{title}{location ? <span className="font-normal text-muted-foreground"> · {location}</span> : null}</span>
      </span>
      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
