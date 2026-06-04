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
