import { NextResponse } from 'next/server';
import { reveal } from '@/lib/server/invites';
import { errorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function POST(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const result = await reveal(token);
    return NextResponse.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
