import { NextResponse } from 'next/server';
import { submitFeedback } from '@/lib/server/feedback';
import { errorResponse } from '@/lib/server/http';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    await rateLimit(`feedback:${clientIp(req)}`, 10, 60_000); // unbounded-insert guard
    const { value, comment, context } = await req.json();
    await submitFeedback(value, comment, context);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
