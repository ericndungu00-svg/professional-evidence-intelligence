import { LegalLayout, LegalSection } from "@/components/LegalLayout";

export default function Contact() {
  return (
    <LegalLayout title="Contact us" eyebrow="Get in touch">
      <LegalSection title="Email">
        <p>The quickest way to reach us — a question, a bug report, feedback, or a privacy request — is by email:</p>
        <p className="font-serif text-xl font-semibold text-foreground"><a href="mailto:hello@provemycv.com" className="text-primary underline underline-offset-4">hello@provemycv.com</a></p>
        <p className="text-xs text-muted-foreground">If clicking that doesn't open your mail app (common if you use webmail like Gmail in a browser, with no default mail app set), just copy the address above and send it from wherever you check your mail.</p>
      </LegalSection>
    </LegalLayout>
  );
}
