'use client';

import type { ReactNode } from 'react';
import { useTheme } from '@/state/ThemeProvider';
import { SR } from '@/lib/i18n';

// Desktop-only left pane (hidden < 900px via CSS). Brand wordmark + the step's heart visual
// + a one-line caption. data-theme mirrors the phone so the heart picks up the theme variables.
export default function BrandAside({
  icon,
  caption,
  calm = false,
}: {
  icon: ReactNode;
  caption: string;
  calm?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <aside className="brandpane" data-theme={theme} aria-hidden="true">
      <div className="brandpane-logo">{SR.brand}</div>
      <div className={`smoosh${calm ? ' calm' : ''}`}>{icon}</div>
      <p className="brandpane-caption">{caption}</p>
    </aside>
  );
}
