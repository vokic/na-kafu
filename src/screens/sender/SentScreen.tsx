'use client';

import { useState } from 'react';
import { PlaneIcon } from '@/components/hearts';
import AppRating from '@/components/AppRating';
import { track } from '@/lib/analytics';
import { SR, COPY } from '@/lib/i18n';
import type { Mode } from '@/lib/types';

export default function SentScreen({
  mode,
  recipientName,
  shareUrl,
  manageUrl,
  onPreview,
  onReset,
}: {
  mode: Mode;
  recipientName: string;
  shareUrl: string;
  manageUrl: string;
  onPreview: () => void;
  onReset: () => void;
}) {
  const c = COPY[mode];
  const [copied, setCopied] = useState(false);
  const [manageCopied, setManageCopied] = useState(false);
  const display = shareUrl.replace(/^https?:\/\//, '');
  const manageDisplay = manageUrl.replace(/^https?:\/\//, '');
  // sentLead's only markup is <b>{ime}</b>; render the name as a React child (escaped) instead
  // of dangerouslySetInnerHTML, so a name with HTML can't inject markup.
  const [leadBefore, leadAfter] = c.sentLead.split('<b>{ime}</b>');

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      /* clipboard may be blocked — button still gives feedback */
    }
    setCopied(true);
    track('share_link_copied');
    setTimeout(() => setCopied(false), 1800);
  }

  async function copyManage() {
    try {
      await navigator.clipboard.writeText(manageUrl);
    } catch {
      /* clipboard may be blocked */
    }
    setManageCopied(true);
    setTimeout(() => setManageCopied(false), 1800);
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
        <p className="lead" style={{ maxWidth: '31ch' }}>
          {leadBefore}
          <b>{recipientName}</b>
          {leadAfter}
        </p>
        <div style={{ marginTop: 22 }}>
          <div
            className="link-box"
            style={{ display: 'block', textAlign: 'center', borderRadius: 16, padding: '14px 18px', wordBreak: 'break-all' }}
          >
            {display}
          </div>
          <button
            className="copy"
            onClick={copy}
            style={{ width: '100%', marginTop: 10, padding: '15px', borderRadius: 999, fontSize: 15 }}
          >
            {copied ? SR.sent.copied : SR.sent.copy}
          </button>
        </div>
        <div className="note" style={{ display: 'block' }}>
          {SR.sent.expiryInfo}
        </div>

        <div style={{ marginTop: 18 }}>
          <label className="label">{SR.sent.manageLabel}</label>
          <div
            className="link-box"
            style={{ display: 'block', textAlign: 'center', borderRadius: 16, padding: '12px 16px', wordBreak: 'break-all', marginTop: 6 }}
          >
            {manageDisplay}
          </div>
          <button
            className="copy"
            onClick={copyManage}
            style={{ width: '100%', marginTop: 8, padding: '13px', borderRadius: 999, fontSize: 14 }}
          >
            {manageCopied ? SR.sent.copied : SR.sent.copy}
          </button>
          <div className="about" style={{ margin: '8px 2px 0', textAlign: 'center' }}>
            {SR.sent.manageHint}
          </div>
        </div>

        <AppRating context="sender" />
      </div>
      <div className="btn-row">
        <button
          className="btn btn-primary"
          onClick={() => {
            track('sent_preview_clicked');
            onPreview();
          }}
        >
          {SR.sent.preview}
        </button>
        <button className="btn btn-ghost" onClick={onReset}>
          {SR.sent.newOne}
        </button>
      </div>
    </section>
  );
}
