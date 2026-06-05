'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneShell from '@/components/PhoneShell';
import { useTheme } from '@/state/ThemeProvider';
import { store } from '@/lib/data';
import { isDev } from '@/lib/devFlag';
import { SR } from '@/lib/i18n';
import { KEYS } from '@/lib/data/persistence';
import { SAMPLE_PHOTO } from '@/lib/devSamples';
import type { CreateInviteResult } from '@/lib/types';
import HomeScreen from './HomeScreen';
import BuildScreen from './BuildScreen';
import SentScreen from './SentScreen';
import { EMPTY_DRAFT, type Draft } from './draft';

type Step = 'home' | 'build' | 'sent';

export default function SenderFlow() {
  const router = useRouter();
  const { theme } = useTheme();
  const [step, setStep] = useState<Step>('home');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [result, setResult] = useState<CreateInviteResult | null>(null);
  const [busy, setBusy] = useState(false);

  const update = useCallback((patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch })), []);

  async function submit() {
    setBusy(true);
    try {
      const res = await store.createInvite({
        mode: draft.mode,
        sender_email: draft.email.trim(),
        sender_signature: draft.from.trim(),
        sender_about: draft.about.trim() || null,
        sender_photo_url: draft.photo || null,
        recipient_name: draft.to.trim(),
        message: draft.msg.trim(),
        places: draft.places,
        theme,
      });
      setResult(res);
      // Persist last-created so /sent survives a refresh / deep-link.
      try {
        window.localStorage.setItem(
          KEYS.last,
          JSON.stringify({ ...res, mode: draft.mode, to: draft.to.trim() }),
        );
      } catch {
        /* ignore */
      }
      setStep('sent');
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setDraft(EMPTY_DRAFT);
    setResult(null);
    setStep('home');
  }

  const devDemo = isDev ? (
    <button className="role" type="button" onClick={() => setStep((s) => (s === 'home' ? 'build' : 'home'))}>
      demo
    </button>
  ) : null;

  // ⚡ dev-fill: fill the build fields (keep the currently selected mode).
  const devFill = () =>
    setDraft((d) => ({
      ...d,
      to: 'Mila',
      msg: 'Video sam te na žurci kod Ane. Idemo na pravu kafu?',
      from: 'Marko @marko_ns',
      email: 'marko@mejl.com',
      about: '30, volim planinarenje, špageti i loš stand-up.',
      photo: SAMPLE_PHOTO,
      places: SR.places.slice(0, 3),
    }));

  return (
    <PhoneShell showThemeSwitcher topRight={devDemo} onDevFill={devFill}>
      {step === 'home' && <HomeScreen key="home" onStart={() => setStep('build')} />}
      {step === 'build' && (
        <BuildScreen key="build" draft={draft} onChange={update} onBack={() => setStep('home')} onSubmit={submit} busy={busy} />
      )}
      {step === 'sent' && result && (
        <SentScreen
          key="sent"
          mode={draft.mode}
          recipientName={draft.to.trim()}
          shareUrl={result.share_url}
          onPreview={() => router.push(`/p/${result.invite_token}`)}
          onReset={reset}
        />
      )}
    </PhoneShell>
  );
}
