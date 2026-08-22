import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[.2em] text-petrol">Professional Evidence Intelligence</p>
        <AlertCircle className="mx-auto mt-6 size-8 text-muted-foreground" />
        <h1 className="mt-5 font-serif text-4xl font-semibold text-ink">Page not found</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Sorry, the page you're looking for doesn't exist.
          <br />
          It may have been moved or deleted.
        </p>
        <div className="mt-8">
          <Button onClick={handleGoHome}>
            <Home className="size-4" />
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
