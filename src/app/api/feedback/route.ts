import { NextResponse } from 'next/server';
import { submitFeedback } from '@/lib/server/feedback';
import { errorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { value, comment, context } = await req.json();
    await submitFeedback(value, comment, context);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
