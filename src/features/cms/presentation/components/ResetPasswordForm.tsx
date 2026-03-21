import { useEffect, useState, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';

const MIN_PASSWORD_LENGTH = 10;

export default function ResetPasswordForm() {
  const [icons, setIcons] = useState<{
    Basketball?: ComponentType<any>;
    Lock?: ComponentType<any>;
    ArrowRight?: ComponentType<any>;
    ArrowLeft?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
    Loader2?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Basketball: mod.Basketball,
        Lock: mod.Lock,
        ArrowRight: mod.ArrowRight,
        ArrowLeft: mod.ArrowLeft,
        AlertCircle: mod.AlertCircle,
        Loader2: mod.Loader2,
      });
    });
  }, []);

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token') || '';
    setToken(tokenParam);
    if (!tokenParam) {
      setError('Reset token is missing. Please request a new link.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Reset token is missing. Please request a new link.');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (!/[A-Z]/.test(password)) { setError('Password must contain at least one uppercase letter.'); return; }
    if (!/[a-z]/.test(password)) { setError('Password must contain at least one lowercase letter.'); return; }
    if (!/\d/.test(password))    { setError('Password must contain at least one number.'); return; }
    if (!/[^A-Za-z0-9]/.test(password)) { setError('Password must contain at least one special character.'); return; }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }

      setSuccess('Password updated. Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 1500);
    } catch (err) {
      console.error('Reset password error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const BasketballIcon = icons.Basketball;
  const LockIcon = icons.Lock;
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
          <p className="text-muted-foreground text-sm">Create a new password</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error ? (
          <Alert variant="destructive">
            {AlertCircleIcon ? <AlertCircleIcon className="h-4 w-4" /> : null}
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {success ? (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold">
              New Password
            </Label>
            <div className="relative">
              {LockIcon ? (
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              ) : null}
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter a new password"
                autoComplete="new-password"
                className="pl-10"
              />
            </div>
            <PasswordStrengthMeter password={password} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold">
              Confirm Password
            </Label>
            <div className="relative">
              {LockIcon ? (
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              ) : null}
              <Input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
                className="pl-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full uppercase tracking-wide"
            disabled={loading || !token}
            size="lg"
          >
            {loading ? (
              <>
                {Loader2Icon ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
                Updating...
              </>
            ) : (
              <>
                Update password
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
