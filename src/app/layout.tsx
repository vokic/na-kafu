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

export const metadata: Metadata = {
  title: 'na kafu?',
  description: 'Pozovi nekoga, bez treme. Pošalji pozivnicu na izlazak - sam, ili diskretno preko zajedničkog druga.',
  applicationName: 'na kafu?',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'na kafu?',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
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
