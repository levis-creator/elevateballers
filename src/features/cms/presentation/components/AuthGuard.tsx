import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side authentication guard
 * Checks if user is authenticated before rendering children
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        setAuthenticated(true);
      } else {
        // Redirect to login
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = '/admin/login';
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!authenticated) {
    return null; // Redirect will happen
  }

  return <>{children}</>;
}
