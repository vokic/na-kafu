import { NextResponse } from 'next/server';
import { respond } from '@/lib/server/invites';
import { baseUrlFrom, errorResponse } from '@/lib/server/http';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    await rateLimit(`invites:respond:${clientIp(req)}`, 20, 60_000);
    const { token } = await ctx.params;
    const body = await req.json();
    await respond(token, body, baseUrlFrom(req));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
