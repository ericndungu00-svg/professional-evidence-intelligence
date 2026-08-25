import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2, SearchCheck } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

// Minimal admin visibility for the Pro-interest experiment -- deliberately
// not a general analytics dashboard, just this one list. The real access
// control is server-side (commercial.listProInterest is an adminProcedure,
// see routers.ts); the redirect below is only so a non-admin sees a normal
// page instead of a bare error.
export default function AdminProInterest() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = isAuthenticated && user?.role === "admin";

  useEffect(() => {
    if (!loading && !isAdmin) setLocation("/");
  }, [loading, isAdmin, setLocation]);

  const query = trpc.commercial.listProInterest.useQuery(undefined, { enabled: isAdmin });

  if (loading || !isAdmin) return <div className="grid min-h-screen place-items-center"><Loader2 className="size-7 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card px-5 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button type="button" onClick={() => setLocation("/")} className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><SearchCheck className="size-5" /></span>
            <span className="text-left"><span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Admin</span><span className="block font-serif text-lg font-semibold leading-5">Pro interest</span></span>
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-8">
        {query.isLoading ? (
          <Loader2 className="size-6 animate-spin text-primary" />
        ) : query.error ? (
          <p className="text-sm text-rose-700">Couldn't load Pro-interest events: {query.error.message}</p>
        ) : (
          <>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Total interested</p>
            <p className="mt-1 font-serif text-4xl font-semibold">{query.data?.total ?? 0}</p>
            <div className="mt-6 overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-muted/65 text-[11px] uppercase tracking-[.1em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Expressed interest</th>
                      <th className="px-4 py-3 font-semibold">Analyses at the time</th>
                      <th className="px-4 py-3 font-semibold">Context</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(query.data?.events ?? []).map(event => (
                      <tr key={event.id} className="border-t">
                        <td className="px-4 py-3">{event.name ?? "—"}</td>
                        <td className="px-4 py-3">{event.email}</td>
                        <td className="px-4 py-3">{new Date(event.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
                        <td className="px-4 py-3">{event.analysesCompletedAtTimeOfInterest}</td>
                        <td className="px-4 py-3 text-muted-foreground">{[event.objective ? `Objective ${event.objective}` : null, event.source].filter(Boolean).join(" · ") || "—"}</td>
                      </tr>
                    ))}
                    {!query.data?.events.length && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No one has expressed interest yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
