import React from "react";
import { AlertTriangle } from "lucide-react";

export function AnalysisFailureAlert({ message }: { message: string }) {
  return <div role="alert" className="mt-6 flex gap-3 border-l-2 border-error pl-4 text-sm leading-6 text-foreground"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-error" /><div><p className="font-semibold text-ink">Analysis was not saved</p><p className="mt-1 text-muted-foreground">{message}</p><p className="mt-2 text-xs text-muted-foreground">Your evidence library and prior analyses remain unchanged. Correct the reported issue or retry the analysis.</p></div></div>;
}
