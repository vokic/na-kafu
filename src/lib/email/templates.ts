// Transactional email content (Serbian). Minimal inline-styled HTML.
import type { Invite, InviteResponse } from '@/lib/types';
import { sendEmail } from './send';

// Escape user-controlled values before interpolating into email HTML. In friend mode the
// responder is untrusted, so place/reason/contact/reply/name could carry markup → phishing
// in an email the sender trusts. URLs (share/manage) are app-generated, not escaped here.
function esc(value: string | null | undefined): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="sr"><body style="margin:0;background:#E4E0D7;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:460px;margin:0 auto;background:#FFFFFF;border-radius:20px;padding:28px 24px;color:#0D0419">
    <div style="font-weight:800;font-size:20px;letter-spacing:-.5px;margin-bottom:14px">na kafu?</div>
    <h1 style="font-size:22px;line-height:1.2;margin:0 0 12px">${title}</h1>
    ${bodyHtml}
    <p style="color:#8a8290;font-size:12px;margin-top:24px">Poslato preko na kafu?.</p>
  </div></body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#0D0419;color:#FAF5EB;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:999px;margin:6px 0">${label}</a>`;
}

function buttonGhost(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#FFFFFF;color:#0D0419;text-decoration:none;font-weight:700;padding:11px 18px;border-radius:999px;border:1.5px solid #d9d4cb;margin:6px 0">${label}</a>`;
}

export async function sendConfirmationEmail(invite: Invite, shareUrl: string, manageUrl: string): Promise<boolean> {
  const friend = invite.mode === 'friend';
  const name = esc(invite.recipient_name);
  const how = friend
    ? `Daj ovaj link <b>drugu od poverenja</b> da ga prosledi osobi <b>${name}</b>. Ti ostaješ skriven dok ne prihvati.`
    : `Podeli ovaj link sa <b>${name}</b> preko Instagrama ili poruke.`;
  const html = shell(
    'Tvoja pozivnica je spremna.',
    `<p style="font-size:15px;line-height:1.5">${how}</p>
     <p style="margin:14px 0 4px;font-weight:700;font-size:13px">Link za deljenje</p>
     ${button(shareUrl, 'Otvori link')}
     <p style="color:#8a8290;font-size:12px;word-break:break-all;margin:4px 0 18px">${shareUrl}</p>
     <p style="margin:0 0 4px;font-weight:700;font-size:13px">Prati status (samo ti)</p>
     ${button(manageUrl, 'Vidi status')}
     <p style="color:#8a8290;font-size:12px;word-break:break-all;margin:4px 0 18px">${manageUrl}</p>
     <p style="margin:0 0 4px;font-weight:700;font-size:13px">Predomislio si se?</p>
     ${buttonGhost(`${manageUrl}?cancel=1`, 'Otkaži poziv')}
     <p style="color:#8a8290;font-size:12px;margin:4px 0 0">Otkazivanje odmah gasi link.</p>`,
  );
  return sendEmail({ to: invite.sender_email, subject: 'Tvoja pozivnica je spremna', html });
}

export async function sendNotificationEmail(
  invite: Invite,
  response: InviteResponse,
  manageUrl: string,
): Promise<boolean> {
  const accepted = response.decision === 'accepted';
  const name = esc(invite.recipient_name);
  let body: string;
  if (accepted) {
    const rows = [`<b>Mesto:</b> ${esc(response.place)}`];
    if (response.contact_value) rows.push(`<b>${esc(response.contact_type)}:</b> ${esc(response.contact_value)}`);
    if (response.reply_note) rows.push(`<b>Poruka:</b> "${esc(response.reply_note)}"`);
    body = `<p style="font-size:16px;line-height:1.5">${name} kaže <b>da</b>! 🎉</p>
            <p style="font-size:15px;line-height:1.6">${rows.join('<br>')}</p>`;
  } else {
    const rows = [`<b>Razlog:</b> ${esc(response.reason)}`];
    if (response.reason_note) rows.push(`<b>Poruka:</b> "${esc(response.reason_note)}"`);
    const hidden = invite.mode === 'friend' ? '<br><br>Ostao si skriven - niko ne zna da si ti pitao.' : '';
    body = `<p style="font-size:16px;line-height:1.5">Ovaj put ne.</p>
            <p style="font-size:15px;line-height:1.6">${rows.join('<br>')}${hidden}</p>`;
  }
  const html = shell(accepted ? `${name} kaže da!` : 'Stigao je odgovor.', `${body}
     <p style="margin-top:16px">${button(manageUrl, 'Vidi detalje')}</p>`);
  return sendEmail({ to: invite.sender_email, subject: accepted ? `${invite.recipient_name} kaže da!` : 'Stigao je odgovor', html });
}
