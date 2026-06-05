// localStorage-backed InviteStore (FE phase). Owns the logic the server will own
// later: token gen, friend-mode privacy stripping, first-open semantics, status
// transitions, event logging. Keyed by token so /p and /m read with no shared state.

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
  EventType,
} from '@/lib/types';
import { InviteStore, StoreError } from './InviteStore';
import { KEYS, readJSON, writeJSON } from './persistence';
import { generateId, generateShortToken, generateToken } from './tokens';
import { buildManageUrl, buildShareUrl } from './urls';

function now(): string {
  return new Date().toISOString();
}

export class LocalInviteStore implements InviteStore {
  private loadInvite(inviteToken: string): Invite | null {
    // Short tokens are lowercase (e.g. kqmxzp) → accept any case the user typed.
    return readJSON<Invite>(KEYS.invite(inviteToken.toLowerCase()));
  }

  private uniqueInviteToken(): string {
    for (let i = 0; i < 50; i++) {
      const t = generateShortToken();
      if (!readJSON(KEYS.invite(t))) return t;
    }
    return generateShortToken();
  }

  private expired(invite: Invite): boolean {
    return !!invite.expires_at && new Date(invite.expires_at).getTime() < Date.now();
  }

  private saveInvite(invite: Invite): void {
    writeJSON(KEYS.invite(invite.invite_token), invite);
  }

  private loadEvents(inviteToken: string): InviteEvent[] {
    return readJSON<InviteEvent[]>(KEYS.events(inviteToken)) ?? [];
  }

  private pushEvent(invite: Invite, type: EventType, meta: Record<string, unknown> | null = null): void {
    const events = this.loadEvents(invite.invite_token);
    const event: InviteEvent = {
      id: events.length ? events[events.length - 1].id + 1 : 1,
      invite_id: invite.id,
      type,
      meta,
      created_at: now(),
    };
    events.push(event);
    writeJSON(KEYS.events(invite.invite_token), events);
  }

