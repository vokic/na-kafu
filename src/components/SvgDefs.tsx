// Document-global SVG defs referenced from CSS/markup. Mounted exactly once per
// page inside PhoneShell. Attributes are JSX-camelCased; otherwise verbatim from
// the prototype (#heartclip, #liquid, #liquid2 — incl. the SMIL <animate> children).

export default function SvgDefs() {
  return (
    <>
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="heartclip" clipPathUnits="objectBoundingBox">
            <path d="M0.5,0.97 C0.18,0.72 0,0.46 0,0.28 C0,0.1 0.14,0 0.28,0 C0.4,0 0.47,0.07 0.5,0.17 C0.53,0.07 0.6,0 0.72,0 C0.86,0 1,0.1 1,0.28 C1,0.46 0.82,0.72 0.5,0.97 Z" />
          </clipPath>
        </defs>
      </svg>

      <svg width="0" height="0" style={{ position: 'absolute' }}>
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

      <svg width="0" height="0" style={{ position: 'absolute' }}>
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
    </>
  );
}
