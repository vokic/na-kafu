// Share/manage URL construction. Server-returned in the BE phase.

export function appBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_BASE_URL;
  if (env) return env.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:3000';
}

export function buildShareUrl(inviteToken: string): string {
  return `${appBaseUrl()}/p/${inviteToken}`;
}

export function buildManageUrl(manageToken: string): string {
  return `${appBaseUrl()}/m/${manageToken}`;
}
