import { NextResponse } from 'next/server';
import { cancelInvite } from '@/lib/server/invites';
import { errorResponse } from '@/lib/server/http';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    await rateLimit(`manage:cancel:${clientIp(req)}`, 10, 60_000);
    const { token } = await ctx.params;
    await cancelInvite(token);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
