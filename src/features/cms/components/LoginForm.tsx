import { useState, useEffect, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginForm() {
  const [icons, setIcons] = useState<{
    Basketball?: ComponentType<any>;
    Mail?: ComponentType<any>;
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
        Mail: mod.Mail,
        Lock: mod.Lock,
        ArrowRight: mod.ArrowRight,
        ArrowLeft: mod.ArrowLeft,
        AlertCircle: mod.AlertCircle,
        Loader2: mod.Loader2,
      });
    });
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Redirect to admin dashboard
      window.location.href = '/admin';
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const BasketballIcon = icons.Basketball;
  const MailIcon = icons.Mail;
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
          <p className="text-muted-foreground text-sm">Admin Login</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            {AlertCircleIcon ? <AlertCircleIcon className="h-4 w-4" /> : null}
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">
              Email Address
            </Label>
            <div className="relative">
              {MailIcon ? (
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              ) : null}
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="admin@elevateballers.com"
                autoComplete="email"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold">
              Password
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
                placeholder="Enter your password"
                autoComplete="current-password"
                className="pl-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full uppercase tracking-wide"
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <>
                {Loader2Icon ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
                Signing in...
              </>
            ) : (
              <>
                Sign In
                {ArrowRightIcon ? <ArrowRightIcon className="ml-2 h-4 w-4" /> : null}
              </>
            )}
          </Button>
        </form>

        <div className="pt-6 border-t text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {ArrowLeftIcon ? <ArrowLeftIcon className="h-4 w-4" /> : null}
            <span>Back to website</span>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
