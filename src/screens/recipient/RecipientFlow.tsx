'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneShell from '@/components/PhoneShell';
import InfoScreen from '@/components/InfoScreen';
import LoadingScreen from '@/components/LoadingScreen';
import ResultScreen, { type ResultRow } from '@/components/ResultScreen';
import AppRating from '@/components/AppRating';
import { useTheme } from '@/state/ThemeProvider';
import { store, StoreError } from '@/lib/data';
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

export default function RecipientFlow({ token }: { token: string }) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [step, setStep] = useState<Step>('loading');
  const [view, setView] = useState<RecipientView | null>(null);
  const [reveal, setReveal] = useState<RevealResult | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [fillSignal, setFillSignal] = useState(0); // ⚡ dev-fill trigger

  useEffect(() => {
    let active = true;
    store
      .getInvite(token)
      .then((v) => {
        if (!active) return;
        setView(v);
        setTheme(v.theme);
        track('invite_opened', { mode: v.mode, invite_token: token });
        setStep(v.already_responded ? 'closed' : 'receive');
      })
      .catch((err) => {
        if (!active) return;
        const expired = err instanceof StoreError && err.code === 'EXPIRED';
        track(expired ? 'invite_expired_viewed' : 'invite_notfound_viewed', { invite_token: token });
        setStep(expired ? 'expired' : 'notfound');
      });
    return () => {
      active = false;
    };
  }, [token, setTheme]);

  // Mandatory response: warn if the recipient tries to leave before choosing yes/no.
  useEffect(() => {
    const mustAnswer = step === 'receive' || step === 'reveal' || step === 'accept' || step === 'reject';
    if (!mustAnswer) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [step]);

  // route a respond error to the right screen + track it
  function onRespondError(err: unknown) {
    const code = err instanceof StoreError ? err.code : 'UNKNOWN';
    track('respond_failed', { code, invite_token: token });
    if (code === 'EXPIRED') setStep('expired');
    else if (code === 'ALREADY_RESPONDED') setStep('closed');
    else console.error(err);
  }

  const startAccept = () => {
    track('accept_started', { invite_token: token });
    setStep('accept');
  };
  const startReject = () => {
    track('reject_started', { invite_token: token });
    setStep('reject');
  };

  const goReveal = useCallback(async () => {
    setBusy(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function submitAccept(p: AcceptPayload) {
    setBusy(true);
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

  return (
    <PhoneShell showThemeSwitcher={false} onDevFill={() => setFillSignal((s) => s + 1)}>
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
          sub={SR.alreadyResponded.sub}
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
          fillSignal={fillSignal}
        />
      )}
      {step === 'reject' && (
        <RejectScreen key="reject" onSubmit={submitReject} onBack={() => setStep('receive')} busy={busy} fillSignal={fillSignal} />
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
