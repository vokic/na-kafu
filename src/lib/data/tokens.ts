// Token + id generation. CLIENT-side now (FE phase); moves to the server (route
// handler / Postgres gen_random_uuid()) in the BE phase. Tokens are unguessable
// CSPRNG values, >=16 chars (HANDOVER §7.1 / §10).

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

export function generateToken(len = 16): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] & 63];
  return out;
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return generateToken(32);
}

// Short, bit.ly-style public token: 6 lowercase letters, no dashes (e.g. "kqmxzp").
// ~309M combinations — fine for the FE/demo phase. For production consider lengthening
// (HANDOVER §7.1 suggests >=16 for unguessability).
const SHORT_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

function pick(set: string, n: number): string {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  let s = '';
  for (let i = 0; i < n; i++) s += set[bytes[i] % set.length];
  return s;
}

export function generateShortToken(): string {
  return pick(SHORT_ALPHABET, 6);
}
