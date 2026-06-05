'use client';

import { useEffect, useRef, useState } from 'react';
import { EnvelopeIcon } from '@/components/hearts';
import { SR } from '@/lib/i18n';

// Easter egg: 20 taps on the home heart → random bubble (no immediate repeat). KEPT in prod.
export default function HomeScreen({ onStart }: { onStart: () => void }) {
  const heartRef = useRef<HTMLDivElement>(null);
  const tapsRef = useRef(0);
  const lastEggRef = useRef(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [eggText, setEggText] = useState<string>(SR.eggs[0]);
  const [eggShow, setEggShow] = useState(false);
  const [accentIdx, setAccentIdx] = useState(0);

  // Rotate the accent line through SR.home.accents with a fade.
  useEffect(() => {
    const id = setInterval(() => setAccentIdx((i) => (i + 1) % SR.home.accents.length), 2400);
    return () => clearInterval(id);
  }, []);

  function tapHeart() {
    tapsRef.current += 1;
    heartRef.current?.animate(
      [{ transform: 'scale(.84)' }, { transform: 'scale(1)' }],
      { duration: 230, easing: 'cubic-bezier(.2,1.6,.4,1)' },
    );
    if (tapsRef.current >= 20) {
      let i = 0;
      do {
        i = Math.floor(Math.random() * SR.eggs.length);
      } while (i === lastEggRef.current && SR.eggs.length > 1);
      lastEggRef.current = i;
      setEggText(SR.eggs[i]);
      setEggShow(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setEggShow(true)));
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setEggShow(false), 2800);
      tapsRef.current = 0;
    }
  }

  return (
    <section className="screen on">
      <div className="stagger" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="smwrap-c" style={{ marginBottom: 30 }}>
          <div className={`egg${eggShow ? ' show' : ''}`}>{eggText}</div>
          <div className="smoosh" id="homeHeart" ref={heartRef} onClick={tapHeart}>
            <EnvelopeIcon size={62} />
          </div>
        </div>
        <h1>
          Pozovi
          <br />
          nekoga,
          <br />
          <span className="offset" key={accentIdx} style={{ animation: 'rise .5s cubic-bezier(.22,1,.32,1)' }}>
            {SR.home.accents[accentIdx]}
          </span>
        </h1>
        <p className="lead" style={{ maxWidth: '30ch' }}>
          {SR.home.sub}
        </p>
      </div>
      <div className="btn-row">
        <button className="btn btn-primary" onClick={onStart}>
          {SR.home.cta}
        </button>
      </div>
    </section>
  );
}