  async createInvite(payload: CreateInvitePayload): Promise<CreateInviteResult> {
    const places = payload.places ?? [];
    if (places.length < 2 || places.length > 4) {
      throw new StoreError('INVALID', 'Izaberi 2–4 mesta.');
    }
    if (!payload.recipient_name?.trim() || !payload.message?.trim() || !payload.sender_signature?.trim()) {
      throw new StoreError('INVALID', 'Nedostaju obavezna polja.');
    }

    const inviteToken = this.uniqueInviteToken(); // short public token: ADW-198
    const manageToken = generateToken(); // long private token (bearer credential)
    const invite: Invite = {
      id: generateId(),
      invite_token: inviteToken,
      manage_token: manageToken,
      mode: payload.mode,
      sender_email: payload.sender_email.trim(),
      sender_signature: payload.sender_signature.trim(),
      sender_about: payload.sender_about?.trim() || null,
      sender_photo_url: payload.sender_photo_url || null,
      recipient_name: payload.recipient_name.trim(),
      message: payload.message.trim(),
      places,
      theme: payload.theme,
      status: 'pending',
      user_id: null,
      created_at: now(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      opened_at: null,
      responded_at: null,
      revealed_at: null,
    };

    this.saveInvite(invite);
    writeJSON(KEYS.manage(manageToken), inviteToken);
    this.pushEvent(invite, 'created');

    const index = readJSON<string[]>(KEYS.index) ?? [];
    index.push(inviteToken);
    writeJSON(KEYS.index, index);

    return {
      invite_token: inviteToken,
      manage_token: manageToken,
      share_url: buildShareUrl(inviteToken),
      manage_url: buildManageUrl(manageToken),
    };
  }

  async getInvite(inviteToken: string): Promise<RecipientView> {
    inviteToken = inviteToken.toLowerCase();
    const invite = this.loadInvite(inviteToken);
    if (!invite) throw new StoreError('NOT_FOUND', 'Pozivnica ne postoji.');
    if (this.expired(invite)) throw new StoreError('EXPIRED', 'Pozivnica je istekla.');

    // First open
    if (invite.status === 'pending') {
      invite.status = 'opened';
      invite.opened_at = now();
      this.saveInvite(invite);
      this.pushEvent(invite, 'link_opened');
    }

    const revealed = !!invite.revealed_at;
    const response = readJSON<InviteResponse>(KEYS.response(inviteToken));
    const hideIdentity = invite.mode === 'friend' && !revealed;

    return {
      invite_token: invite.invite_token,
      mode: invite.mode,
      recipient_name: invite.recipient_name,
      message: invite.message,
      places: invite.places,
      theme: invite.theme,
      status: invite.status,
      sender_signature: hideIdentity ? null : invite.sender_signature,
      sender_about: invite.sender_about, // teaser kept in friend mode (not identifying)
      sender_photo_url: hideIdentity ? null : invite.sender_photo_url,
      revealed,
      already_responded: !!response,
      decision: response?.decision ?? null,
    };
  }

  async reveal(inviteToken: string): Promise<RevealResult> {
    inviteToken = inviteToken.toLowerCase();
    const invite = this.loadInvite(inviteToken);
    if (!invite) throw new StoreError('NOT_FOUND', 'Pozivnica ne postoji.');
    if (this.expired(invite)) throw new StoreError('EXPIRED', 'Pozivnica je istekla.');
    if (invite.mode !== 'friend') throw new StoreError('INVALID', 'Otkrivanje važi samo za "preko druga".');

    if (!invite.revealed_at) {
      invite.revealed_at = now();
      this.saveInvite(invite);
      this.pushEvent(invite, 'revealed');
    }

    return {
      sender_signature: invite.sender_signature,
      sender_photo_url: invite.sender_photo_url,
    };
  }

  async respond(inviteToken: string, payload: RespondPayload): Promise<void> {
    inviteToken = inviteToken.toLowerCase();
    const invite = this.loadInvite(inviteToken);
    if (!invite) throw new StoreError('NOT_FOUND', 'Pozivnica ne postoji.');
    if (this.expired(invite)) throw new StoreError('EXPIRED', 'Pozivnica je istekla.');

    const existing = readJSON<InviteResponse>(KEYS.response(inviteToken));
    if (existing) throw new StoreError('ALREADY_RESPONDED', 'Već je odgovoreno.');

    if (payload.decision === 'accepted' && !payload.place) {
      throw new StoreError('INVALID', 'Izaberi mesto.');
    }
    if (payload.decision === 'declined' && !payload.reason) {
      throw new StoreError('INVALID', 'Razlog je obavezan.');
    }

    const response: InviteResponse = {
      id: generateId(),
      invite_id: invite.id,
      decision: payload.decision,
      place: payload.decision === 'accepted' ? payload.place : null,
      contact_type: payload.decision === 'accepted' ? payload.contact_type ?? null : null,
      contact_value: payload.decision === 'accepted' ? payload.contact_value?.trim() || null : null,
      reply_note: payload.decision === 'accepted' ? payload.reply_note?.trim() || null : null,
      reason: payload.decision === 'declined' ? payload.reason : null,
      reason_note: payload.decision === 'declined' ? payload.reason_note?.trim() || null : null,
      created_at: now(),
    };

    writeJSON(KEYS.response(inviteToken), response);

    invite.status = payload.decision;
    invite.responded_at = now();
    this.saveInvite(invite);

    this.pushEvent(
      invite,
      payload.decision,
      payload.decision === 'accepted' ? { place: response.place } : { reason: response.reason },
    );
    // SEAM: BE phase pushes 'email_sent' + calls Resend to notify the sender here.
  }

  async getManage(manageToken: string): Promise<ManageView> {
    const inviteToken = readJSON<string>(KEYS.manage(manageToken));
    if (!inviteToken) throw new StoreError('NOT_FOUND', 'Status ne postoji.');
    const invite = this.loadInvite(inviteToken);
    if (!invite) throw new StoreError('NOT_FOUND', 'Pozivnica ne postoji.');

    const response = readJSON<InviteResponse>(KEYS.response(inviteToken));
    const events = this.loadEvents(inviteToken);

    return { invite, response, events };
  }

  async submitRating(value: 'up' | 'down', comment?: string, context?: string): Promise<void> {
    const list = readJSON<{ value: string; comment: string | null; context?: string; at: string }[]>(KEYS.ratings) ?? [];
    list.push({ value, comment: comment?.trim() || null, context, at: now() });
    writeJSON(KEYS.ratings, list);
  }
}
