import type { Mode } from '@/lib/types';

// The sender's in-progress invite (theme is taken from ThemeProvider at submit time).
export interface Draft {
  mode: Mode;
  to: string;
  msg: string;
  from: string;
  email: string;
  about: string;
  photo: string; // base64 data URL (FE phase) → upload URL later
  places: string[];
}

export const EMPTY_DRAFT: Draft = {
  mode: 'direct',
  to: '',
  msg: '',
  from: '',
  email: '',
  about: '',
  photo: '',
  places: [],
};

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
