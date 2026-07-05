import { NextResponse } from 'next/server';
import { getManage } from '@/lib/server/invites';
import { baseUrlFrom, errorResponse } from '@/lib/server/http';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    await rateLimit(`manage:read:${clientIp(req)}`, 30, 60_000); // manage_token enumeration guard
    const { token } = await ctx.params;
    const view = await getManage(token, baseUrlFrom(req));
    return NextResponse.json(view);
  } catch (e) {
    return errorResponse(e);
  }
}
