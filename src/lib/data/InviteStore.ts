// The data-layer contract. Shaped like the future REST API (HANDOVER §7.3) so the
// localStorage impl can be swapped for a fetch impl with zero component changes.
// All methods are async even though localStorage is sync — so the swap is signature-stable.

import type {
  CreateInvitePayload,
  CreateInviteResult,
  ManageView,
  RecipientView,
  RespondPayload,
  RevealResult,
} from '@/lib/types';

export type StoreErrorCode = 'NOT_FOUND' | 'ALREADY_RESPONDED' | 'INVALID' | 'CONFLICT' | 'EXPIRED';

export class StoreError extends Error {
  code: StoreErrorCode;
  constructor(code: StoreErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'StoreError';
  }
}

export interface InviteStore {
  createInvite(payload: CreateInvitePayload): Promise<CreateInviteResult>;

  /** Public recipient read. Friend pre-reveal strips signature/photo. First open -> status 'opened'. */
  getInvite(inviteToken: string): Promise<RecipientView>;

  /** Friend mode only. Reveals signature/photo, logs 'revealed'. */
  reveal(inviteToken: string): Promise<RevealResult>;

  /** Stores the response, sets status, logs accepted|declined. Throws if already responded. */
  respond(inviteToken: string, payload: RespondPayload): Promise<void>;

  /** Sender view: invite + response + events timeline. */
  getManage(manageToken: string): Promise<ManageView>;

  /** App feedback: thumbs up/down + optional short comment. `context` = where it came from. */
  submitRating(value: 'up' | 'down', comment?: string, context?: string): Promise<void>;
}
