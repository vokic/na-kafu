import { NextResponse } from 'next/server';
import { getInvite } from '@/lib/server/invites';
import { errorResponse } from '@/lib/server/http';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    rateLimit(`invites:read:${clientIp(req)}`, 30, 60_000); // makes token enumeration impractical
    const { token } = await ctx.params;
    const preview = new URL(req.url).searchParams.get('preview') === '1';
    const view = await getInvite(token, preview);
    return NextResponse.json(view);
  } catch (e) {
    return errorResponse(e);
  }
}
