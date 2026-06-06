// Server-side stats from the authoritative Supabase `invites` table (service role).
// Powers the private /stats page. Sender landing visits are NOT here (those live in PostHog
// $pageview) — this is the funnel from creation onward: sends → opens → accept/decline.
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface Totals {
  sends: number;
  opens: number;
  accepted: number;
  declined: number;
  cancelled: number;
  openRate: number | null; // opens / sends
  acceptRate: number | null; // accepted / (accepted + declined)
}

export interface ModeStat {
  mode: 'direct' | 'friend';
  sends: number;
  accepted: number;
  declined: number;
  acceptRate: number | null;
}

export interface DayRow {
  date: string; // YYYY-MM-DD (UTC)
  sends: number;
  opens: number;
}

export interface Stats {
  generatedAt: string;
  today: Totals;
  last7: Totals;
  last30: Totals;
  byMode: ModeStat[];
  days: DayRow[]; // last 30 calendar days, newest first
}

type Row = { created_at: string; opened_at: string | null; status: string; mode: string };

const DAY_MS = 86_400_000;
const ymd = (iso: string) => iso.slice(0, 10);

function totals(rows: Row[]): Totals {
  const sends = rows.length;
  const opens = rows.filter((r) => r.opened_at || r.status === 'accepted' || r.status === 'declined').length;
  const accepted = rows.filter((r) => r.status === 'accepted').length;
  const declined = rows.filter((r) => r.status === 'declined').length;
  const cancelled = rows.filter((r) => r.status === 'cancelled').length;
  const responded = accepted + declined;
  return {
    sends,
    opens,
    accepted,
    declined,
    cancelled,
    openRate: sends ? opens / sends : null,
    acceptRate: responded ? accepted / responded : null,
  };
}

export async function getStats(): Promise<Stats> {
  const sb = supabaseAdmin();
  const since = new Date(Date.now() - 90 * DAY_MS).toISOString();
  const { data, error } = await sb
    .from('invites')
    .select('created_at, opened_at, status, mode')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10000);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Row[];

  const now = Date.now();
  const within = (r: Row, days: number) => now - new Date(r.created_at).getTime() <= days * DAY_MS;

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayRows = rows.filter((r) => ymd(r.created_at) === todayKey);

  // per-day buckets (last 30 calendar days)
  const sendsByDay = new Map<string, number>();
  const opensByDay = new Map<string, number>();
  for (const r of rows) {
    sendsByDay.set(ymd(r.created_at), (sendsByDay.get(ymd(r.created_at)) ?? 0) + 1);
    if (r.opened_at) opensByDay.set(ymd(r.opened_at), (opensByDay.get(ymd(r.opened_at)) ?? 0) + 1);
  }
  const base = new Date();
  base.setUTCHours(0, 0, 0, 0);
  const days: DayRow[] = [];
  for (let i = 0; i < 30; i++) {
    const key = new Date(base.getTime() - i * DAY_MS).toISOString().slice(0, 10);
    days.push({ date: key, sends: sendsByDay.get(key) ?? 0, opens: opensByDay.get(key) ?? 0 });
  }

  const last30Rows = rows.filter((r) => within(r, 30));
  const byMode: ModeStat[] = (['direct', 'friend'] as const).map((m) => {
    const mr = last30Rows.filter((r) => r.mode === m);
    const accepted = mr.filter((r) => r.status === 'accepted').length;
    const declined = mr.filter((r) => r.status === 'declined').length;
    const responded = accepted + declined;
    return { mode: m, sends: mr.length, accepted, declined, acceptRate: responded ? accepted / responded : null };
  });

  return {
    generatedAt: new Date().toISOString(),
    today: totals(todayRows),
    last7: totals(rows.filter((r) => within(r, 7))),
    last30: totals(last30Rows),
    byMode,
    days,
  };
}
