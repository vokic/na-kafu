import { NextResponse } from 'next/server';
import { cancelInvite } from '@/lib/server/invites';
import { errorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function POST(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    await cancelInvite(token);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
