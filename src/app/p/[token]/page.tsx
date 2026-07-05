import { cache } from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import ThemeProvider from '@/state/ThemeProvider';
import RecipientFlow from '@/screens/recipient/RecipientFlow';
import { getInvite } from '@/lib/server/invites';
import { ApiError } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { SR } from '@/lib/i18n/sr';
import type { RecipientView } from '@/lib/types';

// SSR of the public invite (HANDOVER §6): server-fetched payload + mode-aware OG meta, so
// a pasted link unfurls per invite. Never cache — an expired/cancelled invite must die.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Props = { params: Promise<{ token: string }> };
type LoadResult = { view: RecipientView | null; error: 'EXPIRED' | 'NOT_FOUND' | null };

async function ipFromHeaders(): Promise<string> {
  const h = await headers();
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return h.get('x-nf-client-connection-ip') ?? h.get('x-real-ip') ?? 'unknown';
}

// One read-only fetch per request, shared by generateMetadata and the page (react cache).
// preview=true → never marks the invite opened, so link-preview bots (WhatsApp/IG fetch
// the HTML without running JS) don't trip "opened" — the client fetch below does that.
// Shares the API's rate-limit bucket: SSR must not become an unmetered enumeration path.
const loadInvite = cache(async (token: string): Promise<LoadResult> => {
  try {
    await rateLimit(`invites:read:${await ipFromHeaders()}`, 30, 60_000);
    return { view: await getInvite(token, true), error: null };
  } catch (e) {
    if (e instanceof ApiError && e.code === 'EXPIRED') return { view: null, error: 'EXPIRED' };
    if (e instanceof ApiError && e.code === 'NOT_FOUND') return { view: null, error: 'NOT_FOUND' };
    // RATE_LIMITED / SERVER: undecided — render the shell and let the client fetch decide.
    return { view: null, error: null };
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const { view } = await loadInvite(token);
  const friend = view?.mode === 'friend';
  const title = !view ? SR.og.fallbackTitle : friend ? SR.og.friendTitle : SR.og.directTitle;
  const description = !view ? SR.og.fallbackDesc : friend ? SR.og.friendDesc : SR.og.directDesc;
  return {
    title,
    description,
    // Invite URLs are secrets — never index (mirrors /m and /stats).
    robots: { index: false, follow: false },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function RecipientPage({ params }: Props) {
  const { token } = await params;
  const { view, error } = await loadInvite(token);
  return (
    <ThemeProvider initialTheme={view?.theme ?? 'light'}>
      <RecipientFlow token={token} initialData={view} initialError={error} />
    </ThemeProvider>
  );
}
