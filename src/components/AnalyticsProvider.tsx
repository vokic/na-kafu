'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initAnalytics, capturePageview } from '@/lib/analytics';

// Initializes PostHog once (no-op if no key) and captures a $pageview on first load and on every
// route change → daily visits + unique visitors. usePathname needs no Suspense boundary. Renders nothing.
export default function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    capturePageview();
  }, [pathname]);

  return null;
}
