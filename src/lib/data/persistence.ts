// Low-level localStorage helpers (SSR-safe) + key scheme.
// Retired in the BE phase (Postgres takes over).

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readJSON<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore in FE phase */
  }
}

export const KEYS = {
  invite: (t: string) => `nakafu:invite:${t}`,
  manage: (t: string) => `nakafu:manage:${t}`,
  response: (t: string) => `nakafu:response:${t}`,
  events: (t: string) => `nakafu:events:${t}`,
  index: 'nakafu:index',
  last: 'nakafu:last',
};
