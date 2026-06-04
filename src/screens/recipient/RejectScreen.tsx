'use client';

import { useState } from 'react';
import { SR } from '@/lib/i18n';
import { isDev } from '@/lib/devFlag';

export interface RejectPayload {
  reason: string;
  reason_note: string;
}

export default function RejectScreen({
  onSubmit,
  onBack,
  busy,
}: {
  onSubmit: (p: RejectPayload) => void;
  onBack: () => void;
  busy: boolean;
}) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  return (
    <section className="screen on">
      <h1 className="sm">
        {SR.reject.heading.l1} <span className="offset">{SR.reject.heading.l2}</span>
      </h1>
      <p className="lead">{SR.reject.lead}</p>

      <div className="stagger" style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginTop: 4 }}>
        <div>
          <label className="label">{SR.reject.reasonLabel}</label>
          <div className="chips">
            {SR.reasons.map((r) => (
              <button key={r} type="button" className={`chip${reason === r ? ' sel' : ''}`} onClick={() => setReason(r)}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">
            {SR.reject.noteLabel} <small>· {SR.accept.opt}</small>
          </label>
          <textarea value={note} placeholder={SR.reject.notePlaceholder} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>

      <div className="btn-row">
        <button
          className="btn btn-primary"
          disabled={!reason || busy}
          onClick={() => onSubmit({ reason, reason_note: note.trim() })}
        >
          {SR.reject.submit}
        </button>
        <button className="btn btn-ghost" onClick={onBack}>
          {SR.accept.back}
        </button>
      </div>

      {isDev && (
        <button
          className="fillbtn"
          type="button"
          title="dev: popuni odgovor"
          onClick={() => {
            setReason(SR.reasons[0]);
            setNote('Baš si drag, ali trenutno ne tražim ništa.');
          }}
        >
          ⚡
        </button>
      )}
    </section>
  );
}
