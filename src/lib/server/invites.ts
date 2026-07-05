// Server-side invite logic (Supabase). The API routes are thin wrappers over these.
// Owns: token gen, friend-mode privacy stripping, first-open semantics, status, events, emails.
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateShortToken, generateToken } from '@/lib/data/tokens';
import { sendConfirmationEmail, sendNotificationEmail } from '@/lib/email/templates';
import { uploadPhotoFromDataUrl, type UploadedPhoto } from './storage';
import { ApiError } from './http';
import { SR } from '@/lib/i18n/sr';
import { THEMES } from '@/lib/types';

// Server-side length caps (DB columns are unbounded `text`; client also limits, but the
// public endpoint is unauthenticated so we re-enforce here). Reject rather than truncate
// so the sender knows their text was too long.
const MAX = {
  recipient_name: 80,
  message: 2000,
  sender_signature: 120,
  sender_about: 500,
  sender_email: 254,
  contact_value: 200,
  reply_note: 1000,
  reason_note: 1000,
} as const;

function ensureMax(value: string | null | undefined, limit: number, label: string): void {
  if (value && value.length > limit) throw new ApiError('INVALID', `${label} je predugačko.`);
}

// Minimal server-side email shape check (client also validates; junk addresses otherwise
// get stored and silently fail at send time).
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
import type {
  CreateInvitePayload,
  CreateInviteResult,
  Invite,
  InviteEvent,
  InviteResponse,
  ManageView,
  RecipientView,
  RespondPayload,
  RevealResult,
} from '@/lib/types';

const nowIso = () => new Date().toISOString();

function ensureNotExpired(invite: Invite): void {
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    throw new ApiError('EXPIRED', 'Pozivnica je istekla.');
  }
}

// Recipient-facing guard: cancelled invites read as expired so the link is dead.
function ensureActive(invite: Invite): void {
  if (invite.status === 'cancelled') throw new ApiError('EXPIRED', 'Pozivnica je otkazana.');
  ensureNotExpired(invite);
}

async function logEvent(inviteId: string, type: string, meta: Record<string, unknown> | null = null) {
  await supabaseAdmin().from('events').insert({ invite_id: inviteId, type, meta });
}

// `ip` is recorded in the events log (created / photo_uploaded meta) as abuse evidence —
// together with the untouched original photo in the private bucket it's what we can hand
// to authorities on a report. Purged with the invite by the retention job.
export async function createInvite(payload: CreateInvitePayload, baseUrl: string, ip?: string): Promise<CreateInviteResult> {
  const places = Array.isArray(payload?.places) ? payload.places : [];
  if (places.length < 2 || places.length > 4) throw new ApiError('INVALID', 'Izaberi 2-4 mesta.');
  if (!places.every((p) => typeof p === 'string' && SR.places.includes(p as (typeof SR.places)[number]))) {
    throw new ApiError('INVALID', 'Nepoznato mesto.');
  }
  if (
    !payload.recipient_name?.trim() ||
    !payload.message?.trim() ||
    !payload.sender_signature?.trim() ||
    !payload.sender_email?.trim()
  ) {
    throw new ApiError('INVALID', 'Nedostaju obavezna polja.');
  }
  if (payload.mode !== 'direct' && payload.mode !== 'friend') throw new ApiError('INVALID', 'Nepoznat mod.');
  if (!isValidEmail(payload.sender_email.trim())) throw new ApiError('INVALID', 'Email nije ispravan.');
  if (!THEMES.includes(payload.theme)) throw new ApiError('INVALID', 'Nepoznata tema.');

  ensureMax(payload.recipient_name, MAX.recipient_name, 'Ime');
  ensureMax(payload.message, MAX.message, 'Poruka');
  ensureMax(payload.sender_signature, MAX.sender_signature, 'Potpis');
  ensureMax(payload.sender_about, MAX.sender_about, 'O sebi');
  ensureMax(payload.sender_email, MAX.sender_email, 'Email');

  // Upload the photo to Storage (replaces the inline base64 with a public URL of the
  // cleaned copy; the original is preserved in the private evidence bucket).
  let photoUrl: string | null = payload.sender_photo_url || null;
  let photoOriginal: UploadedPhoto['original'] | null = null;
  if (photoUrl && photoUrl.startsWith('data:')) {
    const uploaded = await uploadPhotoFromDataUrl(photoUrl);
    photoUrl = uploaded?.url ?? null;
    photoOriginal = uploaded?.original ?? null;
  }

  const sb = supabaseAdmin();
  let invite: Invite | null = null;
  for (let i = 0; i < 6; i++) {
    const { data, error } = await sb
      .from('invites')
      .insert({
        invite_token: generateShortToken(),
        manage_token: generateToken(),
        mode: payload.mode,
        sender_email: payload.sender_email.trim(),
        sender_signature: payload.sender_signature.trim(),
        sender_about: payload.sender_about?.trim() || null,
        sender_photo_url: photoUrl,
        recipient_name: payload.recipient_name.trim(),
        message: payload.message.trim(),
        places,
        theme: payload.theme,
      })
      .select()
      .single();
    if (!error && data) {
      invite = data as Invite;
      break;
    }
    if (error && error.code === '23505') continue; // token collision → retry
    if (error) throw new ApiError('SERVER', error.message);
  }
  if (!invite) throw new ApiError('CONFLICT', 'Ne mogu da napravim jedinstven token, pokušaj ponovo.');

  await logEvent(invite.id, 'created', ip ? { ip } : null);
  if (photoOriginal) await logEvent(invite.id, 'photo_uploaded', { ...photoOriginal, ip: ip ?? null });

  const shareUrl = `${baseUrl}/p/${invite.invite_token}`;
  const manageUrl = `${baseUrl}/m/${invite.manage_token}`;

  const sent = await sendConfirmationEmail(invite, shareUrl, manageUrl);
  await logEvent(invite.id, sent ? 'email_sent' : 'email_failed', { kind: 'confirmation' });

  return {
    invite_token: invite.invite_token,
    manage_token: invite.manage_token,
    share_url: shareUrl,
    manage_url: manageUrl,
  };
}

