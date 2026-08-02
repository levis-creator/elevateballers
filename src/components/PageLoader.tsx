import { useEffect, useState } from 'react';
import { DEFAULT_PUBLIC_SYSTEM_SETTINGS, resolvePublicSystemSettings } from '@/features/settings/application/systemSettings';

export default function PageLoader() {
  const [visible, setVisible] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_PUBLIC_SYSTEM_SETTINGS);
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    let active = true;
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    const hide = () => active && setVisible(false);
    window.addEventListener('load', hide);

    void fetch('/api/settings/public?category=system')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((records) => resolvePublicSystemSettings(records))
      .catch(() => DEFAULT_PUBLIC_SYSTEM_SETTINGS)
      .then((resolved) => {
        if (!active) return;
        setSettings(resolved);
        if (document.readyState !== 'complete') {
          showTimer = setTimeout(() => active && setVisible(true), resolved.splashThreshold);
        }
      });

    const safety = setTimeout(hide, 4000);
    return () => {
      active = false;
      window.removeEventListener('load', hide);
      if (showTimer) clearTimeout(showTimer);
      clearTimeout(safety);
    };
  }, []);

  useEffect(() => {
    if (!visible || settings.loadingLines.length < 2) return;
    const interval = setInterval(() => setLineIndex((current) => (current + 1) % settings.loadingLines.length), 1200);
    return () => clearInterval(interval);
  }, [visible, settings.loadingLines]);

  if (!visible) return null;

  return (
    <div
      id="page-loader"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'opacity 0.3s ease-out',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid rgb(var(--site-brand-rgb, 221 51 51))',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }}
        />
        <p
          style={{
            fontFamily: 'Rubik, sans-serif',
            fontSize: '16px',
            color: '#363f48',
            margin: 0,
          }}
        >
          {settings.loadingLabel}...
        </p>
        <small style={{ display: 'block', marginTop: '8px', color: '#6f665c' }}>{settings.loadingLines[lineIndex] || ''}</small>
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}



