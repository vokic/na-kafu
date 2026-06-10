// Document-global SVG filter defs for the animated glass themes. Mounted inside PhoneShell.
// Only rendered for the theme that actually references them (#liquid → holo, #liquid2 →
// aurora) so the indefinite SMIL <animate> children don't run on the 5 static themes.
// #heartclip from the prototype is dropped — the app uses a CSS mask instead (globals.css).
import type { ThemeName } from '@/lib/types';

export default function SvgDefs({ theme }: { theme: ThemeName }) {
  if (theme === 'holo') {
    return (
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="liquid">
            <feTurbulence type="fractalNoise" baseFrequency="0.004 0.007" numOctaves={2} seed={6} result="n">
              <animate
                attributeName="baseFrequency"
                dur="20s"
                values="0.004 0.007;0.011 0.015;0.006 0.01;0.004 0.007"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="n" scale={140} xChannelSelector="R" yChannelSelector="G">
              <animate attributeName="scale" dur="15s" values="100;200;140;100" repeatCount="indefinite" />
            </feDisplacementMap>
          </filter>
        </defs>
      </svg>
    );
  }

  if (theme === 'aurora') {
    return (
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="liquid2">
            <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves={2} seed={4} result="n">
              <animate
                attributeName="baseFrequency"
                dur="26s"
                values="0.006 0.009;0.011 0.014;0.006 0.009"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="n" scale={110} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    );
  }

  return null;
}
