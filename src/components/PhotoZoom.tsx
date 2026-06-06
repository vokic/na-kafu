'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { track } from '@/lib/analytics';

// Avatar (circle, via background-image) that opens a full-screen zoom on click/tap.
//
// The "opens then instantly closes" bug had two possible causes; this guards against both:
//  1. Touch ghost click — a tap dispatches compatibility mouse/click events that land on the
//     freshly-rendered lightbox. Fixed by preventDefault() on `touchend` (native, { passive:false }
//     so it's honored): the browser then generates NO compatibility events for that tap.
//  2. Same-gesture echo on desktop — any stray event from the SAME interaction that opened the
//     lightbox. Fixed by arming the backdrop only AFTER a real paint frame (rAF×2): a close is
//     ignored until then, so nothing from the opening gesture can dismiss it.
// A dev-only warning fires if the parent remounts us while open (the only remaining way it could
// "close" — would point at a parent re-render/key change instead of an event).
export default function PhotoZoom({ url, className }: { url: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const armedRef = useRef(false);
  const openRef = useRef(false);
  openRef.current = open;

  const doOpen = useCallback(() => {
    armedRef.current = false;
    track('photo_zoomed');
    setOpen(true);
  }, []);
  const doClose = useCallback(() => setOpen(false), []);

  // Diagnostic: if we unmount while still open, the parent remounted us (≠ an event close).
  useEffect(
    () => () => {
      if (openRef.current && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[PhotoZoom] unmounted while open — parent is remounting this component.');
      }
    },
    [],
  );

  // Avatar: native non-passive touchend so preventDefault reliably cancels the ghost click.
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

  // While open: arm the backdrop only after a painted frame; wire touch-close + Esc.
  useEffect(() => {
    if (!open) return;
    const el = lightboxRef.current;
    let r1 = 0;
    let r2 = 0;
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        armedRef.current = true;
      });
    });
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (armedRef.current) doClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') doClose();
    };
    el?.addEventListener('touchend', onTouchEnd, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
      el?.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
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
        // Mouse / pen (on touch, touchend already opened + cancelled the ghost click).
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
      {open && (
        <div
          ref={lightboxRef}
          className="lightbox"
          onClick={(e) => {
            e.stopPropagation();
            if (armedRef.current) doClose();
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" />
        </div>
      )}
    </>
  );
}
