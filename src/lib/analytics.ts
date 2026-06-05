'use client';

import posthog from 'posthog-js';

// Thin PostHog wrapper. No-op unless NEXT_PUBLIC_POSTHOG_KEY is set, so dev/local works without a key.
// PRIVACY: only pass metadata (enums, booleans, counts) — never email, message text, name, contact, photo.

let started = false;

export function initAnalytics(): void {
  if (started || typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
    capture_pageview: false, // we send explicit funnel events instead
    autocapture: false, // clean, intentional taxonomy only
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
  });
  // Super-properties on every event → filter by app + env even if this project is shared.
  posthog.register({ app: 'na-kafu', app_env: process.env.NODE_ENV });
  started = true;
}

export function track(event: string, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  if (!started) initAnalytics();
  if (!started) return;
  posthog.capture(event, props);
}
