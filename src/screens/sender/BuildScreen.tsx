'use client';

import { useTheme } from '@/state/ThemeProvider';
import { SR, COPY } from '@/lib/i18n';
import { THEMES } from '@/lib/types';
import { resizeImage } from '@/lib/image';
import { track } from '@/lib/analytics';
import { isValidEmail, type Draft } from './draft';

export default function BuildScreen({
  draft,
  onChange,
  onBack,
  onSubmit,
  busy,
  error,
}: {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  onBack: () => void;
  onSubmit: () => void;
  busy: boolean;
  error?: string | null;
}) {
  const { theme, setTheme } = useTheme();
  const c = COPY[draft.mode];
  const MAX_PLACES = 4;
  const placesFull = draft.places.length >= MAX_PLACES;
  const canSubmit =
    !!draft.to.trim() &&
    !!draft.msg.trim() &&
    !!draft.from.trim() &&
    isValidEmail(draft.email) &&
    draft.places.length >= 2 &&
    draft.places.length <= MAX_PLACES;

  function togglePlace(p: string) {
    const has = draft.places.includes(p);
    if (has) {
      onChange({ places: draft.places.filter((x) => x !== p) });
      return;
    }
    if (placesFull) return; // cap at 4 — block the 5th selection
    track('place_selected', { place: p, side: 'sender' });
    onChange({ places: [...draft.places, p] });
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      onChange({ photo: await resizeImage(f) }); // shrink + compress before upload
    } catch {
      const r = new FileReader(); // fallback: original
      r.onload = (ev) => onChange({ photo: String(ev.target?.result ?? '') });
      r.readAsDataURL(f);
    }
  }

  return (
    <section className="screen on">
      <div className="seg modeseg" role="group" aria-label={SR.build.mode.groupLabel}>
        <button
          type="button"
          aria-pressed={draft.mode === 'direct'}
          className={draft.mode === 'direct' ? 'on' : ''}
          onClick={() => {
            track('mode_selected', { mode: 'direct' });
            onChange({ mode: 'direct' });
          }}
        >
          {SR.build.mode.direct}
        </button>
        <button
          type="button"
          aria-pressed={draft.mode === 'friend'}
          className={draft.mode === 'friend' ? 'on' : ''}
          onClick={() => {
            track('mode_selected', { mode: 'friend' });
            onChange({ mode: 'friend' });
          }}
        >
          {SR.build.mode.friend}
        </button>
      </div>

      <div className="hintbar" style={{ marginBottom: 20 }} dangerouslySetInnerHTML={{ __html: c.hint }} />

      <h1 className="sm">
        {SR.build.heading.l1} <span className="offset" style={{ marginLeft: 0 }}>{SR.build.heading.l2}</span>
      </h1>

      <div className="stagger fieldgrid" style={{ margin: '0 -22px', padding: '8px 22px 0' }}>
        <div>
          <label className="label" htmlFor="f-name">{SR.build.fields.name}</label>
          <input id="f-name" type="text" value={draft.to} placeholder="Mila" onChange={(e) => onChange({ to: e.target.value })} />
        </div>

        <div className="span2">
          <label className="label" htmlFor="f-message">{SR.build.fields.message}</label>
          <textarea id="f-message" value={draft.msg} onChange={(e) => onChange({ msg: e.target.value })} />
          <div className="about" style={{ margin: '8px 2px 0' }}>
            {SR.build.messageHint}
          </div>
        </div>

        <div className="span2">
          <label className="label" id="f-places-label">
            {SR.build.fields.places} <small>· {SR.build.fields.placesHint}</small>
          </label>
          <div className="chips" role="group" aria-labelledby="f-places-label">
            {SR.places.map((p) => {
              const sel = draft.places.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  className={`chip${sel ? ' sel' : ''}`}
                  disabled={!sel && placesFull}
                  onClick={() => togglePlace(p)}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="f-signature">
            {SR.build.fields.signature} <small>{c.potpis}</small>
          </label>
          <input
            id="f-signature"
            type="text"
            value={draft.from}
            placeholder="Marko @marko"
            onChange={(e) => onChange({ from: e.target.value })}
          />
        </div>

        <div>
          <label className="label" htmlFor="f-email">
            {SR.build.fields.email} <small>· {SR.build.fields.emailHint}</small>
          </label>
          <input
            id="f-email"
            type="text"
            inputMode="email"
            value={draft.email}
            placeholder="ti@mejl.com"
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </div>

        <div className="span2">
          <label className="label" htmlFor="f-about">
            {SR.build.fields.about} <small>· {SR.build.fields.opt}</small>
          </label>
          <textarea
            id="f-about"
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

        <div className="span2">
          <label className="label" id="f-theme-label">{SR.build.fields.theme}</label>
          <div className="themepick" role="group" aria-labelledby="f-theme-label">
            {THEMES.map((t) => (
              <button
                key={t}
                type="button"
                className={`sw ${t}${theme === t ? ' on' : ''}`}
                aria-label={SR.build.themeNames[t]}
                aria-pressed={theme === t}
                onClick={() => {
                  track('theme_changed', { theme: t, where: 'build' });
                  setTheme(t);
                }}
              />
            ))}
          </div>
        </div>

      </div>

      {error && (
        <div className="formerror" role="alert">
          {error}
        </div>
      )}

      <div className="btn-row">
        <button className="btn btn-primary" disabled={!canSubmit || busy} onClick={onSubmit}>
          {busy ? <span className="spinner" /> : c.send}
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            track('back_clicked', { from: 'build' });
            onBack();
          }}
        >
          {SR.build.back}
        </button>
      </div>
    </section>
  );
}
