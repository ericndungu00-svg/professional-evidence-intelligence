import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LegalLayout, LegalSection } from "@/components/LegalLayout";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Contact() {
  const { user, isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(isAuthenticated ? (user?.email ?? "") : "");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const sendMessage = trpc.contact.send.useMutation({
    onSuccess: () => setSent(true),
    onError: error => toast.error(error.message || "Couldn't send that -- try again in a moment."),
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    sendMessage.mutate({ name: name.trim() || undefined, email: email.trim(), message: message.trim() });
  }

  return (
    <LegalLayout title="Contact us" eyebrow="Get in touch">
      <LegalSection title="Send us a message">
        {sent ? (
          <div className="flex items-start gap-3 rounded-lg border border-primary/15 bg-secondary/55 px-4 py-3 text-sm text-secondary-foreground">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <p>Thanks -- your message is on its way. We'll get back to you at the email address you gave.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid min-w-0 gap-1.5">
              <Label htmlFor="contact-name">Name (optional)</Label>
              <Input id="contact-name" value={name} onChange={e => setName(e.target.value)} maxLength={120} />
            </div>
            <div className="grid min-w-0 gap-1.5">
              <Label htmlFor="contact-email">Your email</Label>
              <Input id="contact-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} maxLength={320} />
            </div>
            <div className="grid min-w-0 gap-1.5">
              <Label htmlFor="contact-message">Message</Label>
              <Textarea id="contact-message" required value={message} onChange={e => setMessage(e.target.value)} maxLength={5000} rows={6} />
            </div>
            <Button type="submit" disabled={sendMessage.isPending} className="justify-self-start">{sendMessage.isPending && <Loader2 className="animate-spin" />}Send message</Button>
          </form>
        )}
      </LegalSection>

      <LegalSection title="Prefer email directly?">
        <p>You can also reach us at <a href="mailto:hello@provemycv.com" className="font-medium text-primary underline underline-offset-4">hello@provemycv.com</a>.</p>
      </LegalSection>
    </LegalLayout>
  );
}
