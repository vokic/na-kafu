'use client';

import { CheckIcon, RainIcon } from '@/components/hearts';

export interface ResultRow {
  k: string;
  v: string;
  contact?: boolean; // big accent value (contact handle)
  quote?: boolean; // muted quote styling (reply / note)
}

// Shared outcome view. Used for the recipient confirmation and the sender's manage view.
export default function ResultScreen({
  accepted,
  title,
  rows,
  note,
  footer,
}: {
  accepted: boolean;
  title: string;
  rows: ResultRow[];
  note?: string | null;
  footer?: React.ReactNode;
}) {
  return (
    <section className="screen on">
      <div className="stagger" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="smwrap-c" style={{ marginBottom: 20 }}>
          {accepted ? (
            <div className="smoosh">
              <CheckIcon size={58} />
            </div>
          ) : (
            <div className="smoosh calm">
              <RainIcon size={58} />
            </div>
          )}
        </div>
        <h1 className="sm">{title}</h1>
        {rows.length > 0 && (
          <div className="result-card" style={{ marginTop: 18 }}>
            {rows.map((r, i) => (
              <div key={i}>
                <div className="k" style={i > 0 ? { marginTop: 16 } : undefined}>
                  {r.k}
                </div>
                <div
                  className={`v${r.contact ? ' contact' : ''}`}
                  style={r.quote ? { fontWeight: 500, fontSize: 15 } : undefined}
                >
                  {r.quote ? `“${r.v}”` : r.v}
                </div>
              </div>
            ))}
          </div>
        )}
        {note && (
          <div className="note" style={{ display: 'block' }}>
            {note}
          </div>
        )}
      </div>
      {footer && <div className="btn-row">{footer}</div>}
    </section>
  );
}