export async function getInvite(token: string, preview = false): Promise<RecipientView> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('invites').select('*').eq('invite_token', token.toLowerCase()).maybeSingle();
  if (error) throw new ApiError('SERVER', error.message);
  if (!data) throw new ApiError('NOT_FOUND', 'Pozivnica ne postoji.');
  const invite = data as Invite;
  ensureActive(invite);

  // Preview (sender viewing their own invite) is read-only: don't mark opened or log.
  if (!preview && invite.status === 'pending') {
    const { error: updErr } = await sb
      .from('invites')
      .update({ status: 'opened', opened_at: nowIso() })
      .eq('id', invite.id);
    if (updErr) console.error('[invites] failed to mark opened', invite.id, updErr.message);
    else {
      invite.status = 'opened';
      await logEvent(invite.id, 'link_opened');
    }
  }

  const { data: resp } = await sb.from('responses').select('*').eq('invite_id', invite.id).maybeSingle();
  const response = (resp as InviteResponse | null) ?? null;
  const revealed = !!invite.revealed_at;
  const hide = invite.mode === 'friend' && !revealed;

  return {
    invite_token: invite.invite_token,
    mode: invite.mode,
    recipient_name: invite.recipient_name,
    message: invite.message,
    places: invite.places,
    theme: invite.theme,
    status: invite.status,
    sender_signature: hide ? null : invite.sender_signature,
    sender_about: invite.sender_about,
    sender_photo_url: hide ? null : invite.sender_photo_url,
    revealed,
    already_responded: !!response,
    decision: response?.decision ?? null,
  };
}

export async function reveal(token: string): Promise<RevealResult> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('invites').select('*').eq('invite_token', token.toLowerCase()).maybeSingle();
  if (error) throw new ApiError('SERVER', error.message);
  if (!data) throw new ApiError('NOT_FOUND', 'Pozivnica ne postoji.');
  const invite = data as Invite;
  ensureActive(invite);
  if (invite.mode !== 'friend') throw new ApiError('INVALID', 'Otkrivanje važi samo za "preko druga".');
  if (!invite.revealed_at) {
    const { error: updErr } = await sb.from('invites').update({ revealed_at: nowIso() }).eq('id', invite.id);
    if (updErr) console.error('[invites] failed to mark revealed', invite.id, updErr.message);
    else await logEvent(invite.id, 'revealed');
  }
  return { sender_signature: invite.sender_signature, sender_photo_url: invite.sender_photo_url };
}

