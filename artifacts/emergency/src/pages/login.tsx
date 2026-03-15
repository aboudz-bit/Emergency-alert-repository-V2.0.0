import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/components/shared/Badges';

export default function Login() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<'User' | 'IT' | 'Super Admin'>('Super Admin');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      if (role === 'Super Admin') setLocation('/admin');
      else if (role === 'IT') setLocation('/it');
      else setLocation('/mobile/home');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient light */}
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
                placeholder="e.g. 142031" 
                required
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                required
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Demo Role Selector</label>
              <div className="flex bg-background rounded-lg p-1 border border-border">
                {['User', 'IT', 'Super Admin'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r as any)}
                    className={cn(
                      "flex-1 text-sm py-2 rounded-md transition-all font-medium",
                      role === r ? "bg-card text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "SECURE LOGIN"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-8">
          Emergency Alert System v1.0 <br/> KPC Operations
        </p>
      </div>
    </div>
  );
}
