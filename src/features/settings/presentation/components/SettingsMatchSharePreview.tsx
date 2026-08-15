type Props = {
  enabled: boolean;
  watermark: string;
  leagueFallback: string;
  accent: string;
};

const HEX_RE = /^#[0-9a-f]{6}$/i;

function hexToRgb(hex: string): string {
  const value = HEX_RE.test(hex) ? hex : '#e4002b';
  const r = Number.parseInt(value.slice(1, 3), 16);
  const g = Number.parseInt(value.slice(3, 5), 16);
  const b = Number.parseInt(value.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

/** Mirrors the real card built server-side in src/pages/api/matches/[id]/og.png.ts, at reduced scale. */
export default function SettingsMatchSharePreview({ enabled, watermark, leagueFallback, accent }: Props) {
  const accentHex = HEX_RE.test(accent) ? accent : '#e4002b';
  const rgb = hexToRgb(accentHex);

  return (
    <div className="eb-settings-seo-preview">
      <div className="eb-settings-seo-preview-title">Share card preview</div>
      {!enabled ? (
        <p className="eb-session-history-muted">Auto share cards are off — shared match links will use the site&apos;s default share image instead.</p>
      ) : (
        <div
          style={{
            width: '100%',
            maxWidth: 480,
            aspectRatio: '1200 / 630',
            borderRadius: 10,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '18px 28px',
            fontFamily: "'Archivo', sans-serif",
            color: '#f8fafc',
            backgroundColor: '#0f0d18',
            backgroundImage: `radial-gradient(circle at 50% 0%, rgba(${rgb}, 0.20) 0%, rgba(${rgb}, 0) 55%), linear-gradient(180deg, #0f0d18 0%, #14111f 100%)`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ padding: '4px 14px', border: `1px solid rgba(${rgb}, 0.45)`, borderRadius: 999, background: 'rgba(255,255,255,0.04)', color: accentHex, fontSize: 9, fontWeight: 700, letterSpacing: 3 }}>
              {leagueFallback.toUpperCase() || 'LEAGUE'}
            </span>
            <span style={{ color: '#94a3b8', fontSize: 9, fontWeight: 600, letterSpacing: 1.5 }}>SAT MAR 14 2026 · 4:00 PM</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>Home</span>
              <span style={{ fontSize: 42, fontWeight: 900, color: accentHex }}>82</span>
            </div>
            <div style={{ width: 1, height: '55%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>Away</span>
              <span style={{ fontSize: 42, fontWeight: 900, color: '#64748b' }}>76</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 12px', background: 'rgba(16, 185, 129, 0.18)', border: '1px solid rgba(16, 185, 129, 0.5)', borderRadius: 999, color: '#34d399', fontSize: 9, fontWeight: 800, letterSpacing: 1.5 }}>
              FINAL
            </span>
            <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: accentHex, fontSize: 10, fontWeight: 800, letterSpacing: 2 }}>{watermark || 'ELEVATEBALLERS.COM'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
