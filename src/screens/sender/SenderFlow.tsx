'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneShell from '@/components/PhoneShell';
import DevFill from '@/components/DevFill';
import { useTheme } from '@/state/ThemeProvider';
import { store } from '@/lib/data';
import { isDev } from '@/lib/devFlag';
import { KEYS } from '@/lib/data/persistence';
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

  return (
    <PhoneShell
      showThemeSwitcher
      topRight={devDemo}
      overlay={isDev && step === 'build' ? <DevFill onFill={setDraft} /> : null}
    >
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
