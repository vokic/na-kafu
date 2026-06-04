// Store singleton. Swap this one line for ApiInviteStore in the BE phase.
import type { InviteStore } from './InviteStore';
import { LocalInviteStore } from './LocalInviteStore';

export const store: InviteStore = new LocalInviteStore();

export { StoreError } from './InviteStore';
export type { InviteStore } from './InviteStore';
