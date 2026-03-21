import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { ShieldAlert, AlertCircle } from 'lucide-react';
import { useStore } from '@/store';
import type { UserRole } from '@/types';

export default function Login() {
  const [, setLocation] = useLocation();
  const login = useStore(s => s.login);
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
      const demoAccounts = [
        { badge: '102934', password: 'demo1234', role: 'Super Admin' as UserRole },
        { badge: '104822', password: 'demo1234', role: 'IT' as UserRole },
        { badge: '103618', password: 'demo1234', role: 'User' as UserRole },
        { badge: '108291', password: 'demo1234', role: 'User' as UserRole },
        { badge: '105477', password: 'demo1234', role: 'User' as UserRole },
        { badge: '107543', password: 'demo1234', role: 'User' as UserRole },
      ];
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!badge.trim() || !password.trim()) {
      setError('Please enter your badge number and password.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const result = login(badge.trim(), password.trim());
      setIsLoading(false);
      if (!result.success) {
        setError(result.error || 'Invalid credentials. Please try again.');
        return;
      }
      routeUser(useStore.getState().currentUser);
    }, 400);
  };

  return (
    <div style={styles.safe}>
      <div style={styles.scrollContent}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <div style={styles.iconCircle}>
            <ShieldAlert style={{ width: 32, height: 32, color: '#5B3A8E' }} />
          </div>
          <h1 style={styles.title}>KEAS</h1>
          <p style={styles.subtitle}>Khurais Emergency Alert System</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Badge Number</label>
            <input
              type="text"
              placeholder="Enter your badge number"
              value={badge}
              onChange={e => setBadge(e.target.value)}
              style={styles.input}
              inputMode="numeric"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          {error && (
            <div style={styles.errorRow}>
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, color: '#DC2626' }} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.loginButton,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <div style={styles.spinner} />
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Register link */}
        <div style={styles.linkRow}>
          <Link href="/mobile/register" style={styles.linkText}>
            Don't have an account?{' '}
            <span style={styles.linkHighlight}>Register</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  safe: {
    minHeight: '100vh',
    backgroundColor: '#F5F6F8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
    padding: '40px 32px',
  },

  // Logo
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 9999,
    backgroundColor: 'rgba(91, 58, 142, 0.08)',
    border: '1px solid rgba(91, 58, 142, 0.16)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    color: '#1F2937',
    letterSpacing: 4,
    margin: 0,
    fontFamily: "'Inter', sans-serif",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: 400,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center' as const,
    fontFamily: "'Inter', sans-serif",
  },

  // Form
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    width: '100%',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: '#1F2937',
    fontFamily: "'Inter', sans-serif",
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 10,
    padding: '12px 16px',
    fontSize: 15,
    color: '#111111',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  errorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 500,
    color: '#DC2626',
    textAlign: 'center' as const,
    fontFamily: "'Inter', sans-serif",
    justifyContent: 'center',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#5B3A8E',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: 15,
    padding: '14px 0',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 20,
    height: 20,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#FFFFFF',
    borderRadius: 9999,
    animation: 'spin 0.6s linear infinite',
  },

  // Register link
  linkRow: {
    marginTop: 32,
    textAlign: 'center' as const,
  },
  linkText: {
    fontSize: 13,
    fontWeight: 400,
    color: '#6B7280',
    textDecoration: 'none',
    fontFamily: "'Inter', sans-serif",
  },
  linkHighlight: {
    color: '#5B3A8E',
    fontWeight: 600,
  },
};
