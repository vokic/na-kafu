import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';
import { getInvite } from '@/lib/server/invites';
import { rateLimit } from '@/lib/server/rateLimit';
import { SR } from '@/lib/i18n/sr';
import type { ThemeName } from '@/lib/types';

// Per-invite OG card in the invite's theme (HANDOVER §6). Identity-safe by construction:
// text depends only on mode/recipient_name — never the sender — so a friend-mode preview
// can't out the admirer even if shoulder-surfed in a chat list.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'na kafu?';

// Static copy of the theme tokens (globals.css) — satori can't read CSS variables.
// bg may be a flat color or a CSS gradient string.
const THEME_BG: Record<ThemeName, { bg: string; fg: string; pillBg: string; pillFg: string }> = {
  light: { bg: '#FAF5EB', fg: '#0D0419', pillBg: '#0D0419', pillFg: '#FAF5EB' },
  dark: { bg: '#0D0419', fg: '#FAF5EB', pillBg: '#FFB3C7', pillFg: '#0D0419' },
  pink: { bg: '#FFB3C7', fg: '#0D0419', pillBg: '#0D0419', pillFg: '#FFB3C7' },
  peach: { bg: '#FBE4DC', fg: '#1C3D4F', pillBg: '#FB4E8D', pillFg: '#FFFFFF' },
  holo: {
    bg: 'linear-gradient(158deg, #1c0a3e 0%, #3a14a0 16%, #5a3fe0 32%, #2f7fe0 46%, #1fb0c0 58%, #6a5fd0 68%, #c23a9e 78%, #ff3d7e 88%, #ffc23f 100%)',
    fg: '#FFFFFF',
    pillBg: '#FFFFFF',
    pillFg: '#1a0820',
  },
  aurora: {
    bg: 'linear-gradient(160deg, #0a0418 0%, #123c56 45%, #14808a 72%, #1FCDB0 100%)',
    fg: '#FFFFFF',
    pillBg: '#FFFFFF',
    pillFg: '#0a0418',
  },
  indigo: { bg: '#1B2A6B', fg: '#FFFFFF', pillBg: '#FFB3C7', pillFg: '#0D0419' },
};

// Bundled next to this file so ImageResponse can render č ć š ž đ (default font can't).
// Static join(process.cwd(), ...) path → Next's file tracing ships the TTF to serverless.
let fontData: Promise<Buffer> | null = null;
function loadFont(): Promise<Buffer> {
  fontData ??= readFile(join(process.cwd(), 'src/app/p/[token]/SchibstedGrotesk-ExtraBold.ttf'));
  return fontData;
}

export default async function OgImage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Any failure (bad token, expired, rate limited) → the generic brand card, so link
  // previews always look intentional and never reveal state.
  let title: string = SR.og.fallbackDesc;
  let theme: ThemeName = 'pink';
  try {
    const h = await headers();
    const ip = h.get('x-forwarded-for')?.split(',')[0].trim() ?? h.get('x-nf-client-connection-ip') ?? 'unknown';
    await rateLimit(`invites:read:${ip}`, 30, 60_000);
    const view = await getInvite(token, true);
    theme = view.theme;
    title = view.mode === 'friend' ? SR.og.friendTitle : `${view.recipient_name}, na kafu?`;
  } catch {
    /* keep the generic card */
  }

  const c = THEME_BG[theme] ?? THEME_BG.pink;
  // satori chokes on style keys holding `undefined` — build the bg entry conditionally.
  const bg = c.bg.startsWith('linear-gradient') ? { backgroundImage: c.bg } : { backgroundColor: c.bg };

  // If the traced font file is ever missing at runtime, degrade to satori's default font
  // (diacritics suffer) rather than 500-ing the preview.
  let fonts: { name: string; data: Buffer; weight: 800; style: 'normal' }[] = [];
  try {
    fonts = [{ name: 'Schibsted Grotesk', data: await loadFont(), weight: 800, style: 'normal' }];
  } catch (e) {
    console.error('[og] font load failed', e);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          ...bg,
          color: c.fg,
          fontFamily: 'Schibsted Grotesk',
        }}
      >
        <div style={{ display: 'flex', fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>na kafu?</div>
        <div
          style={{
            display: 'flex',
            fontSize: 88,
            fontWeight: 800,
            letterSpacing: -3,
            lineHeight: 1.05,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div style={{ display: 'flex' }}>
          <div
            style={{
              display: 'flex',
              background: c.pillBg,
              color: c.pillFg,
              fontSize: 30,
              fontWeight: 800,
              padding: '20px 36px',
              borderRadius: 999,
            }}
          >
            {SR.og.hint}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
