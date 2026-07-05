import { NextResponse } from 'next/server';
import { createInvite } from '@/lib/server/invites';
import { ApiError, baseUrlFrom, errorResponse } from '@/lib/server/http';
import { clientIp, rateLimit, rateLimitAll } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';

// 6MB photo → ~8MB as base64; allow some headroom for the rest of the JSON, then reject
// before req.json() parses a huge data-URL into memory (the 6MB decode check runs later).
const MAX_BODY_BYTES = 9 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    await rateLimitAll([
      { key: `invites:create:min:${ip}`, limit: 5, windowMs: 60_000 }, // burst guard
      { key: `invites:create:hr:${ip}`, limit: 20, windowMs: 60 * 60_000 }, // sustained guard
    ]);
    const len = Number(req.headers.get('content-length') ?? '0');
    if (len > MAX_BODY_BYTES) throw new ApiError('INVALID', 'Zahtev je prevelik.');
    const body = await req.json();
    // Per-address daily cap: createInvite emails sender_email, so this stops the platform
    // being used to bombard an arbitrary inbox from rotating IPs.
    if (typeof body?.sender_email === 'string') {
      await rateLimit(`invites:create:email:${body.sender_email.trim().toLowerCase()}`, 10, 24 * 60 * 60_000);
    }
    const result = await createInvite(body, baseUrlFrom(req), ip);
    return NextResponse.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
