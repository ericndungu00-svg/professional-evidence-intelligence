import React from "react";
import { AlertTriangle } from "lucide-react";

export function AnalysisFailureAlert({ message }: { message: string }) {
  return <div role="alert" className="mt-5 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-950"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-800" /><div><p className="font-semibold">Analysis was not saved</p><p className="mt-1">{message}</p><p className="mt-2 text-xs text-rose-800">Your evidence library and prior analyses remain unchanged. Correct the reported issue or retry the analysis.</p></div></div>;
}
