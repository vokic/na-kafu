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
  openRate: number | null; // opens / (sends - cancelled) — cancelled links can't be opened
  acceptRate: number | null; // accepted / (accepted + declined)
  respondRate: number | null; // (accepted + declined) / opens
}

export interface ModeStat {
  mode: 'direct' | 'friend';
  sends: number;
  accepted: number;
  declined: number;
  acceptRate: number | null;
}

export interface DayRow {
  date: string; // YYYY-MM-DD (Europe/Belgrade)
  sends: number;
  opens: number;
}

export interface ReasonStat {
  reason: string;
  count: number;
}

export interface FeedbackItem {
  value: 'up' | 'down';
  comment: string | null;
  context: string | null;
  created_at: string;
}

export interface Feedback {
  up: number;
  down: number;
  recent: FeedbackItem[]; // latest comments (most recent first)
}

export interface Stats {
  generatedAt: string;
  today: Totals;
  last7: Totals;
  last30: Totals;
  byMode: ModeStat[];
  days: DayRow[]; // last 30 Belgrade-local days, newest first
  declineReasons: ReasonStat[]; // last 30 days, most common first
  avgTimeToOpenMin: number | null; // created → opened
  avgTimeToRespondMin: number | null; // opened → responded
  feedback: Feedback;
}

type Row = {
  created_at: string;
  opened_at: string | null;
  responded_at: string | null;
  status: string;
  mode: string;
};

const DAY_MS = 86_400_000;

// YYYY-MM-DD in Europe/Belgrade (product is Serbia-only; UTC bucketing rolled "Danas" over
// at 01:00–02:00 local). en-CA gives ISO-style YYYY-MM-DD directly.
const bgFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Belgrade',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const ymd = (iso: string) => bgFormatter.format(new Date(iso));

function totals(rows: Row[]): Totals {
  const sends = rows.length;
  const opens = rows.filter((r) => r.opened_at || r.status === 'accepted' || r.status === 'declined').length;
  const accepted = rows.filter((r) => r.status === 'accepted').length;
  const declined = rows.filter((r) => r.status === 'declined').length;
  const cancelled = rows.filter((r) => r.status === 'cancelled').length;
  const responded = accepted + declined;
  const openable = sends - cancelled;
  return {
    sends,
    opens,
    accepted,
    declined,
    cancelled,
    openRate: openable > 0 ? opens / openable : null,
    acceptRate: responded ? accepted / responded : null,
    respondRate: opens ? responded / opens : null,
  };
}

function avgMinutes(pairs: Array<[string | null, string | null]>): number | null {
  const deltas = pairs
    .filter((p): p is [string, string] => !!p[0] && !!p[1])
    .map(([a, b]) => new Date(b).getTime() - new Date(a).getTime())
    .filter((ms) => ms >= 0);
  if (!deltas.length) return null;
  const avgMs = deltas.reduce((s, x) => s + x, 0) / deltas.length;
  return Math.round(avgMs / 60_000);
}

export async function getStats(): Promise<Stats> {
  const sb = supabaseAdmin();
  const since = new Date(Date.now() - 90 * DAY_MS).toISOString();
  const { data, error } = await sb
    .from('invites')
    .select('id, created_at, opened_at, responded_at, status, mode')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10000);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<Row & { id: string }>;

  const now = Date.now();
  const within = (r: Row, days: number) => now - new Date(r.created_at).getTime() <= days * DAY_MS;

  const todayKey = ymd(new Date().toISOString());
  const todayRows = rows.filter((r) => ymd(r.created_at) === todayKey);

  // per-day buckets (last 30 Belgrade-local days)
  const sendsByDay = new Map<string, number>();
  const opensByDay = new Map<string, number>();
  for (const r of rows) {
    sendsByDay.set(ymd(r.created_at), (sendsByDay.get(ymd(r.created_at)) ?? 0) + 1);
    if (r.opened_at) opensByDay.set(ymd(r.opened_at), (opensByDay.get(ymd(r.opened_at)) ?? 0) + 1);
  }
  const days: DayRow[] = [];
  for (let i = 0; i < 30; i++) {
    const key = ymd(new Date(now - i * DAY_MS).toISOString());
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

  // Decline-reason breakdown (last 30 days). Join responses for the declined invites.
  const declinedIds = last30Rows.filter((r) => r.status === 'declined').map((r) => r.id);
  let declineReasons: ReasonStat[] = [];
  if (declinedIds.length) {
    const { data: resp } = await sb.from('responses').select('reason').in('invite_id', declinedIds).limit(10000);
    const counts = new Map<string, number>();
    for (const row of (resp ?? []) as { reason: string | null }[]) {
      const reason = row.reason?.trim();
      if (reason) counts.set(reason, (counts.get(reason) ?? 0) + 1);
    }
    declineReasons = [...counts.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
  }

  const avgTimeToOpenMin = avgMinutes(last30Rows.map((r) => [r.created_at, r.opened_at]));
  const avgTimeToRespondMin = avgMinutes(last30Rows.map((r) => [r.opened_at, r.responded_at]));

  // Feedback (otherwise write-only): tallies + the latest comments.
  const { data: fb } = await sb
    .from('feedback')
    .select('value, comment, context, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  const fbRows = (fb ?? []) as FeedbackItem[];
  const feedback: Feedback = {
    up: fbRows.filter((f) => f.value === 'up').length,
    down: fbRows.filter((f) => f.value === 'down').length,
    recent: fbRows.filter((f) => f.comment).slice(0, 30),
  };

  return {
    generatedAt: new Date().toISOString(),
    today: totals(todayRows),
    last7: totals(rows.filter((r) => within(r, 7))),
    last30: totals(last30Rows),
    byMode,
    days,
    declineReasons,
    avgTimeToOpenMin,
    avgTimeToRespondMin,
    feedback,
  };
}
