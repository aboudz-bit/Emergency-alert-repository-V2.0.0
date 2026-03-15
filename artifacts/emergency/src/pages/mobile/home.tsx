import React, { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useActiveAlert, useUsers, useUpdateUserStatus } from '@/hooks/use-api';
import { ShieldAlert, MapPin, CheckCircle2, AlertTriangle, User as UserIcon } from 'lucide-react';
import { cn } from '@/components/shared/Badges';

export default function MobileHome() {
  const { data: activeAlert } = useActiveAlert();
  const { data: users } = useUsers();
  const updateStatus = useUpdateUserStatus();
  
  // Mock logged in user (the first one)
  const me = users?.[0];
  const [justConfirmed, setJustConfirmed] = useState(false);

  const handleConfirm = () => {
    if (me) {
      updateStatus.mutate({ id: me.id, status: 'confirmed' }, {
        onSuccess: () => setJustConfirmed(true)
      });
    }
  };

  const handleNeedHelp = () => {
    if (me) {
      updateStatus.mutate({ id: me.id, status: 'need_help' });
    }
  };

  if (!me) return <MobileLayout><div className="flex items-center justify-center h-full"><div className="animate-spin w-8 h-8 border-2 border-primary rounded-full border-t-transparent" /></div></MobileLayout>;

  return (
    <MobileLayout>
      {/* Top Bar */}
      <div className="px-6 py-5 bg-card border-b border-border flex justify-between items-center z-10 relative shadow-md">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-primary" />
          <span className="font-display font-bold tracking-tight">Khurais EAS</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border">
          <span className="text-xs font-bold">{me.name.split(' ').map(n=>n[0]).join('')}</span>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {/* User Card */}
        <div className="bg-background border border-border rounded-2xl p-5 mb-6 flex flex-col items-center text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 flex items-center gap-1 text-[10px] text-safe font-bold uppercase tracking-wider bg-safe/10 rounded-bl-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" /> GPS Active
          </div>
          
          <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground mb-3">
            <UserIcon className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-foreground">{me.name}</h2>
          <p className="text-sm text-muted-foreground font-mono mb-4">Badge: {me.badge}</p>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border w-full justify-center">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">{me.zone} - {me.location}</span>
          </div>
        </div>

        {/* Dynamic Alert Area */}
        {activeAlert ? (
          <div className={cn(
            "rounded-3xl p-6 shadow-2xl transition-all duration-500 text-center relative overflow-hidden",
            justConfirmed || me.status === 'confirmed' 
              ? "bg-safe/20 border-2 border-safe" 
              : "bg-destructive/20 border-2 border-destructive animate-pulse shadow-destructive/20"
          )}>
            
            {(justConfirmed || me.status === 'confirmed') ? (
              <div className="space-y-4 animate-in zoom-in duration-300">
                <CheckCircle2 className="w-20 h-20 text-safe mx-auto" />
                <h3 className="text-2xl font-black text-safe">RESPONSE RECORDED</h3>
                <p className="text-safe/80 font-medium">You are marked as safe. Please remain at your muster point until the All Clear is given.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <AlertTriangle className="w-20 h-20 text-destructive mx-auto animate-bounce" />
                <div>
                  <div className="inline-block px-3 py-1 bg-destructive/30 rounded-full text-white text-xs font-bold mb-3 uppercase">
                    {activeAlert.zone} ZONE EMERGENCY
                  </div>
                  <h3 className="text-3xl font-black text-white leading-tight mb-2">{activeAlert.title}</h3>
                  <p className="text-white/80 text-sm leading-relaxed">{activeAlert.message}</p>
                </div>
                
                <div className="space-y-3 pt-4">
                  <button 
                    onClick={handleConfirm}
                    className="w-full py-5 bg-safe hover:bg-safe/90 text-white text-xl font-black rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-transform active:scale-95 flex flex-col items-center justify-center gap-1"
                  >
                    <span>I AM SAFE</span>
                    <span className="text-[10px] font-normal opacity-80 uppercase tracking-widest">At Muster Point</span>
                  </button>
                  <button 
                    onClick={handleNeedHelp}
                    className="w-full py-4 bg-transparent border-2 border-amber-500 text-amber-500 hover:bg-amber-500/10 text-lg font-black rounded-xl transition-transform active:scale-95"
                  >
                    NEED HELP
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-3xl p-8 border-2 border-border bg-card/50 text-center flex flex-col items-center justify-center h-64">
            <CheckCircle2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold text-muted-foreground">All is Quiet</h3>
            <p className="text-sm text-muted-foreground/60 mt-2">No active emergencies in your zone.</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
