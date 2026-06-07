'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { track } from '@/lib/analytics';

// Avatar opens a full-screen zoom (portaled to <body> so no ancestor — .phone overflow:hidden,
// .card backdrop-filter, transformed .screen — can clip a position:fixed overlay).
// Mobile best-practice: the modal closes ONLY via the ✕ button or Esc. Tapping the image/backdrop
// does nothing, so a tap meant to look closer never dismisses it. Touch handlers preventDefault to
// cancel the compatibility "ghost click".
export default function PhotoZoom({ url, className }: { url: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement | null>(null);

  const doOpen = useCallback(() => {
    track('photo_zoomed');
    setOpen(true);
  }, []);
  const doClose = useCallback(() => setOpen(false), []);

  // Avatar: native non-passive touchend → preventDefault cancels the ghost click so open is clean.
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

  // Esc closes (desktop / keyboard).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') doClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, doClose]);

  return (
    <>
      <div
        ref={avatarRef}
        className={className}
        style={{ backgroundImage: `url("${url}")`, cursor: 'zoom-in', position: 'relative' }}
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
      >
        <span className="zoom-badge" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
        </span>
      </div>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          // Tapping the image/backdrop does NOTHING — close only via ✕ or Esc.
          <div className="lightbox">
            <button
              type="button"
              className="lightbox-close"
              aria-label="Zatvori"
              onClick={doClose}
              onTouchEnd={(e) => {
                e.preventDefault();
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
