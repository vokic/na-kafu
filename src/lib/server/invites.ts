// Server-side invite logic (Supabase). The API routes are thin wrappers over these.
// Owns: token gen, friend-mode privacy stripping, first-open semantics, status, events, emails.
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateShortToken, generateToken } from '@/lib/data/tokens';
import { sendConfirmationEmail, sendNotificationEmail } from '@/lib/email/templates';
import { uploadPhotoFromDataUrl } from './storage';
import { ApiError } from './http';
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

export async function createInvite(payload: CreateInvitePayload, baseUrl: string): Promise<CreateInviteResult> {
  const places = Array.isArray(payload?.places) ? payload.places : [];
  if (places.length < 2 || places.length > 4) throw new ApiError('INVALID', 'Izaberi 2-4 mesta.');
  if (
    !payload.recipient_name?.trim() ||
    !payload.message?.trim() ||
    !payload.sender_signature?.trim() ||
    !payload.sender_email?.trim()
  ) {
    throw new ApiError('INVALID', 'Nedostaju obavezna polja.');
  }
  if (payload.mode !== 'direct' && payload.mode !== 'friend') throw new ApiError('INVALID', 'Nepoznat mod.');

  // Upload the photo to Storage (replaces the inline base64 with a public URL).
  let photoUrl: string | null = payload.sender_photo_url || null;
  if (photoUrl && photoUrl.startsWith('data:')) {
    photoUrl = await uploadPhotoFromDataUrl(photoUrl);
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

  await logEvent(invite.id, 'created');

  const shareUrl = `${baseUrl}/p/${invite.invite_token}`;
  const manageUrl = `${baseUrl}/m/${invite.manage_token}`;

  const sent = await sendConfirmationEmail(invite, shareUrl, manageUrl);
  if (sent) await logEvent(invite.id, 'email_sent', { kind: 'confirmation' });

  return {
    invite_token: invite.invite_token,
    manage_token: invite.manage_token,
    share_url: shareUrl,
    manage_url: manageUrl,
  };
}

export async function getInvite(token: string): Promise<RecipientView> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('invites').select('*').eq('invite_token', token.toLowerCase()).maybeSingle();
  if (error) throw new ApiError('SERVER', error.message);
  if (!data) throw new ApiError('NOT_FOUND', 'Pozivnica ne postoji.');
  const invite = data as Invite;
  ensureActive(invite);

  if (invite.status === 'pending') {
    await sb.from('invites').update({ status: 'opened', opened_at: nowIso() }).eq('id', invite.id);
    invite.status = 'opened';
    await logEvent(invite.id, 'link_opened');
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
    await sb.from('invites').update({ revealed_at: nowIso() }).eq('id', invite.id);
    await logEvent(invite.id, 'revealed');
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

  if (payload.decision === 'accepted' && !payload.place) throw new ApiError('INVALID', 'Izaberi mesto.');
  if (payload.decision === 'declined' && !payload.reason) throw new ApiError('INVALID', 'Razlog je obavezan.');
  if (payload.decision !== 'accepted' && payload.decision !== 'declined') throw new ApiError('INVALID', 'Nepoznata odluka.');

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

  await sb.from('invites').update({ status: payload.decision, responded_at: nowIso() }).eq('id', invite.id);
  await logEvent(invite.id, payload.decision, payload.decision === 'accepted' ? { place: row.place } : { reason: row.reason });

  const { data: respData } = await sb.from('responses').select('*').eq('invite_id', invite.id).maybeSingle();
  if (respData) {
    const sent = await sendNotificationEmail(invite, respData as InviteResponse, `${baseUrl}/m/${invite.manage_token}`);
    if (sent) await logEvent(invite.id, 'email_sent', { kind: 'notification' });
  }
}

export async function getManage(manageToken: string): Promise<ManageView> {
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
  const { error: updErr } = await sb.from('invites').update({ status: 'cancelled' }).eq('id', invite.id);
  if (updErr) throw new ApiError('SERVER', updErr.message);
  await logEvent(invite.id, 'cancelled');
}
