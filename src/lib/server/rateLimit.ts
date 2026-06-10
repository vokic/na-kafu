import { ApiError } from './http';

// Best-effort in-memory rate limiter (sliding window, keyed by IP).
//
// LIMITATION: state lives in the module scope of a single serverless instance, so on
// Netlify/Vercel it resets on cold start and isn't shared across concurrent instances.
// That's enough to blunt casual abuse (token enumeration, spam-blasting invite creation)
// for the MVP. For a hard distributed guarantee, swap this for Upstash Redis later — the
// call sites (rateLimit(...)) stay the same.

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

// Opportunistic cleanup so the Map can't grow unbounded across many distinct IPs.
function sweep(now: number): void {
  if (buckets.size < 5000) return;
  for (const [key, w] of buckets) {
    if (w.resetAt <= now) buckets.delete(key);
  }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-nf-client-connection-ip') ?? req.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Throws ApiError('RATE_LIMITED') if `key` has exceeded `limit` hits within `windowMs`.
 * Call at the top of a route handler, e.g. rateLimit(`invites:${clientIp(req)}`, 5, 60_000).
 */
export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  sweep(now);
  const w = buckets.get(key);
  if (!w || w.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  w.count += 1;
  if (w.count > limit) throw new ApiError('RATE_LIMITED', 'Previše zahteva. Sačekaj malo pa pokušaj ponovo.');
}
