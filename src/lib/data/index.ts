// Store singleton. Driver chosen by env: "api" (real backend) or "local" (localStorage).
import type { InviteStore } from './InviteStore';
import { LocalInviteStore } from './LocalInviteStore';
import { ApiInviteStore } from './ApiInviteStore';

export const store: InviteStore =
  process.env.NEXT_PUBLIC_DATA_DRIVER === 'api' ? new ApiInviteStore() : new LocalInviteStore();

export { StoreError } from './InviteStore';
export type { InviteStore } from './InviteStore';
