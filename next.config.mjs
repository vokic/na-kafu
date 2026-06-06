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
};

export default nextConfig;
