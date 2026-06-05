'use client';

import { useEffect } from 'react';
import { initAnalytics } from '@/lib/analytics';

// Initializes PostHog once on mount (no-op if no key). Renders nothing.
export default function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
}
