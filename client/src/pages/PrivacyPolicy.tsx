import { LegalLayout, LegalSection } from "@/components/LegalLayout";

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" updated="25 August 2026">
      <LegalSection title="Who we are">
        <p>ProveMyCV (provemycv.com) is currently operated by Eric Ndungu, trading as an individual/sole trader based in England. In this policy, "we", "us", and "our" refer to Eric Ndungu. If this changes to a registered company in future, this policy will be updated to reflect that.</p>
        <p>Contact for any privacy question, or to exercise any of the rights below: <a href="mailto:privacy@provemycv.com" className="font-medium text-primary underline underline-offset-4">privacy@provemycv.com</a>.</p>
      </LegalSection>

      <LegalSection title="What we collect, and why">
        <p>What we collect depends on how you use the service.</p>
        <p><strong className="text-foreground">Trying it without an account (guest mode).</strong> You can paste a CV and a job description and run an analysis with no sign-up at all. That text is sent to our server purely to run the analysis, held in server memory only for up to 15 minutes, and is never written to a database. It's automatically discarded after that window (or sooner, once you close the tab) and we have no way to retrieve it afterwards.</p>
        <p><strong className="text-foreground">Creating an account.</strong> We collect your email address and a password (stored as a one-way cryptographic hash — we never store or can see your actual password) and, optionally, a name. Once signed in, anything you add — CV text, job descriptions, uploaded PDF/DOCX files, and the professional details you choose to enter (current role, profession, career goals, and so on) — is stored against your account so you can come back to it later. So are the results of any analysis you run.</p>
        <p><strong className="text-foreground">Technical data.</strong> A single session cookie keeps you signed in between visits. It's strictly necessary for the account features to work — it contains no tracking or advertising identifier, and we don't use any analytics or advertising cookies or scripts.</p>
      </LegalSection>

      <LegalSection title="How we use it">
        <p>We use the information you provide only to run the analysis you asked for and to operate your account: showing you your saved documents and past results, letting you sign in and reset your password, and letting you delete individual documents or your entire account.</p>
        <p>We do not use your CV, evidence, or job-description content for any purpose beyond providing you the analysis you requested — not for marketing, not for training any model of ours (we don't train models), and not for any other product.</p>
      </LegalSection>

      <LegalSection title="Third parties who process data on our behalf">
        <p>Running the service means a few specialist providers process data for us, strictly to deliver it:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li><strong className="text-foreground">Google (Gemini API)</strong> — the CV, evidence, and job-description text you submit for an analysis is sent to Google's Gemini API to generate the comparison. This applies to both guest and account use.</li>
          <li><strong className="text-foreground">Cloudflare (R2 storage)</strong> — files you upload (PDF/DOCX) are stored in Cloudflare R2, a private object storage bucket that isn't publicly accessible.</li>
          <li><strong className="text-foreground">Resend</strong> — sends the password-reset email when you request one, using only your email address.</li>
          <li><strong className="text-foreground">Railway</strong> — hosts our application and database infrastructure.</li>
        </ul>
        <p>We don't sell your data, and we don't share it with anyone for their own marketing purposes. Some of these providers may process data outside the UK; where that happens, we rely on the safeguards required under UK data protection law (such as Standard Contractual Clauses) to keep it protected.</p>
      </LegalSection>

      <LegalSection title="Automated processing">
        <p>The analysis itself is generated automatically, by an AI model. It's decision support for your own reference — it does not make any decision about you, and neither we nor any third party uses it to make an employment, HR, legal, or any other decision about you. It is not automated decision-making within the meaning of UK GDPR Article 22. As with any AI-generated output, it can be incomplete or mistaken; see the disclaimer shown throughout the app.</p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>Guest-mode data is never stored to begin with — it exists in server memory for up to 15 minutes and is then gone.</p>
        <p>If you have an account, we keep your documents and analysis history for as long as your account exists, so you can come back to them. You can delete an individual document at any time (which also removes any uploaded file from storage), or delete your entire account from the "About you" screen — this immediately and permanently erases your account, every document, and every past analysis, including the underlying files.</p>
      </LegalSection>

      <LegalSection title="Keeping it secure">
        <p>Passwords are hashed with bcrypt before storage — we cannot recover your actual password even if asked to. Session identifiers are stored as a server-side hash, not the raw value a browser holds. The site is served over HTTPS. No method of transmission or storage is perfectly secure, but we take reasonable, industry-standard steps to protect what you share with us.</p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>Under UK GDPR, you have the right to: access the personal data we hold about you; have inaccurate data corrected; have your data erased; restrict or object to our processing; and receive your data in a portable format. Most of these are available to you directly in the app (viewing your documents, deleting a document, deleting your whole account); for anything else, email <a href="mailto:privacy@provemycv.com" className="font-medium text-primary underline underline-offset-4">privacy@provemycv.com</a> and we'll respond within a reasonable time, and in any case within the timeframe UK GDPR requires.</p>
        <p>You also have the right to complain to the UK's data protection regulator, the Information Commissioner's Office (ICO), at ico.org.uk, if you believe we've mishandled your data.</p>
      </LegalSection>

      <LegalSection title="Children">
        <p>This service is intended for adults evaluating their own professional experience. It isn't directed at, and we don't knowingly collect data from, anyone under 18.</p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>We may update this policy as the service changes. If we make a material change, we'll update the "Last updated" date above; continued use of the service after a change means you accept the updated policy.</p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>Questions about this policy, or anything to do with your data: <a href="mailto:privacy@provemycv.com" className="font-medium text-primary underline underline-offset-4">privacy@provemycv.com</a>.</p>
      </LegalSection>
    </LegalLayout>
  );
}
