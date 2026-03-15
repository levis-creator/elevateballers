import { useState } from 'react';

export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
