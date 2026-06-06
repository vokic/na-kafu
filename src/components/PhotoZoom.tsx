'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { track } from '@/lib/analytics';

// Avatar that opens a full-screen zoom. The lightbox is portaled to <body> so no ancestor
// (.phone overflow:hidden, .card backdrop-filter on glass themes, the transformed .screen) can
// clip/contain a position:fixed overlay. The backdrop is "armed" only AFTER a painted frame, so
// the same click/tap that opened it cannot immediately close it (the original instant-close echo).
// Touch uses a native preventDefault to cancel the compatibility ghost click; Esc + backdrop close.
export default function PhotoZoom({ url, className }: { url: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const armedRef = useRef(false);

  const doOpen = useCallback(() => {
    armedRef.current = false;
    track('photo_zoomed');
    setOpen(true);
  }, []);
  const doClose = useCallback(() => setOpen(false), []);

  // Avatar: native non-passive touchend → preventDefault cancels the compatibility ghost click.
  useEffect(() => {
    const el = avatarRef.current;
    if (!el) return;
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      doOpen();
    };
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => el.removeEventListener('touchend', onTouchEnd);
  }, [doOpen]);

  // While open: arm the backdrop only after a painted frame; wire Esc + touch-close.
  useEffect(() => {
    if (!open) return;
    let r1 = 0;
    let r2 = 0;
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        armedRef.current = true;
      });
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') doClose();
    };
    window.addEventListener('keydown', onKey);
    const el = lightboxRef.current;
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (armedRef.current) doClose();
    };
    el?.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
      window.removeEventListener('keydown', onKey);
      el?.removeEventListener('touchend', onTouchEnd);
    };
  }, [open, doClose]);

  return (
    <>
      <div
        ref={avatarRef}
        className={className}
        style={{ backgroundImage: `url("${url}")`, cursor: 'zoom-in' }}
        role="button"
        tabIndex={0}
        aria-label="Uvećaj sliku"
        onClick={(e) => {
          e.stopPropagation();
          doOpen();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            doOpen();
          }
        }}
      />
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={lightboxRef}
            className="lightbox"
            onClick={(e) => {
              e.stopPropagation();
              if (armedRef.current) doClose();
            }}
          >
            <button
              type="button"
              className="lightbox-close"
              aria-label="Zatvori"
              onClick={(e) => {
                e.stopPropagation();
                doClose();
              }}
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" />
          </div>,
          document.body,
        )}
    </>
  );
}
