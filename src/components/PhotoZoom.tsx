'use client';

import { useRef, useState } from 'react';
import { track } from '@/lib/analytics';

// Avatar (circle, via background-image) that opens a full-screen zoom on click.
// Guards against the touch "ghost click": the opening tap can echo onto the lightbox
// (now under the finger) and close it instantly — so we ignore closes for ~250ms after open.
export default function PhotoZoom({ url, className }: { url: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const openedAt = useRef(0);

  function openZoom(e?: React.SyntheticEvent) {
    e?.stopPropagation();
    openedAt.current = Date.now();
    track('photo_zoomed');
    setOpen(true);
  }
  function closeZoom() {
    if (Date.now() - openedAt.current < 250) return;
    setOpen(false);
  }

  return (
    <>
      <div
        className={className}
        style={{ backgroundImage: `url("${url}")`, cursor: 'zoom-in' }}
        role="button"
        tabIndex={0}
        aria-label="Uvećaj sliku"
        onClick={openZoom}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openZoom();
          }
        }}
      />
      {open && (
        <div className="lightbox" onClick={closeZoom}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" />
        </div>
      )}
    </>
  );
}
