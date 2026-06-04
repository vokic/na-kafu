'use client';

import { useTheme } from '@/state/ThemeProvider';
import { SR, COPY } from '@/lib/i18n';
import type { ThemeName } from '@/lib/types';
import { isValidEmail, type Draft } from './draft';

const THEMES: ThemeName[] = ['light', 'dark', 'pink', 'peach', 'holo', 'aurora'];

export default function BuildScreen({
  draft,
  onChange,
  onBack,
  onSubmit,
  busy,
}: {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  onBack: () => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const c = COPY[draft.mode];
  const canSubmit =
    !!draft.to.trim() &&
    !!draft.msg.trim() &&
    !!draft.from.trim() &&
    isValidEmail(draft.email) &&
    draft.places.length >= 2;

  function togglePlace(p: string) {
    const has = draft.places.includes(p);
    onChange({ places: has ? draft.places.filter((x) => x !== p) : [...draft.places, p] });
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => onChange({ photo: String(ev.target?.result ?? '') });
    r.readAsDataURL(f);
  }

  return (
    <section className="screen on">
      <div className="seg modeseg">
        <button type="button" className={draft.mode === 'direct' ? 'on' : ''} onClick={() => onChange({ mode: 'direct' })}>
          {SR.build.mode.direct}
        </button>
        <button type="button" className={draft.mode === 'friend' ? 'on' : ''} onClick={() => onChange({ mode: 'friend' })}>
          {SR.build.mode.friend}
        </button>
      </div>

      <h1 className="sm">
        {SR.build.heading.l1} <span className="offset">{SR.build.heading.l2}</span>
      </h1>

      <div className="stagger" style={{ overflowY: 'auto', margin: '0 -22px', padding: '8px 22px 0' }}>
        <div>
          <label className="label">{SR.build.fields.name}</label>
          <input type="text" value={draft.to} placeholder="Mila" onChange={(e) => onChange({ to: e.target.value })} />
        </div>

        <div>
          <label className="label">{SR.build.fields.message}</label>
          <textarea value={draft.msg} onChange={(e) => onChange({ msg: e.target.value })} />
        </div>

        <div>
          <label className="label">
            {SR.build.fields.places} <small>· {SR.build.fields.placesHint}</small>
          </label>
          <div className="chips">
            {SR.places.map((p) => (
              <button
                key={p}
                type="button"
                className={`chip${draft.places.includes(p) ? ' sel' : ''}`}
                onClick={() => togglePlace(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">
            {SR.build.fields.signature} <small>{c.potpis}</small>
          </label>
          <input
            type="text"
            value={draft.from}
            placeholder="Marko @marko"
            onChange={(e) => onChange({ from: e.target.value })}
          />
        </div>

        <div>
          <label className="label">
            {SR.build.fields.email} <small>· {SR.build.fields.emailHint}</small>
          </label>
          <input
            type="text"
            inputMode="email"
            value={draft.email}
            placeholder="ti@mejl.com"
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </div>

        <div>
          <label className="label">
            {SR.build.fields.about} <small>· {SR.build.fields.opt}</small>
          </label>
          <textarea
            value={draft.about}
            placeholder={SR.build.aboutPlaceholder}
            onChange={(e) => onChange({ about: e.target.value })}
          />
        </div>

        <div>
          <label className="label">
            {SR.build.fields.photo} <small>· {SR.build.fields.opt}</small>
          </label>
          <div className="photorow">
            <label className="photobtn">
              {SR.build.addPhoto}
              <input type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
            </label>
            <div
              className={`photoprev${draft.photo ? ' has' : ''}`}
              style={draft.photo ? { backgroundImage: `url("${draft.photo}")` } : undefined}
            />
          </div>
        </div>

        <div>
          <label className="label">{SR.build.fields.theme}</label>
          <div className="themepick">
            {THEMES.map((t) => (
              <button
                key={t}
                type="button"
                className={`sw ${t}${theme === t ? ' on' : ''}`}
                aria-label={t}
                onClick={() => setTheme(t)}
              />
            ))}
          </div>
        </div>

        <div className="hintbar" dangerouslySetInnerHTML={{ __html: c.hint }} />
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" disabled={!canSubmit || busy} onClick={onSubmit}>
          {busy ? '…' : c.send}
        </button>
        <button className="btn btn-ghost" onClick={onBack}>
          {SR.build.back}
        </button>
      </div>
    </section>
  );
}
