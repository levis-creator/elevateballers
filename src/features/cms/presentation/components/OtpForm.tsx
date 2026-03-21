import { useState, useEffect, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function OtpForm() {
  const [icons, setIcons] = useState<{
    Basketball?: ComponentType<any>;
    ShieldCheck?: ComponentType<any>;
    ArrowRight?: ComponentType<any>;
    ArrowLeft?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
    Loader2?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Basketball: mod.Basketball,
        ShieldCheck: mod.ShieldCheck,
        ArrowRight: mod.ArrowRight,
        ArrowLeft: mod.ArrowLeft,
        AlertCircle: mod.AlertCircle,
        Loader2: mod.Loader2,
      });
    });
  }, []);

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

      // Auth token is now set — redirect to admin
      setTimeout(() => {
        window.location.href = '/admin';
      }, 100);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const BasketballIcon = icons.Basketball;
  const ShieldCheckIcon = icons.ShieldCheck;
  const ArrowRightIcon = icons.ArrowRight;
  const ArrowLeftIcon = icons.ArrowLeft;
  const AlertCircleIcon = icons.AlertCircle;
  const Loader2Icon = icons.Loader2;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center space-y-4 pb-6">
        <div className="w-20 h-20 mx-auto bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg">
          {BasketballIcon ? <BasketballIcon size={40} /> : null}
        </div>
        <div>
          <h1 className="text-4xl font-heading font-semibold mb-2 text-foreground tracking-wide">
            ELEVATE BALLERS
          </h1>
          <p className="text-muted-foreground text-sm">Two-Step Verification</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="text-center space-y-2">
          {ShieldCheckIcon ? (
            <ShieldCheckIcon className="mx-auto h-8 w-8 text-primary" />
          ) : null}
          <p className="text-sm text-muted-foreground">
            A 6-digit verification code has been sent to your email address.
            Enter it below to complete sign-in.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            {AlertCircleIcon ? <AlertCircleIcon className="h-4 w-4" /> : null}
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-semibold">
              Verification Code
            </Label>
            <Input
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
              className="text-center text-2xl tracking-[0.5em] font-mono"
            />
          </div>

          <Button
            type="submit"
            className="w-full uppercase tracking-wide"
            disabled={loading || code.trim().length !== 6}
            size="lg"
          >
            {loading ? (
              <>
                {Loader2Icon ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
                Verifying...
              </>
            ) : (
              <>
                Verify & Sign In
                {ArrowRightIcon ? <ArrowRightIcon className="ml-2 h-4 w-4" /> : null}
              </>
            )}
          </Button>
        </form>

        <div className="pt-6 border-t text-center">
          <a
            href="/admin/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {ArrowLeftIcon ? <ArrowLeftIcon className="h-4 w-4" /> : null}
            <span>Back to login</span>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
