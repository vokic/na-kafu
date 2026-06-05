// Pluggable email sender. Chooses provider by env at runtime:
//   1) SMTP/Gmail  — if SMTP_HOST is set (works without a domain)
//   2) Resend      — if RESEND_API_KEY is set (best deliverability; needs a verified domain to send to others)
//   3) no-op/log   — if neither is set (dev)
// Swapping providers needs no code change — just env vars.

interface Mail {
  to: string;
  subject: string;
  html: string;
}

function from(): string {
  return process.env.EMAIL_FROM || process.env.SMTP_USER || 'na kafu? <onboarding@resend.dev>';
}

export async function sendEmail(mail: Mail): Promise<boolean> {
  try {
    if (process.env.SMTP_HOST) {
      const nodemailer = await import('nodemailer');
      const transport = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 465),
        secure: Number(process.env.SMTP_PORT ?? 465) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transport.sendMail({ from: from(), to: mail.to, subject: mail.subject, html: mail.html });
      return true;
    }

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({ from: from(), to: mail.to, subject: mail.subject, html: mail.html });
      return true;
    }

    console.log('[email] (nije podešen provider) →', mail.to, '·', mail.subject);
    return false;
  } catch (e) {
    console.error('[email] slanje nije uspelo:', e);
    return false;
  }
}
