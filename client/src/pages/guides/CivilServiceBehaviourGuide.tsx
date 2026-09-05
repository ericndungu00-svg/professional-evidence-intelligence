import { LegalLayout, LegalSection } from "@/components/LegalLayout";
import { Button } from "@/components/ui/button";
import { civilServiceBehaviourGuides, getCivilServiceBehaviourGuide } from "@shared/civilServiceBehaviours";
import { Link, useParams } from "wouter";

// Single-purpose landing page for one behaviour's search term (e.g. "Civil
// Service Delivering at Pace examples"). See CivilServiceBehavioursHub.tsx
// and server/_core/guideHtml.ts (the crawlable server-rendered version of
// this same content).
export default function CivilServiceBehaviourGuide() {
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? getCivilServiceBehaviourGuide(slug) : undefined;

  if (!guide) {
    return <LegalLayout eyebrow="Civil Service Success Profiles" title="We don't have a guide for that behaviour">
      <p>The link may be mistyped. Here are all nine Success Profiles behaviours we do cover.</p>
      <Button asChild className="w-fit"><Link href="/guides/civil-service-success-profiles">See all 9 behaviours</Link></Button>
    </LegalLayout>;
  }

  const others = civilServiceBehaviourGuides.filter(item => item.slug !== guide.slug);

  return (
    <LegalLayout eyebrow="Civil Service Success Profiles" title={guide.name}>
      <p className="text-base text-foreground">{guide.standsFor}</p>

      <LegalSection title="What this behaviour means">
        <p>{guide.overview}</p>
      </LegalSection>

      <LegalSection title="What assessors are looking for">
        <ul className="list-disc space-y-1 pl-5">{guide.assessorsLookFor.map(item => <li key={item}>{item}</li>)}</ul>
      </LegalSection>

      <LegalSection title="Common mistakes">
        <ul className="list-disc space-y-1 pl-5">{guide.commonMistakes.map(item => <li key={item}>{item}</li>)}</ul>
      </LegalSection>

      <LegalSection title="How to structure your STAR example">
        <div className="grid gap-4">
          {guide.starGuidance.map(item => <div key={item.label}><p className="font-semibold text-foreground">{item.label}</p><p className="mt-1">{item.guidance}</p></div>)}
        </div>
      </LegalSection>

      <LegalSection title="Worked example">
        <div className="grid gap-4 rounded-lg border bg-card p-4">
          <div><p className="font-semibold text-foreground">Situation</p><p className="mt-1">{guide.workedExample.situation}</p></div>
          <div><p className="font-semibold text-foreground">Task</p><p className="mt-1">{guide.workedExample.task}</p></div>
          <div><p className="font-semibold text-foreground">Action</p><p className="mt-1">{guide.workedExample.action}</p></div>
          <div><p className="font-semibold text-foreground">Result</p><p className="mt-1">{guide.workedExample.result}</p></div>
        </div>
      </LegalSection>

      <LegalSection title="Check your own example">
        <p>Paste your own {guide.name} example and the job description or behaviour statement you're being assessed against — ProveMyCV shows you what's actually evidenced versus what's assumed. Free, no account needed.</p>
        <Button asChild className="w-fit"><Link href="/">Check your own evidence</Link></Button>
      </LegalSection>

      <LegalSection title="Other Success Profiles behaviours">
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {others.map(item => <li key={item.slug}><Link href={`/guides/civil-service-success-profiles/${item.slug}`} className="text-primary underline-offset-4 hover:underline">{item.name}</Link></li>)}
        </ul>
      </LegalSection>
    </LegalLayout>
  );
}
