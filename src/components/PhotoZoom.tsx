'use client';

import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/analytics';

// Avatar (circle, via background-image) that opens a full-screen zoom on click.
// Touch "click-through" guard: the opening tap fires a compatibility mouse click that can land
// on the freshly-rendered lightbox and close it instantly. We only close when a press actually
// STARTS on the lightbox (pointerdown) — the click-through has no pointerdown there, so it's ignored.
export default function PhotoZoom({ url, className }: { url: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const pressedInside = useRef(false);

  function openZoom(e?: React.SyntheticEvent) {
    e?.stopPropagation();
    pressedInside.current = false;
    track('photo_zoomed');
    setOpen(true);
  }

  // Esc closes (desktop / keyboard).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

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
        <div
          className="lightbox"
          onPointerDown={() => {
            pressedInside.current = true;
          }}
          onClick={() => {
            if (!pressedInside.current) return; // ignore click-through from the opening tap
            pressedInside.current = false;
            setOpen(false);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" />
        </div>
      )}
    </>
  );
}
