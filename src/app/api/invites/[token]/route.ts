import { NextResponse } from 'next/server';
import { getInvite } from '@/lib/server/invites';
import { errorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const preview = new URL(req.url).searchParams.get('preview') === '1';
    const view = await getInvite(token, preview);
    return NextResponse.json(view);
  } catch (e) {
    return errorResponse(e);
  }
}
