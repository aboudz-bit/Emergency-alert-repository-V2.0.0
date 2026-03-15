import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { ShieldAlert, AlertCircle } from 'lucide-react';
import { cn } from '@/components/shared/Badges';
import { useStore } from '@/store';
import type { UserRole } from '@/types';

export default function Login() {
  const [, setLocation] = useLocation();
  const login = useStore(s => s.login);
  const isAuthenticated = useStore(s => s.isAuthenticated);
  const currentUser = useStore(s => s.currentUser);

  const [role, setRole] = useState<UserRole>('Super Admin');
  const [badge, setBadge] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.role === 'Super Admin') setLocation('/admin');
      else if (currentUser.role === 'IT') setLocation('/it');
      else setLocation('/mobile/home');
    }
  }, [isAuthenticated, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const result = login(badge, password, role);
      setIsLoading(false);

      if (!result.success) {
        setError(result.error || 'Login failed.');
        return;
      }

      if (role === 'Super Admin') setLocation('/admin');
      else if (role === 'IT') setLocation('/it');
      else setLocation('/mobile/home');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-primary/10">
            <ShieldAlert className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2 tracking-tight">Khurais Emergency Alert</h1>
          <p className="text-primary font-medium tracking-wide uppercase text-sm">Authorized Personnel Only</p>
        </div>

        <div className="bg-card border border-border shadow-2xl rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Badge Number</label>
              <input
                type="text"
                placeholder="e.g. 102934"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              <p className="text-xs text-muted-foreground">Demo password: <span className="font-mono text-foreground">demo1234</span></p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="pt-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Demo Role Selector</label>
              <div className="flex bg-background rounded-lg p-1 border border-border">
                {(['User', 'IT', 'Super Admin'] as UserRole[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      'flex-1 text-sm py-2 rounded-md transition-all font-medium',
                      role === r ? 'bg-card text-foreground shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 text-center">Role determines your destination after login</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'SECURE LOGIN'
              )}
            </button>

            <div className="text-center">
              <Link
                href="/mobile/register"
                className="text-sm text-primary hover:underline font-medium"
              >
                New user? Register here
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-8">
          Emergency Alert System v2.0 &nbsp;|&nbsp; KPC Operations
        </p>
      </div>
    </div>
  );
}
