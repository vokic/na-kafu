'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneShell from '@/components/PhoneShell';
import BrandAside from '@/components/BrandAside';
import InfoScreen from '@/components/InfoScreen';
import LoadingScreen from '@/components/LoadingScreen';
import { CheckIcon, EnvelopeIcon, RainIcon } from '@/components/hearts';
import { useTheme } from '@/state/ThemeProvider';
import { store } from '@/lib/data';
import { track } from '@/lib/analytics';
import { SR } from '@/lib/i18n';
import { buildShareUrl } from '@/lib/data/urls';
import type { ManageView as ManageData } from '@/lib/types';

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function ManageView({ token }: { token: string }) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [data, setData] = useState<ManageData | null>(null);
  const [state, setState] = useState<'loading' | 'notfound' | 'ready'>('loading');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    store
      .getManage(token)
      .then((d) => {
        if (!active) return;
        setData(d);
        setTheme(d.invite.theme);
        track('manage_viewed', { status: d.invite.status });
        setState('ready');
      })
      .catch(() => {
        if (active) setState('notfound');
      });
    return () => {
      active = false;
    };
  }, [token, setTheme]);

  // Arriving from the email's "Otkaži poziv" link (?cancel=1) → open the confirm directly.
  useEffect(() => {
    if (state !== 'ready' || !data) return;
    const wants = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('cancel') === '1';
    if (wants && (data.invite.status === 'pending' || data.invite.status === 'opened')) setConfirm(true);
  }, [state, data]);

  async function doCancel() {
    setBusy(true);
    try {
      await store.cancelInvite(token);
      track('invite_cancelled', { from: 'manage' });
      setData((d) => (d ? { ...d, invite: { ...d.invite, status: 'cancelled' } } : d));
    } catch {
      // e.g. ALREADY_RESPONDED — refetch so the view reflects the real state.
      try {
        setData(await store.getManage(token));
      } catch {
        /* ignore */
      }
    } finally {
      setConfirm(false);
      setBusy(false);
    }
  }

  if (state === 'loading') {
    return (
      <PhoneShell showThemeSwitcher={false} aside={<BrandAside icon={<EnvelopeIcon size={82} />} caption={SR.aside.loading} />}>
        <LoadingScreen />
      </PhoneShell>
    );
  }
  if (state === 'notfound' || !data) {
    return (
      <PhoneShell showThemeSwitcher={false} aside={<BrandAside icon={<EnvelopeIcon size={82} />} caption={SR.aside.gone} />}>
        <InfoScreen
          title={SR.notFound.title}
          sub={SR.notFound.sub}
          cta={{ label: SR.notFound.cta, onClick: () => router.push('/') }}
        />
      </PhoneShell>
    );
  }

  const { invite, response, events } = data;
  const friend = invite.mode === 'friend';
  const accepted = response?.decision === 'accepted';
  const declined = response?.decision === 'declined';
  const isCancelled = invite.status === 'cancelled';
  const cancellable = invite.status === 'pending' || invite.status === 'opened';
  const statusLabel = SR.manage.statusLabels[invite.status] ?? invite.status;
  const shareDisplay = buildShareUrl(invite.invite_token).replace(/^https?:\/\//, '');

  const manageAside = accepted ? (
    <BrandAside icon={<CheckIcon size={78} />} caption={SR.aside.manage} />
  ) : declined ? (
    <BrandAside icon={<RainIcon size={78} />} caption={SR.aside.manage} calm />
  ) : (
    <BrandAside icon={<EnvelopeIcon size={82} />} caption={SR.aside.manage} />
  );

  return (
    <PhoneShell showThemeSwitcher={false} aside={manageAside}>
      <section className="screen on">
        <h1 className="sm" style={{ marginBottom: 6 }}>
          {SR.manage.heading.l1}
          <br />
          <span className="offset">{SR.manage.heading.l2}</span>
        </h1>

        <div className="stagger" style={{ overflowY: 'auto', margin: '0 -22px', padding: '10px 22px 0' }}>
          <div className="smwrap-c" style={{ marginBottom: 6 }}>
            {accepted ? (
              <div className="smoosh sm">
                <CheckIcon size={46} />
              </div>
            ) : declined ? (
              <div className="smoosh sm calm">
                <RainIcon size={46} />
              </div>
            ) : (
              <div className="smoosh sm">
                <EnvelopeIcon size={42} />
              </div>
            )}
          </div>

          <p className="lead" style={{ marginTop: 6, textAlign: 'center' }}>
            {SR.manage.forWhom} <b style={{ color: 'var(--fg)' }}>{invite.recipient_name}</b>
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
            <span className="pill">{statusLabel}</span>
          </div>

          {response ? (
            <div className="result-card" style={{ marginTop: 16 }}>
              {accepted ? (
                <>
                  <div className="k">{SR.result.labels.place}</div>
                  <div className="v">{response.place}</div>
                  {response.contact_value && (
                    <>
                      <div className="k" style={{ marginTop: 16 }}>
                        {response.contact_type}
                      </div>
                      <div className="v contact">{response.contact_value}</div>
                    </>
                  )}
                  {response.reply_note && (
                    <>
                      <div className="k" style={{ marginTop: 16 }}>
                        {SR.result.labels.herMessage}
                      </div>
                      <div className="v" style={{ fontWeight: 500, fontSize: 15 }}>{`“${response.reply_note}”`}</div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="k">{SR.result.labels.reason}</div>
                  <div className="v">{response.reason}</div>
                  {response.reason_note && (
                    <>
                      <div className="k" style={{ marginTop: 16 }}>
                        {SR.result.labels.note}
                      </div>
                      <div className="v" style={{ fontWeight: 500, fontSize: 15 }}>{`“${response.reason_note}”`}</div>
                    </>
                  )}
                </>
              )}
            </div>
          ) : isCancelled ? (
            <div className="result-card" style={{ marginTop: 16, textAlign: 'center' }}>
              <div className="v" style={{ fontSize: 16 }}>
                {SR.manage.cancelledTitle}
              </div>
              <div className="k" style={{ marginTop: 8, textTransform: 'none', letterSpacing: 0 }}>
                {SR.manage.cancelledSub}
              </div>
            </div>
          ) : (
            <div className="result-card" style={{ marginTop: 16, textAlign: 'center' }}>
              <div className="v" style={{ fontSize: 16 }}>
                {SR.manage.waiting}
              </div>
              <div className="k" style={{ marginTop: 8, textTransform: 'none', letterSpacing: 0 }}>
                {SR.manage.waitingSub}
              </div>
            </div>
          )}

          {accepted && friend && !response?.contact_value && (
            <div className="note" style={{ display: 'block' }}>
              {SR.result.friendRevealedNoContact}
            </div>
          )}
          {declined && friend && (
            <div className="note" style={{ display: 'block' }}>
              {SR.result.friendHidden}
            </div>
          )}

          <label className="label" style={{ marginTop: 20 }}>
            {SR.manage.timeline}
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.map((ev) => (
              <div
                key={ev.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600 }}
              >
                <span>{SR.events[ev.type] ?? ev.type}</span>
                <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 12, whiteSpace: 'nowrap' }}>
                  {fmtTime(ev.created_at)}
                </span>
              </div>
            ))}
          </div>

          <label className="label" style={{ marginTop: 20 }}>
            {SR.manage.yourLink}
          </label>
          <div className="link-box">
            <span>{shareDisplay}</span>
            <button
              className="copy"
              onClick={() => {
                navigator.clipboard?.writeText(buildShareUrl(invite.invite_token)).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
            >
              {copied ? SR.sent.copied : SR.sent.copy}
            </button>
          </div>
        </div>

        <div className="btn-row">
          {confirm ? (
            <>
              <div className="cancel-confirm">{SR.manage.cancelConfirm}</div>
              <button className="btn btn-primary btn-danger" disabled={busy} onClick={doCancel}>
                {busy ? <span className="spinner" /> : SR.manage.cancelYes}
              </button>
              <button className="btn btn-ghost" disabled={busy} onClick={() => setConfirm(false)}>
                {SR.manage.cancelNo}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => router.push('/')}>
                {SR.result.newInvite}
              </button>
              {cancellable && (
                <button className="btn btn-ghost danger" onClick={() => setConfirm(true)}>
                  {SR.manage.cancel}
                </button>
              )}
            </>
          )}
        </div>
      </section>
    </PhoneShell>
  );
}
