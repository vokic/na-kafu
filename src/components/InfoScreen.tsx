'use client';

// Simple centered message screen (loading / not-found / already-responded).
export default function InfoScreen({
  title,
  sub,
  cta,
}: {
  title: string;
  sub?: string;
  cta?: { label: string; onClick: () => void };
}) {
  return (
    <section className="screen on">
      <div className="stagger" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 className="sm">{title}</h1>
        {sub && (
          <p className="lead" style={{ maxWidth: '32ch' }}>
            {sub}
          </p>
        )}
      </div>
      {cta && (
        <div className="btn-row">
          <button className="btn btn-primary" onClick={cta.onClick}>
            {cta.label}
          </button>
        </div>
      )}
    </section>
  );
}
