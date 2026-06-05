import type { Metadata, Viewport } from 'next';
import { Schibsted_Grotesk, Poppins } from 'next/font/google';
import './globals.css';

// Self-hosted via next/font → identical glyphs across iOS/Android/Samsung.
// latin-ext carries č ć š ž đ.
const schibsted = Schibsted_Grotesk({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-schibsted',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

const SITE_NAME = 'na kafu?';
const SITE_DESC = 'Pozovi nekoga, bez treme. Pošalji pozivnicu na izlazak - sam, ili diskretno preko zajedničkog druga.';
const SITE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || 'https://na-kafu.netlify.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESC,
  applicationName: SITE_NAME,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_NAME,
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'sr_RS',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESC,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESC,
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FAF5EB', // light default; ThemeProvider keeps it in sync per theme
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr" className={`${schibsted.variable} ${poppins.variable}`}>
      <body>{children}</body>
    </html>
  );
}
