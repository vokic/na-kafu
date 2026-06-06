// Domain types. Field names mirror HANDOVER §7.2 / §7.3 so DB rows map 1:1 later.

export type Mode = 'direct' | 'friend';

// Prototype ships 6 themes. NOTE: HANDOVER §5.2 calls "peach" -> "soft" and omits "aurora".
// We keep the prototype's literal data-theme values internally (CSS depends on them);
// the BE schema enum should map peach->soft and add aurora.
export type ThemeName = 'light' | 'dark' | 'pink' | 'peach' | 'holo' | 'aurora';

export type InviteStatus = 'pending' | 'opened' | 'accepted' | 'declined' | 'cancelled';
export type Decision = 'accepted' | 'declined';
export type ContactType = 'Instagram' | 'Telefon' | 'Email' | 'Snapchat';

export type EventType =
  | 'created'
  | 'link_opened'
  | 'revealed'
  | 'accepted'
  | 'declined'
  | 'cancelled'    // sender cancelled the invite (link dies)
  | 'email_sent'   // reserved (BE phase)
  | 'email_failed' // reserved
  | 'reported';    // reserved

export interface Invite {
  id: string;
  invite_token: string;
  manage_token: string;
  mode: Mode;
  sender_email: string;
  sender_signature: string;       // "Marko @marko" — hidden in friend mode pre-reveal
  sender_about: string | null;
  sender_photo_url: string | null; // FE: data: URL (base64). Later: storage URL.
  recipient_name: string;
  message: string;
  places: string[];               // 2–4
  theme: ThemeName;
  status: InviteStatus;
  user_id: string | null;         // null in MVP
  created_at: string;             // ISO 8601
  expires_at: string;             // ISO 8601 — link/photo valid until this (24h)
  opened_at: string | null;
  responded_at: string | null;
  revealed_at: string | null;
}

export interface InviteResponse {
  id: string;
  invite_id: string;
  decision: Decision;
  place: string | null;
  contact_type: ContactType | null;
  contact_value: string | null;
  reply_note: string | null;
  reason: string | null;          // required when declined
  reason_note: string | null;
  created_at: string;
}

export interface InviteEvent {
  id: number;
  invite_id: string;
  type: EventType;
  meta: Record<string, unknown> | null;
  created_at: string;
}

// ---- API payloads / results (mirror §7.3) ----

export interface CreateInvitePayload {
  mode: Mode;
  sender_email: string;
  sender_signature: string;
  sender_about?: string | null;
  sender_photo_url?: string | null;
  recipient_name: string;
  message: string;
  places: string[];
  theme: ThemeName;
}

export interface CreateInviteResult {
  invite_token: string;
  manage_token: string;
  share_url: string;
  manage_url: string;
}

// Public recipient payload. Friend mode pre-reveal -> signature/photo nulled.
export interface RecipientView {
  invite_token: string;
  mode: Mode;
  recipient_name: string;
  message: string;
  places: string[];
  theme: ThemeName;
  status: InviteStatus;
  sender_signature: string | null;
  sender_about: string | null;
  sender_photo_url: string | null;
  revealed: boolean;
  already_responded: boolean;
  decision: Decision | null;
}

export interface RevealResult {
  sender_signature: string;
  sender_photo_url: string | null;
}

export type RespondPayload =
  | { decision: 'accepted'; place: string; contact_type?: ContactType; contact_value?: string; reply_note?: string }
  | { decision: 'declined'; reason: string; reason_note?: string };

export interface ManageView {
  invite: Invite;
  response: InviteResponse | null;
  events: InviteEvent[];
}
