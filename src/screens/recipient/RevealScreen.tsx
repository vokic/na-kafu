'use client';

import { SR } from '@/lib/i18n';
import type { RevealResult } from '@/lib/types';

export default function RevealScreen({
  reveal,
  onAccept,
  onReject,
}: {
  reveal: RevealResult;
  onAccept: () => void;
  onReject: () => void;
}) {
  const [namePart, handlePart] = reveal.sender_signature.split('@');
  const name = (namePart ?? '').trim();
  const handle = handlePart ? `@${handlePart.trim()}` : '';

  return (
    <section className="screen on">
      <div className="stagger" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 className="sm">
          {SR.reveal.heading.l1}
          <br />
          <span className="offset">{SR.reveal.heading.l2}</span>
        </h1>
        <div className="reveal-card">
          {reveal.sender_photo_url && (
            <div className="avatar has" style={{ backgroundImage: `url("${reveal.sender_photo_url}")` }} />
          )}
          <div className="who">{name}</div>
          <div className="handle">{handle}</div>
        </div>
      </div>
      <div className="btn-row">
        <button className="btn btn-primary btn-yes" onClick={onAccept}>
          {SR.reveal.accept}
        </button>
        <button className="btn btn-outline" onClick={onReject}>
          {SR.reveal.reject}
        </button>
      </div>
    </section>
  );
}
