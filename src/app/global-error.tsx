'use client';

// Last-resort boundary: catches throws in the root layout itself (where error.tsx can't
// help). Must render its own <html>/<body>. Inlined copy so it has no dependency that
// could itself be the thing that crashed.
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="sr">
      <body style={{ margin: 0 }}>
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
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.5px' }}>na kafu?</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px', margin: 0, maxWidth: '20ch', lineHeight: 1.15 }}>
            Nešto nije uspelo. Pokušaj ponovo.
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
            Pokušaj ponovo
          </button>
        </main>
      </body>
    </html>
  );
}
