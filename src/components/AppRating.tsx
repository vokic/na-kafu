'use client';

import { useState } from 'react';
import { store } from '@/lib/data';
import { SR } from '@/lib/i18n';

function Thumb({ down }: { down?: boolean }) {
  // SVG thumb (not emoji — emoji renders as a tofu box on some devices).
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="currentColor"
      style={down ? { transform: 'rotate(180deg)' } : undefined}
      aria-hidden="true"
    >
      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
    </svg>
  );
}

export default function AppRating({ context }: { context?: string }) {
  const [value, setValue] = useState<'up' | 'down' | null>(null);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  function send() {
    if (!value || done) return;
    setDone(true);
    store.submitRating(value, comment.trim() || undefined, context).catch(() => {});
  }

  if (done) {
    return (
      <div className="note" style={{ display: 'block' }}>
        {SR.rating.thanks}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 18, textAlign: 'center' }}>
      <div className="k" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>
        {SR.rating.question}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 10 }}>
        <button
          className={`chip${value === 'up' ? ' sel' : ''}`}
          type="button"
          aria-label="dobro"
          onClick={() => setValue('up')}
          style={{ padding: '9px 18px' }}
        >
          <Thumb />
        </button>
        <button
          className={`chip${value === 'down' ? ' sel' : ''}`}
          type="button"
          aria-label="loše"
          onClick={() => setValue('down')}
          style={{ padding: '9px 18px' }}
        >
          <Thumb down />
        </button>
      </div>

      {value && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            value={comment}
            maxLength={200}
            placeholder={SR.rating.commentPlaceholder}
            onChange={(e) => setComment(e.target.value)}
          />
          <button className="btn btn-primary" type="button" style={{ padding: '13px' }} onClick={send}>
            {SR.rating.send}
          </button>
        </div>
      )}
    </div>
  );
}
