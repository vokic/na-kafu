export { SR } from './sr';
export { COPY } from './copy';

/** Replace `{key}` placeholders in a string with values from `vars`. */
export function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}
