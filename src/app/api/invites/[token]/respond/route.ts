import { NextResponse } from 'next/server';
import { respond } from '@/lib/server/invites';
import { baseUrlFrom, errorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const body = await req.json();
    await respond(token, body, baseUrlFrom(req));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
