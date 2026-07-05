import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStats, type Totals } from '@/lib/server/stats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'na kafu? — stats',
  robots: { index: false, follow: false },
};

const pct = (n: number | null) => (n == null ? '—' : `${Math.round(n * 100)}%`);

const C = {
  // position:fixed + own scroll so the global `body{overflow:hidden}` (phone-app desktop rule) doesn't
  // clip this page — the 30-day table scrolls within the viewport.
  page: { position: 'fixed', inset: 0, overflowY: 'auto', background: '#0D0419', color: '#FAF5EB', fontFamily: 'system-ui, sans-serif', padding: '32px 20px' } as const,
  wrap: { maxWidth: 880, margin: '0 auto' } as const,
  h1: { fontSize: 24, fontWeight: 800, margin: '0 0 4px' } as const,
  muted: { color: 'rgba(250,245,235,.55)', fontSize: 13 } as const,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '20px 0' } as const,
  card: { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, padding: '16px 18px' } as const,
  cardLabel: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'rgba(250,245,235,.55)' } as const,
  row: { display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' } as const,
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14, marginTop: 10 } as const,
  th: { textAlign: 'left', padding: '8px 10px', color: 'rgba(250,245,235,.55)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,.12)' } as const,
  td: { padding: '7px 10px', borderBottom: '1px solid rgba(255,255,255,.06)' } as const,
  section: { marginTop: 28 } as const,
  sectionTitle: { fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'rgba(250,245,235,.7)', margin: '0 0 8px' } as const,
};

function Card({ title, t }: { title: string; t: Totals }) {
  return (
    <div style={C.card}>
      <div style={C.cardLabel}>{title}</div>
      <div style={{ ...C.row, marginTop: 8 }}><span>Poslato</span><b>{t.sends}</b></div>
      <div style={C.row}><span>Otvoreno</span><b>{t.opens}</b></div>
      <div style={C.row}><span>Prihvaćeno</span><b style={{ color: '#7CFFD8' }}>{t.accepted}</b></div>
      <div style={C.row}><span>Odbijeno</span><b>{t.declined}</b></div>
      <div style={C.row}><span>Otkazano</span><b>{t.cancelled}</b></div>
      <div style={{ ...C.row, borderTop: '1px solid rgba(255,255,255,.12)', marginTop: 6, paddingTop: 8 }}>
        <span>Open rate</span><b>{pct(t.openRate)}</b>
      </div>
      <div style={C.row}><span>Respond rate</span><b>{pct(t.respondRate)}</b></div>
      <div style={C.row}><span>Accept rate</span><b>{pct(t.acceptRate)}</b></div>
    </div>
  );
}

const fmtDur = (min: number | null) => {
  if (min == null) return '—';
  if (min < 60) return `${min} min`;
  if (min < 1440) return `${Math.round(min / 60)} h`;
  return `${Math.round(min / 1440)} d`;
};

export default async function StatsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!process.env.STATS_TOKEN || token !== process.env.STATS_TOKEN) notFound();

  let body: React.ReactNode;
  try {
    const s = await getStats();
    body = (
      <>
        <div style={C.grid}>
          <Card title="Danas" t={s.today} />
          <Card title="7 dana" t={s.last7} />
          <Card title="30 dana" t={s.last30} />
        </div>

        <div style={C.section}>
          <h2 style={C.sectionTitle}>Accept rate po modu (30 dana)</h2>
          <table style={C.table}>
            <thead>
              <tr><th style={C.th}>Mod</th><th style={C.th}>Poslato</th><th style={C.th}>Prihvaćeno</th><th style={C.th}>Odbijeno</th><th style={C.th}>Accept rate</th></tr>
            </thead>
            <tbody>
              {s.byMode.map((m) => (
                <tr key={m.mode}>
                  <td style={C.td}>{m.mode === 'direct' ? 'Direktno' : 'Preko druga'}</td>
                  <td style={C.td}>{m.sends}</td>
                  <td style={C.td}>{m.accepted}</td>
                  <td style={C.td}>{m.declined}</td>
                  <td style={C.td}><b>{pct(m.acceptRate)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={C.section}>
          <h2 style={C.sectionTitle}>Vreme do akcije (30 dana)</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ ...C.card, flex: 1 }}>
              <div style={C.cardLabel}>Poslato → otvoreno</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{fmtDur(s.avgTimeToOpenMin)}</div>
            </div>
            <div style={{ ...C.card, flex: 1 }}>
              <div style={C.cardLabel}>Otvoreno → odgovor</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{fmtDur(s.avgTimeToRespondMin)}</div>
            </div>
          </div>
        </div>

        {s.declineReasons.length > 0 && (
          <div style={C.section}>
            <h2 style={C.sectionTitle}>Razlozi odbijanja (30 dana)</h2>
            <table style={C.table}>
              <tbody>
                {s.declineReasons.map((r) => (
                  <tr key={r.reason}>
                    <td style={C.td}>{r.reason}</td>
                    <td style={{ ...C.td, textAlign: 'right', width: 60 }}><b>{r.count}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={C.section}>
          <h2 style={C.sectionTitle}>Ocene aplikacije</h2>
          <div style={{ display: 'flex', gap: 20, fontSize: 15, marginBottom: 10 }}>
            <span>👍 <b>{s.feedback.up}</b></span>
            <span>👎 <b>{s.feedback.down}</b></span>
          </div>
          {s.feedback.recent.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {s.feedback.recent.map((f, i) => (
                <div key={i} style={C.card}>
                  <div style={{ fontSize: 14 }}>
                    {f.value === 'up' ? '👍' : '👎'} {f.comment}
                  </div>
                  <div style={{ ...C.muted, marginTop: 4 }}>
                    {f.context ?? '—'} · {new Date(f.created_at).toLocaleString('sr-RS')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={C.muted}>Još nema komentara.</p>
          )}
        </div>

        <div style={C.section}>
          <h2 style={C.sectionTitle}>Po danu (30 dana)</h2>
          <table style={C.table}>
            <thead>
              <tr><th style={C.th}>Datum</th><th style={C.th}>Poslato</th><th style={C.th}>Otvoreno</th></tr>
            </thead>
            <tbody>
              {s.days.map((d) => (
                <tr key={d.date}>
                  <td style={C.td}>{d.date}</td>
                  <td style={C.td}>{d.sends}</td>
                  <td style={C.td}>{d.opens}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ ...C.muted, marginTop: 24 }}>
          Generisano: {new Date(s.generatedAt).toLocaleString('sr-RS')} · datumi su po vremenu u Srbiji
          (Europe/Belgrade). Posete naslovne strane (landing) prati PostHog ($pageview); ovde je tok od
          kreiranja: poslato → otvoreno → odgovor.
        </p>
      </>
    );
  } catch (e) {
    console.error('[stats] failed to load', e);
    body = <p style={C.muted}>Greška pri čitanju statistike. Detalji su u server logu.</p>;
  }

  return (
    <main style={C.page}>
      <div style={C.wrap}>
        <h1 style={C.h1}>na kafu? — statistika</h1>
        <div style={C.muted}>Privatno · ne indeksira se</div>
        {body}
      </div>
    </main>
  );
}
