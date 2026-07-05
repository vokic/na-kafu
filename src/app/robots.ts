import type { MetadataRoute } from 'next';

// NOTE: /p/ is deliberately NOT disallowed — WhatsApp/Instagram/Facebook link-preview
// bots (facebookexternalhit) respect robots.txt, and blocking /p/ would kill the OG
// unfurl that drives sharing. /p pages carry a noindex meta instead (see p/[token]).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/m/', '/stats/', '/sent', '/api/', '/ingest/'] }],
  };
}
