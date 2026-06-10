import { NextResponse } from 'next/server';
import { reveal } from '@/lib/server/invites';
import { errorResponse } from '@/lib/server/http';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    rateLimit(`invites:reveal:${clientIp(req)}`, 30, 60_000);
    const { token } = await ctx.params;
    const result = await reveal(token);
    return NextResponse.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
