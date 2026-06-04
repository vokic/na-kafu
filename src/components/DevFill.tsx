'use client';

// Dev-only "⚡" prefill button. Gated behind isDev in the sender flow, so it is
// dead-code-eliminated from production. Internal testing tool only.

import { SR } from '@/lib/i18n';
import type { Draft } from '@/screens/sender/draft';

const SAMPLE_PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF89B6"/><stop offset="1" stop-color="#F63E86"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/><text x="100" y="132" font-family="sans-serif" font-size="98" font-weight="800" fill="#fff" text-anchor="middle">M</text></svg>',
  );

export default function DevFill({ onFill }: { onFill: (d: Draft) => void }) {
  function fill() {
    onFill({
      mode: 'direct',
      to: 'Mila',
      msg: 'Video sam te na žurci kod Ane. Idemo na pravu kafu?',
      from: 'Marko @marko_ns',
      email: 'marko@mejl.com',
      about: '30, volim planinarenje, špageti i loš stand-up.',
      photo: SAMPLE_PHOTO,
      places: SR.places.slice(0, 3),
    });
  }
  return (
    <button className="fillbtn" onClick={fill} title="dev: popuni polja" type="button">
      ⚡
    </button>
  );
}
