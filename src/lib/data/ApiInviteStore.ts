// Client InviteStore that talks to the Next API routes (BE phase). Same interface as
// LocalInviteStore, so components don't change — just the driver in index.ts.
import type {
  CreateInvitePayload,
  CreateInviteResult,
  ManageView,
  RecipientView,
  RespondPayload,
  RevealResult,
} from '@/lib/types';
import { InviteStore, StoreError, type StoreErrorCode } from './InviteStore';

async function handle<T>(res: Response): Promise<T> {
  if (res.ok) return (await res.json()) as T;
  let code: StoreErrorCode = res.status === 404 ? 'NOT_FOUND' : res.status === 410 ? 'EXPIRED' : 'INVALID';
  let message = 'Greška na serveru.';
  try {
    const body = await res.json();
    if (body?.error) message = body.error;
    if (['NOT_FOUND', 'ALREADY_RESPONDED', 'INVALID', 'CONFLICT', 'EXPIRED'].includes(body?.code)) {
      code = body.code as StoreErrorCode;
    }
  } catch {
    /* non-JSON error body */
  }
  throw new StoreError(code, message);
}

export class ApiInviteStore implements InviteStore {
  async createInvite(payload: CreateInvitePayload): Promise<CreateInviteResult> {
    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handle(res);
  }

  async getInvite(token: string): Promise<RecipientView> {
    const res = await fetch(`/api/invites/${encodeURIComponent(token)}`, { cache: 'no-store' });
    return handle(res);
  }

  async reveal(token: string): Promise<RevealResult> {
    const res = await fetch(`/api/invites/${encodeURIComponent(token)}/reveal`, { method: 'POST' });
    return handle(res);
  }

  async respond(token: string, payload: RespondPayload): Promise<void> {
    const res = await fetch(`/api/invites/${encodeURIComponent(token)}/respond`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await handle(res);
  }

  async getManage(token: string): Promise<ManageView> {
    const res = await fetch(`/api/manage/${encodeURIComponent(token)}`, { cache: 'no-store' });
    return handle(res);
  }

  async cancelInvite(token: string): Promise<void> {
    const res = await fetch(`/api/manage/${encodeURIComponent(token)}/cancel`, { method: 'POST' });
    await handle(res);
  }

  async submitRating(value: 'up' | 'down', comment?: string, context?: string): Promise<void> {
    // Best-effort — feedback must never break the UX.
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value, comment, context }),
      });
    } catch {
      /* ignore */
    }
  }
}
