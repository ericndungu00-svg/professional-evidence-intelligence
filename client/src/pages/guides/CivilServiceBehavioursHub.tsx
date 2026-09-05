import { LegalLayout, LegalSection } from "@/components/LegalLayout";
import { Button } from "@/components/ui/button";
import { civilServiceBehaviourGuides } from "@shared/civilServiceBehaviours";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

// Landing page for a specific, high-intent search term ("Civil Service
// Success Profile behaviour examples" and its variants) -- see
// server/_core/guideHtml.ts for the crawlable server-rendered version of
// this same content. Content lives in shared/civilServiceBehaviours.ts so
// both sides read the exact same data.
export default function CivilServiceBehavioursHub() {
  return (
    <LegalLayout eyebrow="Guide" title="Civil Service Success Profiles: the 9 behaviours, explained">
      <p>
        Success Profiles is the framework the UK Civil Service uses to assess candidates — most competitions test you against three to five of the nine behaviours below, not all nine, so check your job advert for which ones apply. Each guide covers what the behaviour actually means, what assessors are scoring, common mistakes, and a worked STAR example.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {civilServiceBehaviourGuides.map(guide => (
          <Link key={guide.slug} href={`/guides/civil-service-success-profiles/${guide.slug}`} className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
            <h3 className="font-serif text-lg font-semibold text-foreground">{guide.name}</h3>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{guide.standsFor}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">Read the guide <ArrowRight className="size-3" /></span>
          </Link>
        ))}
      </div>
      <LegalSection title="Check your own example against a behaviour">
        <p>Paste your own behaviour statement and the criteria you're being assessed against, and ProveMyCV shows you what's actually evidenced versus what's assumed — free, no account needed.</p>
        <Button asChild className="w-fit"><Link href="/">Check your own evidence</Link></Button>
      </LegalSection>
    </LegalLayout>
  );
}
