import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2, SearchCheck } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

// Minimal admin visibility for Contact-page submissions -- mirrors
// AdminProInterest.tsx. The real access control is server-side
// (contact.list is an adminProcedure, see routers.ts); the redirect below
// is only so a non-admin sees a normal page instead of a bare error.
export default function AdminContactMessages() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = isAuthenticated && user?.role === "admin";

  useEffect(() => {
    if (!loading && !isAdmin) setLocation("/");
  }, [loading, isAdmin, setLocation]);

  const query = trpc.contact.list.useQuery(undefined, { enabled: isAdmin });

  if (loading || !isAdmin) return <div className="grid min-h-screen place-items-center"><Loader2 className="size-7 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card px-5 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button type="button" onClick={() => setLocation("/")} className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><SearchCheck className="size-5" /></span>
            <span className="text-left"><span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Admin</span><span className="block font-serif text-lg font-semibold leading-5">Contact messages</span></span>
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-8">
        {query.isLoading ? (
          <Loader2 className="size-6 animate-spin text-primary" />
        ) : query.error ? (
          <p className="text-sm text-rose-700">Couldn't load contact messages: {query.error.message}</p>
        ) : (
          <>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Total messages</p>
            <p className="mt-1 font-serif text-4xl font-semibold">{query.data?.total ?? 0}</p>
            <div className="mt-6 grid gap-3">
              {(query.data?.messages ?? []).map(msg => (
                <div key={msg.id} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">{msg.name || "(no name given)"} <span className="font-normal text-muted-foreground">— {msg.email}</span></p>
                    <p className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{msg.message}</p>
                </div>
              ))}
              {!query.data?.messages.length && (
                <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground shadow-sm">No messages yet.</div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
