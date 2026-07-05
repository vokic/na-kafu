import { ApiError } from './http';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Distributed rate limiter: counters live in the `rate_limits` table and are checked
// atomically via the rate_limit_check() RPC (see supabase/schema.sql), so they survive
// cold starts and are shared across all serverless instances.
//
// FAIL-OPEN: if the DB check errors (outage, RPC not deployed yet, local dev without
// Supabase env), we log and fall back to the best-effort in-memory window below rather
// than block user traffic — every route's next statement hits the same DB anyway.

export interface RateCheck {
  key: string;
  limit: number;
  windowMs: number;
}

const MESSAGE = 'Previše zahteva. Sačekaj malo pa pokušaj ponovo.';

// --- degraded in-memory layer (per-instance; resets on cold start) ---

interface MemWindow {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, MemWindow>();

// Opportunistic cleanup so the Map can't grow unbounded across many distinct IPs.
function sweep(now: number): void {
  if (buckets.size < 5000) return;
  for (const [key, w] of buckets) {
    if (w.resetAt <= now) buckets.delete(key);
  }
}

function memoryLimit(check: RateCheck): void {
  const now = Date.now();
  sweep(now);
  const w = buckets.get(check.key);
  if (!w || w.resetAt <= now) {
    buckets.set(check.key, { count: 1, resetAt: now + check.windowMs });
    return;
  }
  w.count += 1;
  if (w.count > check.limit) throw new ApiError('RATE_LIMITED', MESSAGE);
}

// --- public API ---

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-nf-client-connection-ip') ?? req.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Throws ApiError('RATE_LIMITED') if any check exceeds its limit within its window.
 * All checks go to the DB in a single roundtrip.
 */
export async function rateLimitAll(checks: RateCheck[]): Promise<void> {
  try {
    const payload = checks.map((c) => ({
      key: c.key,
      limit: c.limit,
      window_s: Math.max(1, Math.round(c.windowMs / 1000)),
    }));
    const { data, error } = await supabaseAdmin().rpc('rate_limit_check', { checks: payload });
    if (error) throw error;
    if (data === true) throw new ApiError('RATE_LIMITED', MESSAGE);
    return;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    console.error('[rateLimit] DB check failed, using in-memory fallback', e);
  }
  for (const c of checks) memoryLimit(c);
}

/**
 * Single-key convenience, e.g. rateLimit(`invites:read:${clientIp(req)}`, 30, 60_000).
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  return rateLimitAll([{ key, limit, windowMs }]);
}
