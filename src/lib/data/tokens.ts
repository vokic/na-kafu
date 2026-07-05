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

// Short, bit.ly-style public token: 8 lowercase letters with a dash after the 4th
// (e.g. "kafu-mila" style: "vrrn-uzit"). Alphabet drops q/w/x/y so links stay easy
// to dictate in Serbian. 22^8 ≈ 5.5e10 combinations — enumeration is impractical
// when paired with API rate limiting and the 24h invite expiry (HANDOVER §7.1 / §10).
// Old 6-letter tokens keep resolving (lookup is exact-match on the stored value).
const SHORT_ALPHABET = 'abcdefghijklmnoprstuvz'; // 22 letters
const SHORT_LEN = 8;
// Largest multiple of 22 that fits in a byte; rejecting bytes >= this removes the
// modulo bias a plain `byte % 22` would have.
const UNBIASED_LIMIT = 242;

export function generateShortToken(): string {
  let out = '';
  while (out.length < SHORT_LEN) {
    const bytes = new Uint8Array(SHORT_LEN * 2);
    crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (b >= UNBIASED_LIMIT) continue;
      out += SHORT_ALPHABET[b % SHORT_ALPHABET.length];
      if (out.length === SHORT_LEN) break;
    }
  }
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}
