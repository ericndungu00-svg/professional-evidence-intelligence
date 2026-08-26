import { Resend } from "resend";
import { ENV } from "./env";

const resend = ENV.resendApiKey ? new Resend(ENV.resendApiKey) : null;

// Where Contact-page submissions are notified. Not an env var: it's a
// fixed business address, not something that should differ per
// environment.
const CONTACT_NOTIFICATION_EMAIL = "hello@provemycv.com";

// Never leaks whether the send actually happened to the caller in a way
// that would let a client distinguish "no account" from "email failed" --
// callers (auth.requestPasswordReset) return the same generic response
// either way and rely on this throwing so the failure is still visible in
// server logs, not silently swallowed.
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured -- cannot send password reset email.");
  }
  const { error } = await resend.emails.send({
    from: ENV.resendFromEmail,
    to,
    subject: "Reset your password",
    html: `<p>Someone requested a password reset for this account.</p><p><a href="${resetUrl}">Choose a new password</a></p><p>This link expires in 30 minutes. If you didn't request this, you can safely ignore this email -- your password hasn't been changed.</p>`,
    text: `Someone requested a password reset for this account.\n\nChoose a new password: ${resetUrl}\n\nThis link expires in 30 minutes. If you didn't request this, you can safely ignore this email -- your password hasn't been changed.`,
  });
  if (error) {
    throw new Error(`Resend API error: ${error.name} -- ${error.message}`);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Best-effort: the message is already durably stored (see
// createContactMessage in db.ts) before this is called, so a failure here
// just means the notification didn't arrive -- it never means the
// submission was lost. replyTo is set to the visitor's own address so
// replying to this email reaches them directly, same as a normal inbound
// message would.
export async function sendContactNotificationEmail(from: { name: string | null; email: string; message: string }): Promise<void> {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured -- cannot send contact notification email.");
  }
  const displayName = from.name?.trim() || "(no name given)";
  const { error } = await resend.emails.send({
    from: ENV.resendFromEmail,
    to: CONTACT_NOTIFICATION_EMAIL,
    replyTo: from.email,
    subject: `New contact message from ${displayName}`,
    html: `<p><strong>From:</strong> ${escapeHtml(displayName)} (${escapeHtml(from.email)})</p><p><strong>Message:</strong></p><p>${escapeHtml(from.message).replace(/\n/g, "<br>")}</p>`,
    text: `From: ${displayName} (${from.email})\n\nMessage:\n${from.message}`,
  });
  if (error) {
    throw new Error(`Resend API error: ${error.name} -- ${error.message}`);
  }
}

// Verification is non-blocking (see the schema comment on
// users.emailVerified), so unlike sendPasswordResetEmail this is allowed to
// fail without threatening account access -- callers log the failure and
// move on rather than needing to hide it behind a generic response.
export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured -- cannot send verification email.");
  }
  const { error } = await resend.emails.send({
    from: ENV.resendFromEmail,
    to,
    subject: "Confirm your email address",
    html: `<p>Welcome to ProveMyCV. Please confirm this is your email address:</p><p><a href="${verifyUrl}">Confirm my email</a></p><p>This link expires in 7 days. You can keep using your account either way -- this just confirms we can reach you.</p>`,
    text: `Welcome to ProveMyCV. Please confirm this is your email address:\n\nConfirm my email: ${verifyUrl}\n\nThis link expires in 7 days. You can keep using your account either way -- this just confirms we can reach you.`,
  });
  if (error) {
    throw new Error(`Resend API error: ${error.name} -- ${error.message}`);
  }
}
