import { useState } from 'react';
import TurnstileWidget from '../../../../components/TurnstileWidget';

const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY as string;

export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      setStatus('error');
      setMessage('Please complete the security check before submitting.');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, 'cf-turnstile-token': turnstileToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setStatus('success');
      setMessage(data.alreadySubscribed ? 'You are already subscribed!' : 'Thank you for subscribing!');
      setEmail('');
      setTurnstileToken(null);
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mc4wp-form-fields">
        <p>
          <label>Select topics and stay current with our latest news.</label>
        </p>
        <p></p>
        <div className="subscribe-wrapp">
          <input
            type="email"
            name="EMAIL"
            placeholder="E-mail address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading' || status === 'success'}
          />
          <span className="button btn-md">
            <input
              type="submit"
              value={status === 'loading' ? 'Submitting...' : 'Submit'}
              disabled={status === 'loading' || status === 'success'}
            />
          </span>
        </div>
        {TURNSTILE_SITE_KEY && (
          <TurnstileWidget
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
          />
        )}
        {message && (
          <p style={{ marginTop: '8px', color: status === 'error' ? '#e53e3e' : '#38a169', fontSize: '13px' }}>
            {message}
          </p>
        )}
        <p></p>
      </div>
      {/* Honeypot */}
      <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
    </form>
  );
}
