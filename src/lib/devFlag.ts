// Dev-only tooling gate. The NODE_ENV check lets the bundler dead-code-eliminate
// dev tools from production builds. Override with NEXT_PUBLIC_DEV_TOOLS=1 if needed.
export const isDev =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEV_TOOLS === '1';
