'use client';

import { useEffect, useState } from 'react';
import { SR } from '@/lib/i18n';
import { SAMPLE_CONTACT, SAMPLE_REPLY } from '@/lib/devSamples';
import type { ContactType } from '@/lib/types';

const CONTACTS: ContactType[] = ['Instagram', 'Telefon', 'Email', 'Snapchat'];

export interface AcceptPayload {
  place: string;
  contact_type: ContactType;
  contact_value: string;
  reply_note: string;
}

export default function AcceptScreen({
  places,
  onSubmit,
  onBack,
  busy,
  fillSignal = 0,
}: {
  places: string[];
  onSubmit: (p: AcceptPayload) => void;
  onBack: () => void;
  busy: boolean;
  fillSignal?: number;
}) {
  const [place, setPlace] = useState('');
  const [contactType, setContactType] = useState<ContactType>('Instagram');
  const [contactVal, setContactVal] = useState('');
  const [reply, setReply] = useState('');

  // ⚡ dev-fill (triggered from the shell button via an incrementing signal)
  useEffect(() => {
    if (!fillSignal) return;
    setPlace(places[0] ?? '');
    setContactType('Instagram');
    setContactVal(SAMPLE_CONTACT);
    setReply(SAMPLE_REPLY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillSignal]);

  return (
    <section className="screen on">
      <h1 className="sm">
        {SR.accept.heading.l1} <span className="offset" style={{ marginLeft: 0 }}>{SR.accept.heading.l2}</span>
      </h1>

      <div className="stagger" style={{ margin: '0 -24px', padding: '4px 24px 0' }}>
        <div>
          <label className="label">{SR.accept.placeLabel}</label>
          <div className="chips">
            {places.map((p) => (
              <button key={p} type="button" className={`chip${place === p ? ' sel' : ''}`} onClick={() => setPlace(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div>
            <label className="label">
              {SR.accept.contactLabel} <small>· {SR.accept.opt}</small>
            </label>
            <div className="seg">
              {CONTACTS.map((ct) => (
                <button key={ct} type="button" className={contactType === ct ? 'on' : ''} onClick={() => setContactType(ct)}>
                  {SR.accept.contactShort[ct]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <input
              type="text"
              value={contactVal}
              placeholder={SR.accept.placeholders[contactType]}
              onChange={(e) => setContactVal(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">
            {SR.accept.replyLabel} <small>· {SR.accept.opt}</small>
          </label>
          <textarea value={reply} placeholder={SR.accept.replyPlaceholder} onChange={(e) => setReply(e.target.value)} />
        </div>
      </div>

      <div className="btn-row">
        <button
          className="btn btn-primary btn-yes"
          disabled={!place || busy}
          onClick={() =>
            onSubmit({ place, contact_type: contactType, contact_value: contactVal.trim(), reply_note: reply.trim() })
          }
        >
          {SR.accept.submit}
        </button>
        <button className="btn btn-ghost" onClick={onBack}>
          {SR.accept.back}
        </button>
      </div>
    </section>
  );
}
