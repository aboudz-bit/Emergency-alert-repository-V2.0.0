import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { ShieldAlert, AlertCircle, RotateCcw, ChevronRight } from 'lucide-react';
import { cn } from '@/components/shared/Badges';
import { useStore } from '@/store';
import type { UserRole } from '@/types';

const demoAccounts = [
  { badge: '102934', password: 'demo1234', role: 'Super Admin' as UserRole, label: 'Super Admin (Abdullah)', dest: '/admin', description: 'Full admin panel, ECO & Supervisor management' },
  { badge: '104822', password: 'demo1234', role: 'IT' as UserRole, label: 'IT Support (Khalid)', dest: '/it', description: 'IT support dashboard' },
  { badge: '103618', password: 'demo1234', role: 'User' as UserRole, label: 'ECO A (Nasser)', dest: '/eco', description: 'ECO dashboard — assigned to CPF zone' },
  { badge: '108291', password: 'demo1234', role: 'User' as UserRole, label: 'Supervisor OT-1 (Mohammed)', dest: '/supervisor', description: 'Supervisor dashboard — OT-1 location' },
  { badge: '105477', password: 'demo1234', role: 'User' as UserRole, label: 'Backup Supervisor OT-1 (Faisal)', dest: '/supervisor', description: 'Supervisor dashboard (read-only) — OT-1 backup' },
  { badge: '107543', password: 'demo1234', role: 'User' as UserRole, label: 'Normal User (Saeed)', dest: '/mobile/home', description: 'Standard user mobile view — no special assignment' },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const login = useStore(s => s.login);
  const resetToSeedData = useStore(s => s.resetToSeedData);
  const isAuthenticated = useStore(s => s.isAuthenticated);
  const currentUser = useStore(s => s.currentUser);

  const [badge, setBadge] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const routeUser = React.useCallback((u: typeof currentUser) => {
    if (!u) return;
    let dest: string;
    if (u.role === 'Super Admin') dest = '/admin';
    else if (u.role === 'IT') dest = '/it';
    else if (u.isECOAssigned && u.ecoAssignmentActive) dest = '/eco';
    else if ((u.isSupervisorAssigned || u.isBackupSupervisorAssigned) && u.supervisorAssignmentActive) dest = '/supervisor';
    else dest = '/mobile/home';
    console.log('[ROUTE] →', dest, 'for', u.name, '| isECO:', u.isECOAssigned, 'isSup:', u.isSupervisorAssigned, 'isBackup:', u.isBackupSupervisorAssigned);
    setLocation(dest);
  }, [setLocation]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autoBadge = params.get('auto');
    if (autoBadge) {
      useStore.getState().logout();
      const account = demoAccounts.find(a => a.badge === autoBadge);
      if (account) {
        console.log('[AUTO-LOGIN] badge:', autoBadge);
        login(account.badge, account.password, account.role);
        const fresh = useStore.getState().currentUser;
        console.log('[AUTO-LOGIN] currentUser after login:', fresh?.name, 'isECO:', fresh?.isECOAssigned);
        routeUser(fresh);
      }
      return;
    }
    if (isAuthenticated && currentUser) {
      routeUser(currentUser);
    }
  }, [isAuthenticated, currentUser, routeUser]);

  const doLogin = (b: string, p: string, roleOverride?: UserRole) => {
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      const result = login(b, p, roleOverride);
      setIsLoading(false);
      if (!result.success) {
        setError(result.error || 'Login failed.');
        return;
      }
      routeUser(useStore.getState().currentUser);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(badge, password);
  };

  const handleQuickLogin = (account: typeof demoAccounts[0]) => {
    doLogin(account.badge, account.password, account.role);
  };

  const handleReset = () => {
    resetToSeedData();
    setError('');
    setBadge('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-primary/10">
            <ShieldAlert className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2 tracking-tight">Khurais Emergency Alert</h1>
          <p className="text-primary font-medium tracking-wide uppercase text-sm">Authorized Personnel Only</p>
        </div>

        <div className="bg-card border border-border shadow-2xl rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Demo Login</h2>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo Data
            </button>
          </div>

          <div className="space-y-2">
            {demoAccounts.map(account => (
              <button
                key={account.badge}
                onClick={() => handleQuickLogin(account)}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted/50 hover:border-primary/30 transition-all text-left group disabled:opacity-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{account.label}</span>
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{account.badge}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{account.description}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{account.dest}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="bg-card border border-border shadow-2xl rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Manual Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                placeholder="demo1234"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'LOGIN'
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

        <p className="text-center text-muted-foreground text-xs mt-6">
          Emergency Alert System v2.0 &nbsp;|&nbsp; KPC Operations
        </p>
      </div>
    </div>
  );
}
