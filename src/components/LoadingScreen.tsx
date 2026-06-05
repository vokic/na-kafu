'use client';

import { useEffect, useState } from 'react';
import { SR } from '@/lib/i18n';

// "Učitavanje" with animated dots cycling . → .. → ... → .
export default function LoadingScreen() {
  const [n, setN] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setN((x) => (x % 3) + 1), 400);
    return () => clearInterval(id);
  }, []);
  return (
    <section className="screen on">
      <div className="stagger" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 className="sm">
          {SR.loading}
          {/* fixed-width dot slot so the heading doesn't jump */}
          <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'left' }}>{'.'.repeat(n)}</span>
        </h1>
      </div>
    </section>
  );
}
