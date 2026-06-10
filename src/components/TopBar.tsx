'use client';

import { useTheme } from '@/state/ThemeProvider';
import { SR } from '@/lib/i18n';
import { track } from '@/lib/analytics';
import { THEMES } from '@/lib/types';

export default function TopBar({
  showThemeSwitcher = true,
  right = null,
}: {
  showThemeSwitcher?: boolean;
  right?: React.ReactNode;
}) {
  const { theme, setTheme } = useTheme();
  return (
    <div className="topbar">
      <div className="brand">{SR.brand}</div>
      <div className="tbright">
        {showThemeSwitcher && (
          <div className="themesw">
            {THEMES.map((t) => (
              <button
                key={t}
                type="button"
                className={`sw ${t}${theme === t ? ' on' : ''}`}
                data-theme={t}
                aria-label={SR.build.themeNames[t]}
                aria-pressed={theme === t}
                onClick={() => {
                  track('theme_changed', { theme: t, where: 'topbar' });
                  setTheme(t);
                }}
              />
            ))}
          </div>
        )}
        {right}
      </div>
    </div>
  );
}
