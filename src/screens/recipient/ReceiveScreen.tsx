'use client';

import { EnvelopeIcon } from '@/components/hearts';
import PhotoZoom from '@/components/PhotoZoom';
import { SR, COPY } from '@/lib/i18n';
import type { RecipientView } from '@/lib/types';

export default function ReceiveScreen({
  view,
  onPrimary,
  onDecline,
  busy = false,
  preview = false,
  error,
  onExitPreview,
}: {
  view: RecipientView;
  onPrimary: () => void; // direct → accept; friend → reveal
  onDecline: () => void;
  busy?: boolean;
  preview?: boolean; // sender previewing own invite → no accept/decline
  error?: string | null;
  onExitPreview?: () => void;
}) {
  const friend = view.mode === 'friend';
  const c = COPY[view.mode];
  const showAvatar = !friend && !!view.sender_photo_url;
  const showEnvelope = !friend && !view.sender_photo_url;

  return (
    <section className="screen on">
      <h1 className="sm" style={{ marginBottom: 18 }}>
        {c.recvTitle.l1}
        <br />
        <span className="offset">{c.recvTitle.l2}</span>
      </h1>

      <div className="card invite stagger">
        {showEnvelope && (
          <div className="smwrap">
            <div className="smoosh sm">
              <EnvelopeIcon size={48} />
            </div>
          </div>
        )}
        {friend && (
          <div className="qmark" style={{ display: 'flex' }}>
            ?
          </div>
        )}
        {showAvatar && view.sender_photo_url && <PhotoZoom url={view.sender_photo_url} className="avatar has" />}
        <div className="from" style={friend ? { textTransform: 'none' } : undefined}>
          {friend ? c.recvCardHeading : `Šalje · ${view.sender_signature ?? ''}`}
        </div>
        {view.sender_about && <div className="about">{view.sender_about}</div>}
        <div className="msg">{`“${view.message}”`}</div>
        <div className="opts">
          {view.places.map((p) => (
            <span key={p} className="pill">
              {p}
            </span>
          ))}
        </div>
      </div>

      {preview ? (
        <div className="btn-row">
          <div className="note" style={{ display: 'block', marginTop: 0 }}>
            {SR.recv.previewNote}
          </div>
          <button className="btn btn-ghost" onClick={onExitPreview}>
            {SR.recv.previewBack}
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div className="formerror" role="alert">
              {error}
            </div>
          )}
          <div className="btn-row">
            <button className="btn btn-primary btn-yes" onClick={onPrimary} disabled={busy}>
              {busy ? <span className="spinner" /> : friend ? SR.recv.reveal : SR.recv.acceptDirect}
            </button>
            <button className="btn btn-outline" onClick={onDecline} disabled={busy}>
              {SR.recv.decline}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
