import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Shield, Plus, KeyRound, Power, LogOut, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/components/shared/Badges';
import { useStore, useShallow } from '@/store';

function CreateAdminModal({ onClose }: { onClose: () => void }) {
  const createSuperAdmin = useStore(s => s.createSuperAdmin);
  const [name, setName] = useState('');
  const [badge, setBadge] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = createSuperAdmin({ name, badge, password });
    if (!result.success) {
      setError(result.error || 'Failed to create account.');
    } else {
      setSuccess(true);
      setTimeout(onClose, 1200);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-bold text-foreground">Create Super Admin</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 flex flex-col items-center text-center">
            <CheckCircle2 className="w-12 h-12 text-safe mb-3" />
            <p className="font-bold text-foreground">Account Created</p>
            <p className="text-sm text-muted-foreground mt-1">The Super Admin account is ready.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g. Sultan Al-Yami"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Badge Number</label>
              <input
                value={badge}
                onChange={e => setBadge(e.target.value)}
                required
                maxLength={6}
                placeholder="6-digit badge"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Temporary password"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border text-foreground rounded-lg text-sm font-semibold hover:bg-muted transition-colors">
                Cancel
              </button>
              <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
                Create Account
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ItDashboard() {
  const [, setLocation] = useLocation();
  const [showModal, setShowModal] = useState(false);
  const { logout, toggleAccountStatus, resetPassword, users } = useStore(useShallow(s => ({
    logout: s.logout,
    toggleAccountStatus: s.toggleAccountStatus,
    resetPassword: s.resetPassword,
    users: s.users,
  })));
  const admins = users.filter(u => u.role === 'Super Admin' || u.role === 'IT');

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const handleResetPassword = (userId: number, name: string) => {
    if (confirm(`Reset password for ${name}? They will need to use the default password 'demo1234'.`)) {
      resetPassword(userId, 'demo1234');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showModal && <CreateAdminModal onClose={() => setShowModal(false)} />}

      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground font-display">IT Administration</h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">System Administrators</h2>
            <p className="text-muted-foreground">Manage high-level access to the emergency system.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Super Admin
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-background/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-5 font-semibold">Name</th>
                <th className="p-5 font-semibold">Badge ID</th>
                <th className="p-5 font-semibold">Role</th>
                <th className="p-5 font-semibold">Status</th>
                <th className="p-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="p-5 font-medium text-foreground">{admin.name}</td>
                  <td className="p-5 text-muted-foreground font-mono">{admin.badge}</td>
                  <td className="p-5">
                    <span className="px-2 py-1 rounded bg-background border border-border text-xs font-semibold text-foreground">
                      {admin.role}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit',
                      admin.accountStatus === 'active'
                        ? 'bg-safe/10 text-safe border-safe/20'
                        : 'bg-muted text-muted-foreground border-border',
                    )}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                      {admin.accountStatus === 'active' ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-5 flex justify-end gap-2">
                    <button
                      onClick={() => handleResetPassword(admin.id, admin.name)}
                      className="p-2 text-muted-foreground hover:text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors"
                      title="Reset Password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleAccountStatus(admin.id)}
                      className={cn(
                        'p-2 bg-background border border-border rounded-md transition-colors',
                        admin.accountStatus === 'active'
                          ? 'text-destructive hover:bg-destructive/10'
                          : 'text-safe hover:bg-safe/10',
                      )}
                      title={admin.accountStatus === 'active' ? 'Disable Account' : 'Enable Account'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
