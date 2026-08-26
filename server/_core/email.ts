import { Resend } from "resend";
import { ENV } from "./env";

const resend = ENV.resendApiKey ? new Resend(ENV.resendApiKey) : null;

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
