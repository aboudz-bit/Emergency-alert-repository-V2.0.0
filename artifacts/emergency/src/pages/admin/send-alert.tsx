import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import type { AlertType, ZoneType } from '@/types';
import { useStore, useShallow } from '@/store';
import { useLocation } from 'wouter';
import { ShieldAlert, Send, Clock, MapPin, Smartphone } from 'lucide-react';
import { cn } from '@/components/shared/Badges';

const alertTypes: { type: AlertType; desc: string; isCritical: boolean }[] = [
  { type: 'Blackout', desc: 'Total power loss in facility', isCritical: true },
  { type: 'Shelter-in', desc: 'Toxic gas or environmental hazard', isCritical: true },
  { type: 'Security Alert', desc: 'Unauthorized access or threat', isCritical: true },
  { type: 'Restricted Movement', desc: 'Limit personnel movement', isCritical: false },
  { type: 'Drill', desc: 'Scheduled emergency practice', isCritical: false },
  { type: 'Custom', desc: 'Write a custom alert message', isCritical: false },
];

const defaultMessages: Record<AlertType, string> = {
  'Blackout': 'A blackout condition has been detected. All personnel must immediately proceed to their designated muster points and await further instructions.',
  'Shelter-in': 'A hazardous condition has been detected. All personnel must shelter in place immediately. Do not leave your current location until further notice.',
  'Security Alert': 'A security incident is in progress. Remain indoors, lock all doors and windows, and await further instructions from security personnel.',
  'Restricted Movement': 'Movement across zones is currently restricted. Remain at your current location and await further instructions.',
  'Drill': 'This is an emergency evacuation drill. Proceed to your designated muster points in a calm and orderly fashion. This is only a drill.',
  'Custom': '',
  'All Clear': 'The emergency condition has been resolved. All personnel may return to normal operations.',
};

export default function SendAlert() {
  const [, setLocation] = useLocation();
  const { createAlert, currentUser } = useStore(useShallow(s => ({
    createAlert: s.createAlert,
    currentUser: s.currentUser,
  })));

  const [type, setType] = useState<AlertType>('Blackout');
  const [zone, setZone] = useState<ZoneType>('CPF');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [message, setMessage] = useState(defaultMessages['Blackout']);
  const [isSending, setIsSending] = useState(false);

  const handleTypeChange = (t: AlertType) => {
    setType(t);
    setMessage(defaultMessages[t]);
  };

  const handleSend = () => {
    if (!confirm(`Are you sure you want to broadcast a ${type} alert to ${zone}?`)) return;

    setIsSending(true);
    setTimeout(() => {
      createAlert({
        type,
        zone,
        title: `${type.toUpperCase()} ACTIVATED`,
        message,
        timestamp: new Date().toISOString(),
        sentBy: currentUser?.name || 'Unknown Admin',
        priority,
      });
      setIsSending(false);
      setLocation('/admin/alert-monitor');
    }, 800);
  };

  return (
    <AdminLayout title="Broadcast Emergency Alert">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">

        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          <div className="bg-card border border-border rounded-xl p-4 lg:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-6">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Alert Configuration
            </h2>

            <div className="space-y-5 lg:space-y-6">
              {/* Alert Type */}
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 lg:mb-3 block">1. Select Emergency Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 lg:gap-3">
                  {alertTypes.map(at => (
                    <button
                      key={at.type}
                      onClick={() => handleTypeChange(at.type)}
                      className={cn(
                        'p-3 lg:p-4 rounded-lg border text-left transition-all',
                        type === at.type
                          ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                          : 'bg-background border-border hover:border-muted-foreground',
                      )}
                    >
                      <div className="font-bold text-foreground mb-1 flex items-center justify-between">
                        {at.type}
                        {at.isCritical && <span className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{at.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone */}
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 lg:mb-3 block">2. Target Zone</label>
                <div className="flex gap-2 lg:gap-3">
                  {(['CPF', 'Camp', 'Both'] as ZoneType[]).map(z => (
                    <button
                      key={z}
                      onClick={() => setZone(z)}
                      className={cn(
                        'flex-1 py-3 px-4 rounded-lg border font-bold transition-all flex items-center justify-center gap-2',
                        zone === z
                          ? 'bg-card text-foreground border-foreground shadow-sm'
                          : 'bg-background border-border text-muted-foreground hover:bg-card',
                      )}
                    >
                      <MapPin className="w-4 h-4" />
                      {z}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 lg:mb-3 block">3. Priority Level</label>
                <div className="flex gap-2 lg:gap-3">
                  {(['High', 'Medium', 'Low'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={cn(
                        'flex-1 py-2.5 px-4 rounded-lg border font-semibold text-sm transition-all',
                        priority === p
                          ? p === 'High' ? 'bg-destructive/10 border-destructive text-destructive'
                            : p === 'Medium' ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                            : 'bg-safe/10 border-safe text-safe'
                          : 'bg-background border-border text-muted-foreground hover:bg-card',
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 lg:mb-3 flex justify-between">
                  <span>4. Alert Message</span>
                  <span className="text-xs font-normal">Auto-generated based on type</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={5}
                  className="w-full bg-background border border-border rounded-lg p-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Column — hidden on small screens, shown on lg+ */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              Mobile Preview
            </h2>

            {/* Phone Frame */}
            <div className="w-full max-w-[320px] mx-auto aspect-[9/19] bg-black rounded-[3rem] border-8 border-border p-2 shadow-2xl relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-border rounded-b-3xl z-50" />
              <div className="flex-1 bg-background rounded-[2.5rem] overflow-hidden flex flex-col relative">
                <div className="bg-primary pt-12 pb-6 px-6 text-center shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20" />
                  <ShieldAlert className="w-12 h-12 text-white mx-auto mb-3 relative z-10 animate-pulse" />
                  <h2 className="text-2xl font-black text-white leading-tight relative z-10">{type.toUpperCase()}</h2>
                  <div className="inline-block mt-3 px-3 py-1 bg-black/30 rounded-full text-white/90 text-xs font-bold backdrop-blur-sm relative z-10">
                    ZONE: {zone}
                  </div>
                </div>
                <div className="p-6 flex-1 bg-card">
                  <p className="text-foreground font-medium text-[15px] leading-relaxed mb-4">
                    {message || 'Enter a message above...'}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Just now
                  </p>
                </div>
                <div className="p-4 bg-background border-t border-border space-y-3">
                  <div className="w-full py-4 bg-safe rounded-xl text-white font-bold text-center opacity-80 cursor-not-allowed">
                    I AM SAFE
                  </div>
                  <div className="w-full py-4 bg-amber-500 rounded-xl text-white font-bold text-center opacity-80 cursor-not-allowed">
                    NEED HELP
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={isSending || !message.trim()}
              className="w-full max-w-[320px] mx-auto bg-primary hover:bg-primary/90 text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSending ? 'BROADCASTING...' : 'BROADCAST ALERT'}
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile broadcast button */}
        <div className="lg:hidden">
          <button
            onClick={handleSend}
            disabled={isSending || !message.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSending ? 'BROADCASTING...' : 'BROADCAST ALERT'}
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
