import { useState } from 'react';
import { ShieldCheck, ArrowRight, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

export default function OtpForm() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setError('Please enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Verification failed. Please try again.');
        return;
      }

      setTimeout(() => {
        window.location.href = '/admin';
      }, 100);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600 shadow-lg shadow-red-600/30 mb-5">
            <img src="/images/Elevate_Icon-200x200.png" alt="Elevate Ballers" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-widest uppercase" style={{ fontFamily: 'Teko, sans-serif' }}>
            Elevate Ballers
          </h1>
        </div>

        {/* Card */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-600/10 border border-red-600/20 mb-3">
              <ShieldCheck className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-white font-semibold text-lg">Two-Step Verification</h2>
            <p className="text-gray-400 text-sm mt-1">
              Enter the 6-digit code sent to your email to complete sign-in.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                disabled={loading}
                placeholder="000000"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-4 text-center text-3xl tracking-[0.6em] font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.trim().length !== 6}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm uppercase tracking-widest transition-colors shadow-lg shadow-red-600/20 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <a
            href="/admin/login"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </a>
        </div>

      </div>
    </div>
  );
}
