import { NextResponse } from 'next/server';
import { getInvite } from '@/lib/server/invites';
import { errorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const view = await getInvite(token);
    return NextResponse.json(view);
  } catch (e) {
    return errorResponse(e);
  }
}