export async function respond(token: string, payload: RespondPayload, baseUrl: string): Promise<void> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('invites').select('*').eq('invite_token', token.toLowerCase()).maybeSingle();
  if (error) throw new ApiError('SERVER', error.message);
  if (!data) throw new ApiError('NOT_FOUND', 'Pozivnica ne postoji.');
  const invite = data as Invite;
  ensureActive(invite);

  if (payload.decision !== 'accepted' && payload.decision !== 'declined') throw new ApiError('INVALID', 'Nepoznata odluka.');
  if (payload.decision === 'accepted') {
    if (!payload.place) throw new ApiError('INVALID', 'Izaberi mesto.');
    if (!invite.places.includes(payload.place)) throw new ApiError('INVALID', 'Mesto nije ponuđeno.');
    ensureMax(payload.contact_value, MAX.contact_value, 'Kontakt');
    ensureMax(payload.reply_note, MAX.reply_note, 'Poruka');
  }
  if (payload.decision === 'declined') {
    if (!payload.reason) throw new ApiError('INVALID', 'Razlog je obavezan.');
    if (!SR.reasons.includes(payload.reason as (typeof SR.reasons)[number])) {
      throw new ApiError('INVALID', 'Nepoznat razlog.');
    }
    ensureMax(payload.reason_note, MAX.reason_note, 'Poruka');
  }

  const row = {
    invite_id: invite.id,
    decision: payload.decision,
    place: payload.decision === 'accepted' ? payload.place : null,
    contact_type: payload.decision === 'accepted' ? payload.contact_type ?? null : null,
    contact_value: payload.decision === 'accepted' ? payload.contact_value?.trim() || null : null,
    reply_note: payload.decision === 'accepted' ? payload.reply_note?.trim() || null : null,
    reason: payload.decision === 'declined' ? payload.reason : null,
    reason_note: payload.decision === 'declined' ? payload.reason_note?.trim() || null : null,
  };
  const { error: insErr } = await sb.from('responses').insert(row);
  if (insErr) {
    if (insErr.code === '23505') throw new ApiError('ALREADY_RESPONDED', 'Već je odgovoreno.');
    throw new ApiError('SERVER', insErr.message);
  }

  // If this update fails the response row still exists (status stays 'opened'). Log it: a
  // drifted status would, e.g., let the sender cancel an invite that was actually answered.
  const { error: stErr } = await sb
    .from('invites')
    .update({ status: payload.decision, responded_at: nowIso() })
    .eq('id', invite.id);
  if (stErr) console.error('[invites] failed to set responded status', invite.id, stErr.message);
  await logEvent(invite.id, payload.decision, payload.decision === 'accepted' ? { place: row.place } : { reason: row.reason });

  const { data: respData } = await sb.from('responses').select('*').eq('invite_id', invite.id).maybeSingle();
  if (respData) {
    const sent = await sendNotificationEmail(invite, respData as InviteResponse, `${baseUrl}/m/${invite.manage_token}`);
    await logEvent(invite.id, sent ? 'email_sent' : 'email_failed', { kind: 'notification' });
  }
}

export async function getManage(manageToken: string, baseUrl: string): Promise<ManageView> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('invites').select('*').eq('manage_token', manageToken).maybeSingle();
  if (error) throw new ApiError('SERVER', error.message);
  if (!data) throw new ApiError('NOT_FOUND', 'Status ne postoji.');
  const invite = data as Invite;
  const { data: resp } = await sb.from('responses').select('*').eq('invite_id', invite.id).maybeSingle();
  const { data: evts } = await sb
    .from('events')
    .select('*')
    .eq('invite_id', invite.id)
    .order('created_at', { ascending: true });
  return {
    invite,
    response: (resp as InviteResponse | null) ?? null,
    events: (evts as InviteEvent[] | null) ?? [],
    share_url: `${baseUrl}/p/${invite.invite_token}`,
  };
}

// Sender cancels via their manage_token → status 'cancelled', recipient link dies.
// Refuses if already responded; idempotent if already cancelled.
export async function cancelInvite(manageToken: string): Promise<void> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('invites').select('*').eq('manage_token', manageToken).maybeSingle();
  if (error) throw new ApiError('SERVER', error.message);
  if (!data) throw new ApiError('NOT_FOUND', 'Pozivnica ne postoji.');
  const invite = data as Invite;
  if (invite.status === 'cancelled') return;
  if (invite.status === 'accepted' || invite.status === 'declined') {
    throw new ApiError('ALREADY_RESPONDED', 'Već je odgovoreno - ne može da se otkaže.');
  }
  // Status can drift (respond() inserts the response first; its status update may fail),
  // so also check the responses table — an answered invite must never be cancellable.
  const { data: existing, error: respErr } = await sb
    .from('responses')
    .select('id')
    .eq('invite_id', invite.id)
    .maybeSingle();
  if (respErr) throw new ApiError('SERVER', respErr.message);
  if (existing) throw new ApiError('ALREADY_RESPONDED', 'Već je odgovoreno - ne može da se otkaže.');
  const { error: updErr } = await sb.from('invites').update({ status: 'cancelled' }).eq('id', invite.id);
  if (updErr) throw new ApiError('SERVER', updErr.message);
  await logEvent(invite.id, 'cancelled');
}
