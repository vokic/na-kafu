import { NextResponse } from 'next/server';

// Maps to StoreErrorCode on the client.
export type ApiErrorCode =
  | 'NOT_FOUND'
  | 'ALREADY_RESPONDED'
  | 'INVALID'
  | 'CONFLICT'
  | 'EXPIRED'
  | 'RATE_LIMITED'
  | 'SERVER';

const STATUS: Record<ApiErrorCode, number> = {
  INVALID: 400,
  NOT_FOUND: 404,
  ALREADY_RESPONDED: 409,
  CONFLICT: 409,
  EXPIRED: 410,
  RATE_LIMITED: 429,
  SERVER: 500,
};

export class ApiError extends Error {
  code: ApiErrorCode;
  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

export function errorResponse(e: unknown): NextResponse {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: e.message, code: e.code }, { status: STATUS[e.code] });
  }
  console.error('[api] unhandled', e);
  const message = e instanceof Error ? e.message : 'Greška na serveru.';
  return NextResponse.json({ error: message, code: 'SERVER' }, { status: 500 });
}

// Absolute base URL for building share/manage links (and email links).
export function baseUrlFrom(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_BASE_URL;
  if (env) return env.replace(/\/$/, '');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}
