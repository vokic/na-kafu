import { NextResponse } from 'next/server';
import { getManage } from '@/lib/server/invites';
import { baseUrlFrom, errorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const view = await getManage(token, baseUrlFrom(req));
    return NextResponse.json(view);
  } catch (e) {
    return errorResponse(e);
  }
}
