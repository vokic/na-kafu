import { NextResponse } from 'next/server';
import { createInvite } from '@/lib/server/invites';
import { baseUrlFrom, errorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createInvite(body, baseUrlFrom(req));
    return NextResponse.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
