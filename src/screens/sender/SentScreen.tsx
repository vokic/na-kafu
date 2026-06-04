'use client';

import { useState } from 'react';
import { PlaneIcon } from '@/components/hearts';
import { SR, COPY, interpolate } from '@/lib/i18n';
import type { Mode } from '@/lib/types';

export default function SentScreen({
  mode,
  recipientName,
  shareUrl,
  onPreview,
  onReset,
}: {
  mode: Mode;
  recipientName: string;
  shareUrl: string;
  onPreview: () => void;
  onReset: () => void;
}) {
  const c = COPY[mode];
  const [copied, setCopied] = useState(false);
  const display = shareUrl.replace(/^https?:\/\//, '');

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      /* clipboard may be blocked — button still gives feedback */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="screen on">
      <div className="stagger" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="smwrap-c" style={{ marginBottom: 24 }}>
          <div className="smoosh sm">
            <PlaneIcon size={56} />
          </div>
        </div>
        <h1 className="sm">
          {SR.sent.heading.l1}
          <br />
          <span className="offset">{SR.sent.heading.l2}</span>
        </h1>
        <p
          className="lead"
          style={{ maxWidth: '31ch' }}
          dangerouslySetInnerHTML={{ __html: interpolate(c.sentLead, { ime: recipientName }) }}
        />
        <div className="link-box" style={{ marginTop: 22 }}>
          <span>{display}</span>
          <button className="copy" onClick={copy}>
            {copied ? SR.sent.copied : SR.sent.copy}
          </button>
        </div>
      </div>
      <div className="btn-row">
        <button className="btn btn-primary" onClick={onPreview}>
          {SR.sent.preview}
        </button>
        <button className="btn btn-ghost" onClick={onReset}>
          {SR.sent.newOne}
        </button>
      </div>
    </section>
  );
}
