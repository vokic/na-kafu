'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneShell from '@/components/PhoneShell';
import BrandAside from '@/components/BrandAside';
import { EnvelopeIcon, PlaneIcon, CheckIcon, RainIcon } from '@/components/hearts';
import InfoScreen from '@/components/InfoScreen';
import LoadingScreen from '@/components/LoadingScreen';
import ResultScreen, { type ResultRow } from '@/components/ResultScreen';
import AppRating from '@/components/AppRating';
import { useTheme } from '@/state/ThemeProvider';
import { store, StoreError } from '@/lib/data';
import { isDev } from '@/lib/devFlag';
import { track } from '@/lib/analytics';
import { SR } from '@/lib/i18n';
import type { RecipientView, RevealResult } from '@/lib/types';
import ReceiveScreen from './ReceiveScreen';
import RevealScreen from './RevealScreen';
import AcceptScreen, { type AcceptPayload } from './AcceptScreen';
import RejectScreen, { type RejectPayload } from './RejectScreen';

type Step = 'loading' | 'notfound' | 'expired' | 'closed' | 'receive' | 'reveal' | 'accept' | 'reject' | 'result';

interface Outcome {
  accepted: boolean;
  rows: ResultRow[];
}

export default function RecipientFlow({
  token,
  initialData = null,
  initialError = null,
}: {
  token: string;
  /** SSR-resolved invite (read-only fetch) — lets the card paint without a loading flash. */
  initialData?: RecipientView | null;
  initialError?: 'EXPIRED' | 'NOT_FOUND' | null;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [step, setStep] = useState<Step>(() =>
    initialData
      ? initialData.already_responded
        ? 'closed'
        : 'receive'
      : initialError === 'EXPIRED'
        ? 'expired'
        : initialError === 'NOT_FOUND'
          ? 'notfound'
          : 'loading',
  );
  const [view, setView] = useState<RecipientView | null>(initialData);
  const [reveal, setReveal] = useState<RevealResult | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fillSignal, setFillSignal] = useState(0); // ⚡ dev-fill trigger
  // Preview (?preview=1): sender viewing their own invite — read-only, no responding.
  const [preview] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1',
  );

  useEffect(() => {
    let active = true;
    store
      .getInvite(token, { preview })
      .then((v) => {
        if (!active) return;
        setView(v);
        setTheme(v.theme);
        if (!preview) track('invite_opened', { mode: v.mode, invite_token: token });
        setStep(v.already_responded ? 'closed' : 'receive');
      })
      .catch((err) => {
        if (!active) return;
        const code = err instanceof StoreError ? err.code : 'UNKNOWN';
        // SSR already rendered the invite: a transient client error (network, rate limit)
        // must not replace it with "not found" — only a definitive EXPIRED/NOT_FOUND does.
        if (initialData && code !== 'EXPIRED' && code !== 'NOT_FOUND') return;
        const expired = code === 'EXPIRED';
        track(expired ? 'invite_expired_viewed' : 'invite_notfound_viewed', { invite_token: token });
        setStep(expired ? 'expired' : 'notfound');
      });
    return () => {
      active = false;
    };
  }, [token, setTheme, preview, initialData]);

  // Mandatory response: warn if the recipient tries to leave before choosing yes/no.
  useEffect(() => {
    const mustAnswer = !preview && (step === 'receive' || step === 'reveal' || step === 'accept' || step === 'reject');
    if (!mustAnswer) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [step, preview]);

  // route a respond error to the right screen + track it
  function onRespondError(err: unknown) {
    const code = err instanceof StoreError ? err.code : 'UNKNOWN';
    track('respond_failed', { code, invite_token: token });
    if (code === 'EXPIRED') setStep('expired');
    else if (code === 'ALREADY_RESPONDED') setStep('closed');
    else {
      console.error(err);
      // INVALID / NOT_FOUND / CONFLICT / SERVER / network: stay on the screen, show inline error.
      setError(err instanceof StoreError ? err.message : SR.errors.generic);
    }
  }

  const startAccept = () => {
    track('accept_started', { invite_token: token });
    setError(null);
    setStep('accept');
  };
  const startReject = () => {
    track('reject_started', { invite_token: token });
    setError(null);
    setStep('reject');
  };

  async function goReveal() {
    setBusy(true);
    setError(null);
    try {
      const r = await store.reveal(token);
      track('reveal_clicked', { invite_token: token });
      setReveal(r);
      setStep('reveal');
    } catch (err) {
      onRespondError(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitAccept(p: AcceptPayload) {
    setBusy(true);
    setError(null);
    try {
      await store.respond(token, {
        decision: 'accepted',
        place: p.place,
        contact_type: p.contact_value ? p.contact_type : undefined,
        contact_value: p.contact_value || undefined,
        reply_note: p.reply_note || undefined,
      });
      track('invite_accepted', {
        mode: view?.mode,
        place: p.place,
        has_contact: !!p.contact_value,
        contact_type: p.contact_value ? p.contact_type : undefined,
        has_reply: !!p.reply_note,
        invite_token: token,
      });
      const rows: ResultRow[] = [{ k: SR.recipientResult.placeChosen, v: p.place }];
      if (p.contact_value) rows.push({ k: p.contact_type, v: p.contact_value, contact: true });
      if (p.reply_note) rows.push({ k: SR.result.labels.note, v: p.reply_note, quote: true });
      setOutcome({ accepted: true, rows });
      setStep('result');
    } catch (err) {
      onRespondError(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitReject(p: RejectPayload) {
    setBusy(true);
    setError(null);
    try {
      await store.respond(token, { decision: 'declined', reason: p.reason, reason_note: p.reason_note || undefined });
      track('invite_declined', { mode: view?.mode, reason: p.reason, has_note: !!p.reason_note, invite_token: token });
      const rows: ResultRow[] = [{ k: SR.result.labels.reason, v: p.reason }];
      if (p.reason_note) rows.push({ k: SR.result.labels.note, v: p.reason_note, quote: true });
      setOutcome({ accepted: false, rows });
      setStep('result');
    } catch (err) {
      onRespondError(err);
    } finally {
      setBusy(false);
    }
  }

  const ownCta = (
    <button
      className="btn btn-primary"
      onClick={() => {
        track('recipient_create_own_clicked', { invite_token: token });
        router.push('/');
      }}
    >
      {SR.recipientResult.ownCta}
    </button>
  );

  const aside = (() => {
    switch (step) {
      case 'reveal':
        return <BrandAside icon={<PlaneIcon size={80} />} caption={SR.aside.reveal} />;
      case 'accept':
        return <BrandAside icon={<CheckIcon size={78} />} caption={SR.aside.accept} />;
      case 'reject':
        return <BrandAside icon={<RainIcon size={78} />} caption={SR.aside.reject} calm />;
      case 'result':
        return outcome?.accepted ? (
          <BrandAside icon={<CheckIcon size={78} />} caption={SR.aside.result} />
        ) : (
          <BrandAside icon={<RainIcon size={78} />} caption={SR.aside.result} calm />
        );
      case 'expired':
      case 'notfound':
      case 'closed':
        return <BrandAside icon={<EnvelopeIcon size={82} />} caption={SR.aside.gone} />;
      case 'receive':
        return <BrandAside icon={<EnvelopeIcon size={82} />} caption={SR.aside.receive} />;
      default:
        return <BrandAside icon={<EnvelopeIcon size={82} />} caption={SR.aside.loading} />;
    }
  })();

  return (
    <PhoneShell showThemeSwitcher={false} onDevFill={isDev ? () => setFillSignal((s) => s + 1) : undefined} aside={aside}>
      {step === 'loading' && <LoadingScreen key="loading" />}
      {step === 'notfound' && (
        <InfoScreen
          key="notfound"
          title={SR.notFound.title}
          sub={SR.notFound.sub}
          cta={{ label: SR.notFound.cta, onClick: () => router.push('/') }}
        />
      )}
      {step === 'expired' && (
        <InfoScreen
          key="expired"
          title={SR.expired.title}
          sub={SR.expired.sub}
          cta={{ label: SR.expired.cta, onClick: () => router.push('/') }}
        />
      )}
      {step === 'closed' && (
        <InfoScreen
          key="closed"
          title={SR.alreadyResponded.title}
          sub={
            view?.decision === 'accepted'
              ? SR.alreadyResponded.subAccepted
              : view?.decision === 'declined'
                ? SR.alreadyResponded.subDeclined
                : SR.alreadyResponded.sub
          }
          cta={{ label: SR.alreadyResponded.cta, onClick: () => router.push('/') }}
        />
      )}
      {step === 'receive' && view && (
        <ReceiveScreen
          key="receive"
          view={view}
          onPrimary={view.mode === 'friend' ? goReveal : startAccept}
          onDecline={startReject}
          busy={busy}
          preview={preview}
          error={error}
          onExitPreview={() => router.back()}
        />
      )}
      {step === 'reveal' && reveal && (
        <RevealScreen key="reveal" reveal={reveal} onAccept={startAccept} onReject={startReject} />
      )}
      {step === 'accept' && view && (
        <AcceptScreen
          key="accept"
          places={view.places}
          onSubmit={submitAccept}
          onBack={() => setStep(view.mode === 'friend' ? 'reveal' : 'receive')}
          busy={busy}
          error={error}
          fillSignal={fillSignal}
        />
      )}
      {step === 'reject' && (
        <RejectScreen key="reject" onSubmit={submitReject} onBack={() => setStep('receive')} busy={busy} error={error} fillSignal={fillSignal} />
      )}
      {step === 'result' && outcome && (
        <ResultScreen
          key="result"
          accepted={outcome.accepted}
          title={outcome.accepted ? SR.recipientResult.acceptTitle : SR.recipientResult.declineTitle}
          rows={outcome.rows}
          note={outcome.accepted ? SR.recipientResult.acceptNote : SR.recipientResult.declineNote}
          rating={<AppRating context="recipient" />}
          footer={ownCta}
        />
      )}
    </PhoneShell>
  );
}
