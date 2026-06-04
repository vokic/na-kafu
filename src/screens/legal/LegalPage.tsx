import Link from 'next/link';
import { SR } from '@/lib/i18n';

// Simple static legal layout (Server Component). Plain readable article, not the phone shell.
export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main
      style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '48px 22px 80px',
        color: '#0D0419',
        background: '#FAF5EB',
        minHeight: '100dvh',
      }}
    >
      <Link href="/" style={{ fontWeight: 800, fontSize: 21, letterSpacing: '-.6px', color: '#0D0419', textDecoration: 'none' }}>
        {SR.brand}
      </Link>
      <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1px', margin: '28px 0 8px' }}>{title}</h1>
      <div style={{ fontSize: 15, lineHeight: 1.6, fontWeight: 500, color: 'rgba(13,4,25,.75)' }}>{children}</div>
      <p style={{ marginTop: 40 }}>
        <Link href="/" style={{ color: '#0D0419', fontWeight: 700 }}>
          ← Nazad
        </Link>
      </p>
    </main>
  );
}
