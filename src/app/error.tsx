'use client';

// Route-level error boundary: catches render/runtime throws in any page and shows a
// Serbian recovery screen instead of Next's raw English default. Self-contained styling
// (no theme vars / PhoneShell) so it renders even if the crash is in the theme layer.
import { useEffect } from 'react';
import { SR } from '@/lib/i18n';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: '32px 24px',
        textAlign: 'center',
        background: '#FAF5EB',
        color: '#0D0419',
        fontFamily: 'var(--font-schibsted), system-ui, sans-serif',
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.5px' }}>{SR.brand}</div>
      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px', margin: 0, maxWidth: '20ch', lineHeight: 1.15 }}>
        {SR.errors.generic}
      </h1>
      <button
        onClick={reset}
        style={{
          marginTop: 8,
          background: '#0D0419',
          color: '#FAF5EB',
          border: 'none',
          fontWeight: 700,
          fontSize: 16,
          padding: '14px 28px',
          borderRadius: 999,
          cursor: 'pointer',
        }}
      >
        {SR.errors.retry}
      </button>
    </main>
  );
}
