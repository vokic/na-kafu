'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneShell from '@/components/PhoneShell';
import InfoScreen from '@/components/InfoScreen';
import SentScreen from '@/screens/sender/SentScreen';
import { useTheme } from '@/state/ThemeProvider';
import { KEYS, readJSON } from '@/lib/data/persistence';
import { store } from '@/lib/data';
import { SR } from '@/lib/i18n';
import type { Mode } from '@/lib/types';

interface LastCreated {
  invite_token: string;
  manage_token: string;
  share_url: string;
  manage_url: string;
  mode: Mode;
  to: string;
}

// Standalone /sent route — survives refresh/deep-link by reading the last created invite.
export default function SentRoute() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [last, setLast] = useState<LastCreated | null>(null);
  const [state, setState] = useState<'loading' | 'empty' | 'ready'>('loading');
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const l = readJSON<LastCreated>(KEYS.last);
    if (!l) {
      setState('empty');
      return;
    }
    setLast(l);
    store
      .getManage(l.manage_token)
      .then((d) => setTheme(d.invite.theme))
      .catch(() => {});
    setState('ready');
  }, [setTheme]);

  if (state === 'loading') {
    return (
      <PhoneShell showThemeSwitcher={false}>
        <InfoScreen title={SR.loading} />
      </PhoneShell>
    );
  }
  if (state === 'empty' || !last) {
    return (
      <PhoneShell showThemeSwitcher={false}>
        <InfoScreen
          title={SR.notFound.title}
          sub={SR.notFound.sub}
          cta={{ label: SR.notFound.cta, onClick: () => router.push('/') }}
        />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell showThemeSwitcher={false}>
      <SentScreen
        mode={last.mode}
        recipientName={last.to}
        shareUrl={last.share_url}
        onPreview={() => router.push(`/p/${last.invite_token}`)}
        onReset={() => router.push('/')}
      />
    </PhoneShell>
  );
}
