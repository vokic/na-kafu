'use client';

import { useEffect, useState } from 'react';
import { SR } from '@/lib/i18n';
import { track } from '@/lib/analytics';
import { SAMPLE_REASON_NOTE } from '@/lib/devSamples';

export interface RejectPayload {
  reason: string;
  reason_note: string;
}

export default function RejectScreen({
  onSubmit,
  onBack,
  busy,
  error,
  fillSignal = 0,
}: {
  onSubmit: (p: RejectPayload) => void;
  onBack: () => void;
  busy: boolean;
  error?: string | null;
  fillSignal?: number;
}) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  // ⚡ dev-fill (triggered from the shell button via an incrementing signal)
  useEffect(() => {
    if (!fillSignal) return;
    setReason(SR.reasons[0]);
    setNote(SAMPLE_REASON_NOTE);
  }, [fillSignal]);

  return (
    <section className="screen on">
      <h1 className="sm">
        {SR.reject.heading.l1} <span className="offset" style={{ marginLeft: 0 }}>{SR.reject.heading.l2}</span>
      </h1>
      <p className="lead">{SR.reject.lead}</p>

      <div className="stagger" style={{ marginTop: 4 }}>
        <div>
          <label className="label" id="r-reason-label">{SR.reject.reasonLabel}</label>
          <div className="chips" role="group" aria-labelledby="r-reason-label">
            {SR.reasons.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={reason === r}
                className={`chip${reason === r ? ' sel' : ''}`}
                onClick={() => setReason(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="r-note">
            {SR.reject.noteLabel} <small>· {SR.accept.opt}</small>
          </label>
          <textarea id="r-note" value={note} placeholder={SR.reject.notePlaceholder} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>

      {error && (
        <div className="formerror" role="alert">
          {error}
        </div>
      )}

      <div className="btn-row">
        <button
          className="btn btn-primary"
          disabled={!reason || busy}
          onClick={() => onSubmit({ reason, reason_note: note.trim() })}
        >
          {busy ? <span className="spinner" /> : SR.reject.submit}
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            track('back_clicked', { from: 'reject' });
            onBack();
          }}
        >
          {SR.accept.back}
        </button>
      </div>
    </section>
  );
}
