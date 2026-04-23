import { useState } from 'react';
import { PUBLIC_TURNSTILE_SITE_KEY } from 'astro:env/client';
import TurnstileWidget from '../../../../components/TurnstileWidget';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!turnstileToken) {
      setError('Please complete the security check before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/contact-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          'cf-turnstile-token': turnstileToken,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setFormData({ name: '', email: '', subject: '', message: '' });
      setTurnstileToken(null);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    border: '1px solid #d8d8d8',
    borderRadius: '3px',
    fontFamily: 'Rubik',
    fontSize: '14px',
  };

  return (
    <div>
      {success && (
        <div style={{
          padding: '1rem 1.25rem',
          background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
          color: '#065f46',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #6ee7b7',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p style={{ margin: 0, fontWeight: '500' }}>Message sent! We will get back to you soon.</p>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem 1.25rem',
          background: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #fecaca',
        }}>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your Name"
            required
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Your Email"
            required
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Subject"
            required
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Your Message"
            rows={6}
            required
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <TurnstileWidget
          siteKey={PUBLIC_TURNSTILE_SITE_KEY}
          onSuccess={setTurnstileToken}
          onExpire={() => setTurnstileToken(null)}
          onError={() => setTurnstileToken(null)}
        />

        <div style={{ marginTop: '10px' }}>
          <button
            type="submit"
            disabled={submitting || !turnstileToken}
            style={{
              backgroundColor: (submitting || !turnstileToken) ? '#999' : '#dd3333',
              color: '#fff',
              border: 'none',
              padding: '15px 40px',
              fontFamily: 'Teko',
              fontSize: '18px',
              textTransform: 'uppercase',
              cursor: (submitting || !turnstileToken) ? 'not-allowed' : 'pointer',
              borderRadius: '3px',
              opacity: (submitting || !turnstileToken) ? 0.5 : 1,
              transition: 'background-color 0.3s ease',
            } as React.CSSProperties}
          >
            {submitting ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </form>
    </div>
  );
}
