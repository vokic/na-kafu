import { NextResponse } from 'next/server';
import { createInvite } from '@/lib/server/invites';
import { ApiError, baseUrlFrom, errorResponse } from '@/lib/server/http';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';

// 6MB photo → ~8MB as base64; allow some headroom for the rest of the JSON, then reject
// before req.json() parses a huge data-URL into memory (the 6MB decode check runs later).
const MAX_BODY_BYTES = 9 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    rateLimit(`invites:create:min:${ip}`, 5, 60_000); // burst guard
    rateLimit(`invites:create:hr:${ip}`, 20, 60 * 60_000); // sustained guard
    const len = Number(req.headers.get('content-length') ?? '0');
    if (len > MAX_BODY_BYTES) throw new ApiError('INVALID', 'Zahtev je prevelik.');
    const body = await req.json();
    const result = await createInvite(body, baseUrlFrom(req));
    return NextResponse.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
