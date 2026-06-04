// Inline SVG icons used inside the heart "smoosh", ported verbatim (camelCased).

export function EnvelopeIcon({ size = 62 }: { size?: number }) {
  // Solid envelope with the V fold cut OUT (transparent) via evenodd, so the background
  // shows through the V on every theme — opaque shows the heart colour (= the reference
  // image), glass shows the frosted background through the cut.
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 16h44a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4Z M8 18 L32 33 L56 18 L56 22 L32 37 L8 22 Z"
      />
    </svg>
  );
}

export function PlaneIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="currentColor">
      <path d="M58 6 6 28l18 6 4 22 9-14 14 4z" />
    </svg>
  );
}

export function CheckIcon({ size = 58 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 34l11 11 23-25" />
    </svg>
  );
}

export function RainIcon({ size = 58 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 56) / 58} viewBox="0 0 64 62" fill="currentColor">
      <path d="M20 36a14 14 0 0 1 1-28 16 16 0 0 1 31 5 12 12 0 0 1-3 23H20z" />
      <circle cx="24" cy="52" r="3" />
      <circle cx="38" cy="56" r="3" />
      <circle cx="50" cy="50" r="3" />
    </svg>
  );
}
