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
        setStep(v.already_responded ? 'closed' : 'receive');
      })
      .catch((err) => {
        if (!active) return;
        setStep(err instanceof StoreError && err.code === 'EXPIRED' ? 'expired' : 'notfound');
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

  const goReveal = useCallback(async () => {
    setBusy(true);
    try {
      const r = await store.reveal(token);
      setReveal(r);
      setStep('reveal');
    } finally {
      setBusy(false);
    }
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
      const rows: ResultRow[] = [{ k: SR.recipientResult.placeChosen, v: p.place }];
      if (p.contact_value) rows.push({ k: p.contact_type, v: p.contact_value, contact: true });
      if (p.reply_note) rows.push({ k: SR.result.labels.note, v: p.reply_note, quote: true });
      setOutcome({ accepted: true, rows });
      setStep('result');
    } finally {
      setBusy(false);
    }
  }

  async function submitReject(p: RejectPayload) {
    setBusy(true);
    try {
      await store.respond(token, { decision: 'declined', reason: p.reason, reason_note: p.reason_note || undefined });
      const rows: ResultRow[] = [{ k: SR.result.labels.reason, v: p.reason }];
      if (p.reason_note) rows.push({ k: SR.result.labels.note, v: p.reason_note, quote: true });
      setOutcome({ accepted: false, rows });
      setStep('result');
    } finally {
      setBusy(false);
    }
  }

  const ownCta = (
    <button className="btn btn-primary" onClick={() => router.push('/')}>
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
          onPrimary={view.mode === 'friend' ? goReveal : () => setStep('accept')}
          onDecline={() => setStep('reject')}
          busy={busy}
        />
      )}
      {step === 'reveal' && reveal && (
        <RevealScreen key="reveal" reveal={reveal} onAccept={() => setStep('accept')} onReject={() => setStep('reject')} />
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
