import React from 'react';
import { useLocation, Link } from 'wouter';
import { AlertTriangle, CheckCircle2, Phone, Clock, ArrowLeft, Siren } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useStore, useShallow } from '@/store';

export default function MobileAlert() {
  const [, navigate] = useLocation();
  const { alerts, mobileUserResponse, respondToAlert } = useStore(useShallow(s => ({
    alerts: s.alerts,
    mobileUserResponse: s.mobileUserResponse,
    respondToAlert: s.respondToAlert,
  })));

  const alert = alerts.find(a => a.isActive) || alerts[0];

  if (!alert) {
    return (
      <div className="min-h-screen bg-background flex justify-center">
        <div className="w-full max-w-[428px] bg-background flex items-center justify-center">
          <p className="text-muted-foreground">No active alert.</p>
        </div>
      </div>
    );
  }

  if (mobileUserResponse === 'confirmed') {
    return (
      <div className="min-h-screen bg-background flex justify-center">
        <div className="w-full max-w-[428px] bg-background border-x border-border/40 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-28 h-28 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center mb-6 animate-pulse">
            <CheckCircle2 className="w-16 h-16 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">Response Recorded</h2>
          <p className="text-muted-foreground text-sm mb-2">You have confirmed your safety.</p>
          <p className="text-xs text-muted-foreground/60 mb-10">
            Recorded at {format(new Date(), 'HH:mm, dd MMM yyyy')}
          </p>
          <div className="w-full space-y-3">
            <div className="bg-card rounded-xl p-4 border border-border/60 text-left space-y-1">
              <p className="text-xs text-muted-foreground">Active Alert</p>
              <p className="font-semibold text-foreground">{alert.title}</p>
              <p className="text-xs text-muted-foreground">{alert.zone} Zone</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate('/mobile/home')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mobileUserResponse === 'need_help') {
    return (
      <div className="min-h-screen bg-background flex justify-center">
        <div className="w-full max-w-[428px] bg-background border-x border-border/40 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-28 h-28 rounded-full bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center mb-6">
            <Phone className="w-14 h-14 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-amber-400 mb-2">Help Request Sent</h2>
          <p className="text-muted-foreground text-sm mb-2">Emergency coordinator has been notified.</p>
          <p className="text-xs text-muted-foreground/60 mb-10">Stay where you are and wait for assistance.</p>
          <Button variant="outline" className="w-full" onClick={() => navigate('/mobile/home')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[428px] bg-background border-x border-border/40 flex flex-col overflow-hidden">
        {/* Emergency Header */}
        <div className="relative bg-primary/95 px-5 pt-12 pb-8 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_10px,rgba(0,0,0,0.05)_10px,rgba(0,0,0,0.05)_20px)]" />
          <div className="relative z-10">
            <Link href="/mobile/home" className="inline-flex items-center gap-1 text-white/70 text-xs mb-4 hover:text-white">
              <ArrowLeft className="w-3.5 h-3.5" />
              Home
            </Link>
            <div className="flex items-center gap-2 mb-3">
              <Siren className="w-7 h-7 text-white animate-pulse" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/80">Emergency Alert</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-1">{alert.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">{alert.type}</span>
              <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">{alert.zone} Zone</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 space-y-4">
          <div className="bg-card rounded-xl p-4 border border-border/60">
            <p className="text-xs text-muted-foreground mb-2">ALERT MESSAGE</p>
            <p className="text-sm text-foreground leading-relaxed">{alert.message}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card rounded-xl p-3.5 border border-border/60">
            <Clock className="w-4 h-4" />
            <span>Issued at {format(new Date(alert.timestamp), 'HH:mm, EEEE d MMMM yyyy')}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-green-400">{alert.stats.confirmed}</p>
              <p className="text-[10px] text-green-400/70 font-medium mt-0.5">Confirmed</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-amber-400">{alert.stats.missing}</p>
              <p className="text-[10px] text-amber-400/70 font-medium mt-0.5">Missing</p>
            </div>
            <div className="bg-muted/50 border border-border/60 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-muted-foreground">{alert.stats.noReply}</p>
              <p className="text-[10px] text-muted-foreground/70 font-medium mt-0.5">No Reply</p>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <p className="text-xs text-muted-foreground text-center font-medium uppercase tracking-wide">Confirm Your Status</p>
            <Button
              className="w-full h-16 bg-green-600 hover:bg-green-700 text-white font-black text-lg rounded-2xl gap-3 transition-transform active:scale-[0.98]"
              onClick={() => respondToAlert('confirmed')}
            >
              <CheckCircle2 className="w-7 h-7" />
              I AM SAFE
            </Button>
            <Button
              className="w-full h-14 bg-amber-600 hover:bg-amber-700 text-white font-bold text-base rounded-2xl gap-3 transition-transform active:scale-[0.98]"
              onClick={() => respondToAlert('need_help')}
            >
              <Phone className="w-6 h-6" />
              NEED HELP
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
