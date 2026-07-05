// Supabase storage serves the invite photos — the only cross-origin asset we load.
// SUPABASE_URL is present at build time on Netlify; the wildcard is a safe fallback.
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.SUPABASE_URL ?? '').origin;
  } catch {
    return 'https://*.supabase.co';
  }
})();

const dev = process.env.NODE_ENV === 'development';

// Pragmatic CSP (no nonce infra): Next.js needs inline script/style; PostHog is
// same-origin via the /ingest rewrite; fonts are self-hosted via next/font.
// data:/blob: in img-src cover the client-side photo preview before upload.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  "font-src 'self'",
  `connect-src 'self'${dev ? ' ws:' : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PostHog reverse proxy (EU): analytics goes through our own /ingest path → first-party,
  // so ad-blockers don't drop it. posthog-js api_host is set to "/ingest".
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: '/ingest/static/:path*', destination: 'https://eu-assets.i.posthog.com/static/:path*' },
      { source: '/ingest/:path*', destination: 'https://eu.i.posthog.com/:path*' },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Secret tokens live in URL paths (/p/:token, /m/:token) — never send the full
          // URL as referrer to other origins.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
};

export default nextConfig;
