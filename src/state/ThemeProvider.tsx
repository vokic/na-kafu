'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ThemeName } from '@/lib/types';

const THEME_COLORS: Record<ThemeName, string> = {
  light: '#FAF5EB',
  dark: '#0D0419',
  pink: '#FFB3C7',
  peach: '#FBE4DC',
  holo: '#0a0418',
  aurora: '#0a0418',
  indigo: '#1B2A6B',
};

const STORAGE_KEY = 'nakafu:ui-theme';

interface ThemeCtx {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export default function ThemeProvider({
  children,
  initialTheme = 'light',
  persist = false,
}: {
  children: React.ReactNode;
  initialTheme?: ThemeName;
  persist?: boolean;
}) {
  const [theme, setThemeState] = useState<ThemeName>(initialTheme);

  // Restore persisted UI theme post-mount (never during render → no hydration mismatch).
  useEffect(() => {
    if (!persist) return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeName | null;
      if (saved) setThemeState(saved);
    } catch {
      /* ignore */
    }
  }, [persist]);

  // Keep <meta name="theme-color"> in sync so the mobile browser bar tints to the theme.
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[theme] ?? THEME_COLORS.light);
  }, [theme]);

  const setTheme = useCallback(
    (t: ThemeName) => {
      setThemeState(t);
      if (persist) {
        try {
          window.localStorage.setItem(STORAGE_KEY, t);
        } catch {
          /* ignore */
        }
      }
    },
    [persist],
  );

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useTheme must be used within ThemeProvider');
  return c;
}
